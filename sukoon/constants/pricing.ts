export const PLANS = {
  monthly: {
    id: 'plan_monthly_sukoon',
    name: 'Sukoon Monthly',
    nameHi: 'सुकून मासिक',
    price: 99,
    currency: 'INR',
    interval: 'monthly',
    description: 'All premium features, cancel anytime',
    descriptionHi: 'सभी प्रीमियम सुविधाएं, कभी भी रद्द करें',
    badge: null
  },
  annual: {
    id: 'plan_annual_sukoon',
    name: 'Sukoon Annual',
    nameHi: 'सुकून वार्षिक',
    price: 999,
    currency: 'INR',
    interval: 'yearly',
    description: '₹83/month • Save ₹189 vs monthly',
    descriptionHi: '₹83/माह • मासिक से ₹189 की बचत',
    badge: 'Most Popular'
  },
  lifetime: {
    id: 'prod_lifetime_sukoon',
    name: 'Lifetime Access',
    nameHi: 'जीवनभर की पहुंच',
    price: 1999,         // EARLY BIRD
    originalPrice: 4999,
    currency: 'INR',
    interval: 'one_time',
    description: 'Pay once, use forever • Early Bird price ends soon',
    descriptionHi: 'एक बार भुगतान, हमेशा के लिए उपयोग • अर्ली बर्ड प्राइस',
    badge: '🔥 Early Bird'
  },
  student: {
    id: 'plan_student_sukoon',
    name: 'Student Plan',
    nameHi: 'स्टूडेंट प्लान',
    price: 49,
    currency: 'INR',
    interval: 'monthly',
    description: '₹49/month • For JEE, UPSC & college students',
    descriptionHi: '₹49/माह • JEE, UPSC और कॉलेज छात्रों के लिए',
    badge: '🎓 Student'
  }
};
