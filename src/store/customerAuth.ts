import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CustomerProfile } from '../types';

export interface CustomerAuthContextValue {
  user: User | null;
  profile: CustomerProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
