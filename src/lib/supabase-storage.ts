import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type Service = Database['public']['Tables']['services']['Row'];
type ServiceInsert = Database['public']['Tables']['services']['Insert'];
type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type PaymentHistory = Database['public']['Tables']['payment_history']['Row'];
type PaymentHistoryInsert = Database['public']['Tables']['payment_history']['Insert'];
type Promotion = Database['public']['Tables']['promotions']['Row'];
type PromotionInsert = Database['public']['Tables']['promotions']['Insert'];

// Vehicle operations
export const getVehicles = async (): Promise<Vehicle[]> => {
  const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addVehicle = async (vehicle: Omit<VehicleInsert, 'id' | 'created_at'>): Promise<Vehicle> => {
  const id = `VH${Date.now()}`;
  const vins: string[] = [];
  
  if (vehicle.quantity && Number(vehicle.quantity) > 0) {
    for (let i = 0; i < Number(vehicle.quantity); i++) {
      vins.push(`${id}-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 8)}`);
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      ...vehicle,
      id,
      vins,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
  if (error) throw error;
};

export const updateVehicleQuantity = async (vehicleId: string, quantityChange: number): Promise<void> => {
  // If quantityChange is negative, we're decreasing; if positive, we're increasing
  const { data: vehicle, error: fetchError } = await supabase
    .from('vehicles')
    .select('quantity')
    .eq('id', vehicleId)
    .single();

  if (fetchError) throw fetchError;

  const newQuantity = Math.max(0, (vehicle.quantity || 0) + quantityChange);
  
  const { error } = await supabase.from('vehicles').update({ quantity: newQuantity }).eq('id', vehicleId);
  if (error) throw error;
};

// Customer operations
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addCustomer = async (customer: Omit<CustomerInsert, 'id' | 'created_at'>): Promise<Customer> => {
  const id = `CUS${Date.now()}`;
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...customer,
      id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Service operations
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*');
  if (error) throw error;
  return data || [];
};

export const addService = async (service: Omit<ServiceInsert, 'id'>): Promise<Service> => {
  const id = `SRV${Date.now()}`;
  const { data, error } = await supabase
    .from('services')
    .insert({
      ...service,
      id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteService = async (serviceId: string): Promise<void> => {
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) throw error;
};

// Order operations
export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addOrder = async (order: Omit<OrderInsert, 'id' | 'created_at'>): Promise<Order> => {
  const id = `ORD${Date.now()}`;
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...order,
      id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOrder = async (orderId: string, changes: Partial<Order>): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .update(changes)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
};

// Payment history operations
export const getPaymentHistory = async (): Promise<PaymentHistory[]> => {
  const { data, error } = await supabase.from('payment_history').select('*').order('paid_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const addPaymentHistoryEntry = async (entry: Omit<PaymentHistoryInsert, 'id'>): Promise<PaymentHistory> => {
  const id = `PAY${Date.now()}`;
  const { data, error } = await supabase
    .from('payment_history')
    .insert({
      ...entry,
      id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Promotion operations
export const getPromotions = async (): Promise<Promotion[]> => {
  const { data, error } = await supabase.from('promotions').select('*');
  if (error) throw error;
  return data || [];
};

export const addPromotion = async (promotion: Omit<PromotionInsert, 'id'>): Promise<Promotion> => {
  const id = `PROMO${Date.now()}`;
  const { data, error } = await supabase
    .from('promotions')
    .insert({
      ...promotion,
      id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePromotion = async (id: string): Promise<void> => {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw error;
};

// Helper to format address
export const formatAddress = (customer: Customer): string => {
  const parts: string[] = [];
  if (customer.address_house) parts.push(customer.address_house);
  if (customer.address_hamlet) parts.push(customer.address_hamlet);
  const wardCity: string[] = [];
  if (customer.address_ward) wardCity.push(customer.address_ward);
  if (customer.address_city) wardCity.push(customer.address_city);
  if (wardCity.length) parts.push(wardCity.join(', '));
  if (!parts.length && customer.address_raw) return customer.address_raw;
  return parts.join('. ');
};
