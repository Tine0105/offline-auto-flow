import { useState, useEffect } from 'react';
import { getVehicles, addVehicle as addVehicleDb, deleteVehicle as deleteVehicleDb, updateVehicleQuantity as updateVehicleQuantityDb } from '@/lib/supabase-storage';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error: any) {
      toast.error(`Lỗi tải dữ liệu xe: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const addVehicle = async (vehicle: Omit<Vehicle, 'id' | 'created_at'>) => {
    try {
      const newVehicle = await addVehicleDb(vehicle);
      setVehicles(prev => [newVehicle, ...prev]);
      toast.success('Đã thêm xe mới');
      return newVehicle;
    } catch (error: any) {
      toast.error(`Lỗi thêm xe: ${error.message}`);
      throw error;
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      await deleteVehicleDb(vehicleId);
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      toast.success('Đã xóa xe');
    } catch (error: any) {
      toast.error(`Lỗi xóa xe: ${error.message}`);
      throw error;
    }
  };

  const updateVehicleQuantity = async (vehicleId: string, quantity: number) => {
    try {
      await updateVehicleQuantityDb(vehicleId, quantity);
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, quantity } : v));
    } catch (error: any) {
      toast.error(`Lỗi cập nhật số lượng: ${error.message}`);
      throw error;
    }
  };

  return { vehicles, loading, addVehicle, deleteVehicle, updateVehicleQuantity, refreshVehicles: loadVehicles };
};
