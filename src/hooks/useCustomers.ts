import { useState, useEffect } from 'react';
import { getCustomers, addCustomer as addCustomerDb } from '@/lib/supabase-storage';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Customer = Database['public']['Tables']['customers']['Row'];

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error: any) {
      toast.error(`Lỗi tải dữ liệu khách hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at'>) => {
    try {
      const newCustomer = await addCustomerDb(customer);
      setCustomers(prev => [newCustomer, ...prev]);
      toast.success('Đã thêm khách hàng mới');
      return newCustomer;
    } catch (error: any) {
      toast.error(`Lỗi thêm khách hàng: ${error.message}`);
      throw error;
    }
  };

  return { customers, loading, addCustomer, refreshCustomers: loadCustomers };
};
