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
  vins?: string[];
}

// Helper to generate simple VIN-like identifiers
const generateVins = (prefix: string, count: number): string[] => {
  const arr: string[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(`${prefix}-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2,8)}`);
  }
  return arr;
};

// Generate a single random VIN (exported for callers that want a VIN without reserving existing units)
export const generateRandomVin = (vehicleId: string): string => {
  return generateVins(vehicleId, 1)[0];
};

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  // structured address to support filtering by area
  address: {
    house?: string; // số nhà
    hamlet?: string; // ấp, thôn, xóm (không bắt buộc)
    ward?: string; // xã / phường
    city?: string; // tỉnh / thành phố
    raw?: string; // fallback free text for older records
  };
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
  paymentMethod?: PaymentMethod;
  serialNumber?: string;
  createdAt: string;
  paidAt?: string;
}

// Payment history entry (snapshot when an order is paid)
export interface PaymentHistoryEntry {
  id: string; // unique id for the history entry
  orderId: string;
  customerId: string;
  vehicleId: string;
  vehicleModel: string;
  vehicleBrand: string;
  services: { id: string; name: string; price: number }[];
  paymentMethod?: PaymentMethod;
  promotionId?: string;
  serialNumber?: string;
  totalAmount: number;
  paidAt: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'other';

const STORAGE_KEYS = {
  VEHICLES: 'vehicles',
  CUSTOMERS: 'customers',
  SERVICES: 'services',
  ORDERS: 'orders',
  PAYMENT_HISTORY: 'payment_history',
  PROMOTIONS: 'promotions',
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
  // attach VINs if quantity provided
  if (newVehicle.quantity && Number(newVehicle.quantity) > 0) {
    // store vins array on the vehicle object
    newVehicle.vins = generateVins(newVehicle.id, Number(newVehicle.quantity));
  } else {
    newVehicle.vins = [];
  }
  vehicles.push(newVehicle);
  saveVehicles(vehicles);
  return newVehicle;
};

export const deleteVehicle = (vehicleId: string): void => {
  const vehicles = getVehicles();
  const filtered = vehicles.filter(v => v.id !== vehicleId);
  saveVehicles(filtered);
};

export const updateVehicleQuantity = (vehicleId: string, quantity: number): void => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index !== -1) {
    vehicles[index].quantity = quantity;
    saveVehicles(vehicles);
  }
};

// Reserve a single unit from vehicle: remove one VIN (if exists) and decrement quantity.
export const reserveVehicleUnit = (vehicleId: string): string | null => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return null;
  const v = vehicles[index];
  if (!Array.isArray(v.vins)) v.vins = [];
  const vin = v.vins.shift() ?? null;
  if (typeof v.quantity === 'number' && v.quantity > 0) v.quantity = v.quantity - 1;
  vehicles[index] = v;
  saveVehicles(vehicles);
  return vin;
};

// Release a VIN back to vehicle (increase quantity)
export const releaseVehicleUnit = (vehicleId: string, vin: string): void => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return;
  const v = vehicles[index];
  if (!Array.isArray(v.vins)) v.vins = [];
  v.vins.push(vin);
  v.quantity = (typeof v.quantity === 'number' ? v.quantity : 0) + 1;
  vehicles[index] = v;
  saveVehicles(vehicles);
};

// Customer operations
export const getCustomers = (): Customer[] => {
  const raw = getFromStorage<unknown>(STORAGE_KEYS.CUSTOMERS);
  let changed = false;
  const normalized: Customer[] = (raw as unknown[]).map((c) => {
    if (!c || typeof c !== 'object') return c as Customer;
    const obj = c as Record<string, unknown>;
    const addr = obj.address;
    if (typeof addr === 'string') {
      changed = true;
      return {
        ...(obj as Omit<Customer, 'address'>),
        address: { raw: addr },
      } as Customer;
    }
    if (!addr) {
      changed = true;
      return {
        ...(obj as Omit<Customer, 'address'>),
        address: { raw: '' },
      } as Customer;
    }
    return {
      id: String(obj.id ?? `CUS-migrated-${Date.now()}`),
      name: String(obj.name ?? ''),
      phone: String(obj.phone ?? ''),
      email: String(obj.email ?? ''),
      address: (addr && typeof addr === 'object') ? (() => {
        const a = addr as Record<string, unknown>;
        return {
          house: typeof a.house === 'string' ? a.house as string : undefined,
          hamlet: typeof a.hamlet === 'string' ? a.hamlet as string : undefined,
          ward: typeof a.ward === 'string' ? a.ward as string : undefined,
          city: typeof a.city === 'string' ? a.city as string : undefined,
          raw: typeof a.raw === 'string' ? a.raw as string : undefined,
        };
      })() : { raw: String(addr ?? '') },
      createdAt: String(obj.createdAt ?? new Date().toISOString()),
    };
  });
  if (changed) saveCustomers(normalized);
  return normalized;
};
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
    // decrement vehicle quantity when an order is paid
    const order = orders[index];
    const vehicle = getVehicles().find(v => v.id === order.vehicleId);
    if (vehicle) {
      const newQty = Math.max(0, (typeof vehicle.quantity === 'number' ? vehicle.quantity : 0) - 1);
      updateVehicleQuantity(vehicle.id, newQty);
    }
  }
};

