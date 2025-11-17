import { useState, useEffect } from 'react';
import { getServices, addService as addServiceDb, deleteService as deleteServiceDb } from '@/lib/supabase-storage';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Service = Database['public']['Tables']['services']['Row'];

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error: any) {
      toast.error(`Lỗi tải dữ liệu dịch vụ: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const addService = async (service: Omit<Service, 'id'>) => {
    try {
      const newService = await addServiceDb(service);
      setServices(prev => [...prev, newService]);
      toast.success('Đã thêm dịch vụ mới');
      return newService;
    } catch (error: any) {
      toast.error(`Lỗi thêm dịch vụ: ${error.message}`);
      throw error;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      await deleteServiceDb(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success('Đã xóa dịch vụ');
    } catch (error: any) {
      toast.error(`Lỗi xóa dịch vụ: ${error.message}`);
      throw error;
    }
  };

  return { services, loading, addService, deleteService, refreshServices: loadServices };
};
