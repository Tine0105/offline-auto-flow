// LocalStorage utilities for data persistence

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  year: number;
  price: number;
  quantity: number;
  color: string;
  description: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Order {
  id: string;
  customerId: string;
  vehicleId: string;
  services: string[]; // service IDs
  totalAmount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

const STORAGE_KEYS = {
  VEHICLES: 'vehicles',
  CUSTOMERS: 'customers',
  SERVICES: 'services',
  ORDERS: 'orders',
};

// Generic storage functions
export const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Vehicle operations
export const getVehicles = (): Vehicle[] => getFromStorage<Vehicle>(STORAGE_KEYS.VEHICLES);
export const saveVehicles = (vehicles: Vehicle[]): void => saveToStorage(STORAGE_KEYS.VEHICLES, vehicles);

export const addVehicle = (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
  const vehicles = getVehicles();
  const newVehicle: Vehicle = {
    ...vehicle,
    id: `VH${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  vehicles.push(newVehicle);
  saveVehicles(vehicles);
  return newVehicle;
};

export const updateVehicleQuantity = (vehicleId: string, quantity: number): void => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index !== -1) {
    vehicles[index].quantity = quantity;
    saveVehicles(vehicles);
  }
};

// Customer operations
export const getCustomers = (): Customer[] => getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
export const saveCustomers = (customers: Customer[]): void => saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);

export const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>): Customer => {
  const customers = getCustomers();
  const newCustomer: Customer = {
    ...customer,
    id: `CUS${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  customers.push(newCustomer);
  saveCustomers(customers);
  return newCustomer;
};

// Service operations
export const getServices = (): Service[] => getFromStorage<Service>(STORAGE_KEYS.SERVICES);
export const saveServices = (services: Service[]): void => saveToStorage(STORAGE_KEYS.SERVICES, services);

export const addService = (service: Omit<Service, 'id'>): Service => {
  const services = getServices();
  const newService: Service = {
    ...service,
    id: `SRV${Date.now()}`,
  };
  services.push(newService);
  saveServices(services);
  return newService;
};

export const deleteService = (serviceId: string): void => {
  const services = getServices();
  const filtered = services.filter(s => s.id !== serviceId);
  saveServices(filtered);
};

// Order operations
export const getOrders = (): Order[] => getFromStorage<Order>(STORAGE_KEYS.ORDERS);
export const saveOrders = (orders: Order[]): void => saveToStorage(STORAGE_KEYS.ORDERS, orders);

export const addOrder = (order: Omit<Order, 'id' | 'createdAt'>): Order => {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ORD${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
};

export const updateOrderStatus = (orderId: string, status: 'paid'): void => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    orders[index].paidAt = new Date().toISOString();
    saveOrders(orders);
    
    // Update vehicle quantity when order is paid
    const order = orders[index];
    updateVehicleQuantity(order.vehicleId, 
      getVehicles().find(v => v.id === order.vehicleId)!.quantity - 1
    );
  }
};

// Initialize default services
export const initializeDefaultData = (): void => {
  const services = getServices();
  if (services.length === 0) {
    addService({
      name: 'Bảo hiểm vật chất',
      price: 5000000,
      description: 'Bảo hiểm toàn diện cho xe',
    });
    addService({
      name: 'Phụ kiện cao cấp',
      price: 3000000,
      description: 'Gói phụ kiện nâng cấp xe',
    });
    addService({
      name: 'Bảo dưỡng miễn phí',
      price: 2000000,
      description: 'Bảo dưỡng miễn phí 1 năm',
    });
  }
};