// Consume a specific VIN from a vehicle's vins array (used when cashier selects a chassis)
export const consumeSpecificVehicleUnit = (vehicleId: string, vin: string): boolean => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return false;
  const v = vehicles[index];
  if (!Array.isArray(v.vins)) v.vins = [];
  const vinIndex = v.vins.findIndex(x => x === vin);
  if (vinIndex === -1) return false;
  v.vins.splice(vinIndex, 1);
  v.quantity = (typeof v.quantity === 'number' ? v.quantity : 0) - 1;
  vehicles[index] = v;
  saveVehicles(vehicles);
  return true;
};

// Update an order (used for editing pending orders)
export const updateOrder = (orderId: string, changes: Partial<Order>): Order | null => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;
  const updated = { ...orders[index], ...changes };
  // keep id and createdAt from existing
  updated.id = orders[index].id;
  updated.createdAt = orders[index].createdAt;
  orders[index] = updated;
  saveOrders(orders);
  return orders[index];
};

// Delete an order (used to remove pending orders)
export const deleteOrder = (orderId: string): void => {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  saveOrders(filtered);
};

// Payment history operations
export const getPaymentHistory = (): PaymentHistoryEntry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_HISTORY);
  return data ? JSON.parse(data) : [];
};

export const savePaymentHistory = (items: PaymentHistoryEntry[]): void => {
  localStorage.setItem(STORAGE_KEYS.PAYMENT_HISTORY, JSON.stringify(items));
};

export const addPaymentHistoryEntry = (entry: Omit<PaymentHistoryEntry, 'id'>): PaymentHistoryEntry => {
  const list = getPaymentHistory();
  const newEntry: PaymentHistoryEntry = {
    ...entry,
    id: `PAY${Date.now()}`,
  };
  list.push(newEntry);
  savePaymentHistory(list);
  return newEntry;
};

// Promotions
export interface Promotion {
  id: string;
  name: string;
  description?: string;
  // applies to specific vehicle IDs (if empty -> applies to all)
  vehicleIds?: string[];
  // discount percent (0-100)
  discountPercent: number;
  startAt?: string; // ISO date
  endAt?: string; // ISO date
}

export const getPromotions = (): Promotion[] => getFromStorage<Promotion>(STORAGE_KEYS.PROMOTIONS);
export const savePromotions = (items: Promotion[]): void => saveToStorage(STORAGE_KEYS.PROMOTIONS, items);

export const addPromotion = (p: Omit<Promotion, 'id'>): Promotion => {
  const items = getPromotions();
  const newP: Promotion = { ...p, id: `PROMO${Date.now()}` } as Promotion;
  items.push(newP);
  savePromotions(items);
  return newP;
};

export const deletePromotion = (id: string): void => {
  const items = getPromotions();
  savePromotions(items.filter(x => x.id !== id));
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

// Vehicle types / brands
const BRAND_KEY = 'vehicle_brands';

export const getBrands = (): string[] => {
  const data = localStorage.getItem(BRAND_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBrands = (brands: string[]): void => {
  localStorage.setItem(BRAND_KEY, JSON.stringify(brands));
};

export const addBrand = (brand: string): string[] => {
  const brands = getBrands();
  if (!brands.includes(brand)) {
    brands.push(brand);
    saveBrands(brands);
  }
  return brands;
};

export const deleteBrand = (brand: string): void => {
  const brands = getBrands();
  const filtered = brands.filter(b => b !== brand);
  saveBrands(filtered);
  // Optionally remove brand from vehicles (leave vehicles as-is to avoid data loss)
};

// Inventory (phiếu kiểm kê)
export interface InventoryReport {
  id: string;
  createdBy: string; // user or manager name/id
  createdAt: string;
  items: { vehicleId: string; countedQuantity: number; note?: string }[];
  note?: string;
}

const INVENTORY_KEY = 'inventory_reports';

export const getInventoryReports = (): InventoryReport[] => {
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveInventoryReports = (reports: InventoryReport[]): void => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(reports));
};

export const addInventoryReport = (report: Omit<InventoryReport, 'id' | 'createdAt'>): InventoryReport => {
  const reports = getInventoryReports();
  const newReport: InventoryReport = {
    ...report,
    id: `INV${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reports.push(newReport);
  saveInventoryReports(reports);
  return newReport;
};

// Helper to format structured address into single-line string
export const formatAddress = (addr?: Customer['address']): string => {
  if (!addr) return '';
  const parts: string[] = [];
  if (addr.house) parts.push(addr.house);
  if (addr.hamlet) parts.push(addr.hamlet);
  const wardCity: string[] = [];
  if (addr.ward) wardCity.push(addr.ward);
  if (addr.city) wardCity.push(addr.city);
  if (wardCity.length) parts.push(wardCity.join(', '));
  if (!parts.length && addr.raw) return addr.raw;
  return parts.join('. ');
};
