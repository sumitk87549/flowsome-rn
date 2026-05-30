import { useAuthStore } from '../stores/authStore';

export const usePremiumGate = () => {
  const { subscription } = useAuthStore();
  
  const hasAccess = subscription?.isActive ?? false;

  return { hasAccess };
};
