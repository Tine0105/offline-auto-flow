import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type PaymentHistory = Database['public']['Tables']['payment_history']['Row'];
export type PaymentHistoryInsert = Database['public']['Tables']['payment_history']['Insert'];
export type Promotion = Database['public']['Tables']['promotions']['Row'];
export type PromotionInsert = Database['public']['Tables']['promotions']['Insert'];

// Vehicle operations
export const getVehicles = async (): Promise<Vehicle[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const addVehicle = async (vehicle: Omit<VehicleInsert, 'id' | 'created_at'>): Promise<Vehicle> => {
  const newVehicle = {
    ...vehicle,
    id: `VH${Date.now()}`,
  };

  // Generate VINs if quantity provided
  if (newVehicle.quantity && Number(newVehicle.quantity) > 0) {
    const vins: string[] = [];
    for (let i = 0; i < Number(newVehicle.quantity); i++) {
      vins.push(`${newVehicle.id}-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2,8)}`);
    }
    newVehicle.vins = vins;
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert(newVehicle)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateVehicleQuantity = async (vehicleId: string, quantity: number): Promise<void> => {
  const { error } = await supabase
    .from('vehicles')
    .update({ quantity })
    .eq('id', vehicleId);

  if (error) throw error;
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) throw error;
};

// Customer operations
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addCustomer = async (customer: Omit<CustomerInsert, 'id' | 'created_at'>): Promise<Customer> => {
  const newCustomer = {
    ...customer,
    id: `CUS${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(newCustomer)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Service operations
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*');

  if (error) throw error;
  return data || [];
};

export const addService = async (service: Omit<ServiceInsert, 'id'>): Promise<Service> => {
  const newService = {
    ...service,
    id: `SRV${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('services')
    .insert(newService)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteService = async (serviceId: string): Promise<void> => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) throw error;
};

// Order operations
export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addOrder = async (order: Omit<OrderInsert, 'id' | 'created_at'>): Promise<Order> => {
  const newOrder = {
    ...order,
    id: `ORD${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(newOrder)
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
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
};

// Payment operations
export const getPaymentHistory = async (): Promise<PaymentHistory[]> => {
  const { data, error } = await supabase
    .from('payment_history')
    .select('*')
    .order('paid_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addPaymentHistoryEntry = async (entry: Omit<PaymentHistoryInsert, 'id'>): Promise<PaymentHistory> => {
  const newEntry = {
    ...entry,
    id: `PAY${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('payment_history')
    .insert(newEntry)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Promotions
export const getPromotions = async (): Promise<Promotion[]> => {
  const { data, error } = await supabase
    .from('promotions')
    .select('*');

  if (error) throw error;
  return data || [];
};

export const addPromotion = async (promotion: Omit<PromotionInsert, 'id'>): Promise<Promotion> => {
  const newPromotion = {
    ...promotion,
    id: `PROMO${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('promotions')
    .insert(newPromotion)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePromotion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Brands
export const getBrands = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('name')
    .order('name');

  if (error) throw error;
  return data?.map(b => b.name) || [];
};

export const addBrand = async (brand: string): Promise<string[]> => {
  const newBrand = {
    id: `BRAND${Date.now()}`,
    name: brand,
  };

  const { error } = await supabase
    .from('brands')
    .insert(newBrand);

  if (error && error.code !== '23505') { // Ignore duplicate key errors
    throw error;
  }

  return getBrands();
};

export const deleteBrand = async (brand: string): Promise<void> => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('name', brand);

  if (error) throw error;
};

// Helper function to format address
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
