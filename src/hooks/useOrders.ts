import { useState, useEffect } from 'react';
import { getOrders, addOrder as addOrderDb, updateOrder as updateOrderDb, deleteOrder as deleteOrderDb, getPaymentHistory, addPaymentHistoryEntry, updateVehicleQuantity } from '@/lib/supabase-storage';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Order = Database['public']['Tables']['orders']['Row'];
type PaymentHistory = Database['public']['Tables']['payment_history']['Row'];

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(`Lỗi tải đơn hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const data = await getPaymentHistory();
      setPaymentHistory(data);
    } catch (error: any) {
      toast.error(`Lỗi tải lịch sử thanh toán: ${error.message}`);
    }
  };

  useEffect(() => {
    loadOrders();
    loadPaymentHistory();
  }, []);

  const addOrder = async (order: Omit<Order, 'id' | 'created_at'>) => {
    try {
      const newOrder = await addOrderDb(order);
      setOrders(prev => [newOrder, ...prev]);
      toast.success('Đã tạo đơn hàng');
      return newOrder;
    } catch (error: any) {
      toast.error(`Lỗi tạo đơn hàng: ${error.message}`);
      throw error;
    }
  };

  const updateOrder = async (orderId: string, changes: Partial<Order>) => {
    try {
      const updated = await updateOrderDb(orderId, changes);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      return updated;
    } catch (error: any) {
      toast.error(`Lỗi cập nhật đơn hàng: ${error.message}`);
      throw error;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteOrderDb(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Đã xóa đơn hàng');
    } catch (error: any) {
      toast.error(`Lỗi xóa đơn hàng: ${error.message}`);
      throw error;
    }
  };

  const markOrderAsPaid = async (order: Order, vehicleModel: string, vehicleBrand: string, services: any[], paymentMethod?: string) => {
    try {
      // Update order status
      await updateOrder(order.id, {
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod as any,
      });

      // Add to payment history
      await addPaymentHistoryEntry({
        order_id: order.id,
        customer_id: order.customer_id,
        vehicle_id: order.vehicle_id,
        vehicle_model: vehicleModel,
        vehicle_brand: vehicleBrand,
        services: services as any,
        payment_method: paymentMethod,
        serial_number: order.serial_number || undefined,
        total_amount: order.total_amount,
        paid_at: new Date().toISOString(),
      });

      // Decrease vehicle quantity
      await updateVehicleQuantity(order.vehicle_id, -1);

      await loadOrders();
      await loadPaymentHistory();
      toast.success('Đã xác nhận thanh toán');
    } catch (error: any) {
      toast.error(`Lỗi thanh toán: ${error.message}`);
      throw error;
    }
  };

  return {
    orders,
    paymentHistory,
    loading,
    addOrder,
    updateOrder,
    deleteOrder,
    markOrderAsPaid,
    refreshOrders: loadOrders,
    refreshPaymentHistory: loadPaymentHistory,
  };
};
