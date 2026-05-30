import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

admin.initializeApp();

// Razorpay instance initialization
// Provide these in Firebase environment config:
// firebase functions:config:set razorpay.key_id="YOUR_KEY_ID" razorpay.key_secret="YOUR_SECRET"
const razorpay = new Razorpay({
  key_id: functions.config().razorpay?.key_id || 'rzp_test_YOUR_KEY_HERE',
  key_secret: functions.config().razorpay?.key_secret || 'YOUR_SECRET_HERE',
});

// 1. Create Order
export const createOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { amount, currency, receipt, notes } = data;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay takes amount in smallest unit (paise)
      currency: currency || 'INR',
      receipt: receipt || `receipt_${context.auth.uid}_${Date.now()}`,
      notes: notes || {},
    });
    
    return order;
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create order', error.message);
  }
});

// 2. Verify Payment & Update Subscription
export const verifyPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId
  } = data;

  const secret = functions.config().razorpay?.key_secret || 'YOUR_SECRET_HERE';
  
  // Verify Signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid signature');
  }

  // Update Firestore
  try {
    const expiresAt = planId === 'lifetime' ? null : Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days for others

    await admin.firestore()
      .collection('users')
      .doc(context.auth.uid)
      .collection('subscription')
      .doc('status')
      .set({
        plan: planId,
        status: 'active',
        expiresAt: expiresAt,
        razorpaySubscriptionId: razorpay_payment_id, // Simple tracking
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Firestore update error:', error);
    throw new functions.https.HttpsError('internal', 'Payment verified but database update failed', error.message);
  }
});
