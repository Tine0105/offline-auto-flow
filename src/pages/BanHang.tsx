import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getVehicles, getServices, saveServices, addCustomer, addOrder, getCustomers, getBrands, Vehicle, Service, Customer } from '@/utils/storage';
import { toast } from 'sonner';
import { Search, ShoppingCart } from 'lucide-react';

const BanHang = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    house: '',
    hamlet: '',
    ward: '',
    city: '',
  });

  const customerFields = ['name', 'phone', 'email', 'house', 'hamlet', 'ward', 'city'] as const;

  useEffect(() => {
    const availableVehicles = getVehicles()?.filter((v) => v.quantity > 0) || [];
    let allServices = getServices() || [];
    const allBrands = getBrands() || [];

    // Migration: ensure service IDs are unique. If duplicates exist (old data), fix and persist.
    const seen = new Map<string, number>();
    let changed = false;
    allServices = allServices.map((s, idx) => {
      if (!s.id) {
        // ensure id exists
        changed = true;
        return { ...s, id: `SRV${Date.now()}${idx}${Math.random().toString(36).slice(2,6)}` };
      }
      const count = seen.get(s.id) || 0;
      if (count > 0) {
        // duplicate id found -> make unique
        changed = true;
        const newId = `${s.id}_${idx}_${Math.random().toString(36).slice(2,6)}`;
        seen.set(newId, 1);
        return { ...s, id: newId };
      }
      seen.set(s.id, 1);
      return s;
    });

    if (changed) {
      // persist corrected services so future loads won't have duplicates
      try {
        saveServices(allServices);
      } catch (err) {
        // ignore persistence errors silently
        console.warn('Could not save normalized services', err);
      }
    }

    setVehicles(availableVehicles);
    setServices(allServices);
    setBrands(allBrands);
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handlePhoneLookup = (phone: string) => {
    if (!phone) return;
    const existing = getCustomers().find((c) => c.phone === phone);
    if (existing) {
      setCustomerData((prev) => ({
        ...prev,
        name: existing.name || prev.name,
        email: existing.email || prev.email,
        house: existing.address?.house || '',
        hamlet: existing.address?.hamlet || '',
        ward: existing.address?.ward || '',
        city: existing.address?.city || '',
        phone: existing.phone || prev.phone,
      }));
      toast(`Tìm thấy khách hàng cũ: ${existing.name}`);
    }
  };

  const calculateTotal = () => {
    const vehiclePrice = vehicles.find((v) => v.id === selectedVehicle)?.price || 0;
    const servicesTotal = services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + (s.price || 0), 0);
    return vehiclePrice + servicesTotal;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerData.name || !customerData.phone || !selectedVehicle) {
      toast.error('Vui lòng điền đầy đủ thông tin khách hàng và chọn xe');
      return;
    }

    const customerPayload: Omit<Customer, 'id' | 'createdAt'> = {
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email,
      address: {
        house: customerData.house || undefined,
        hamlet: customerData.hamlet || undefined,
        ward: customerData.ward || undefined,
        city: customerData.city || undefined,
        raw: [customerData.house, customerData.hamlet, customerData.ward, customerData.city].filter(Boolean).join(', '),
      },
    };

    const customer = addCustomer(customerPayload);
    addOrder({
      customerId: customer.id,
      vehicleId: selectedVehicle,
      services: selectedServices,
      totalAmount: calculateTotal(),
      status: 'pending',
    });

    toast.success('Đã tạo đơn hàng thành công');
  setCustomerData({ name: '', phone: '', email: '', house: '', hamlet: '', ward: '', city: '' });
    setSelectedVehicle('');
    setSelectedServices([]);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bán hàng</h1>
          <p className="text-muted-foreground mt-1">Tạo đơn hàng mới và quản lý khách hàng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* --- Thông tin khách hàng --- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customerFields.map((field) => (
                <div key={field}>
                  <Label htmlFor={field}>
                    {field === 'name'
                      ? 'Họ tên *'
                      : field === 'phone'
                      ? 'Số điện thoại *'
                      : field === 'email'
                      ? 'Email'
                      : field === 'house'
                      ? 'Số nhà'
                      : field === 'hamlet'
                      ? 'Ấp / Thôn / Xóm (không bắt buộc)'
                      : field === 'ward'
                      ? 'Xã / Phường'
                      : 'Tỉnh / Thành phố'}
                  </Label>
                  <Input
                    id={field}
                    type={field === 'email' ? 'email' : 'text'}
                    value={customerData[field as keyof typeof customerData]}
                    onChange={(e) => setCustomerData({ ...customerData, [field]: e.target.value })}
                    onBlur={field === 'phone' ? (e) => handlePhoneLookup(e.currentTarget.value) : undefined}
                    placeholder={
                      field === 'name'
                        ? 'Nguyễn Văn A'
                        : field === 'phone'
                        ? '0123456789'
                        : field === 'email'
                        ? 'email@example.com'
                        : field === 'house'
                        ? 'Số nhà (ví dụ: 123/4)'
                        : field === 'hamlet'
                        ? 'Ấp, thôn hoặc xóm (không bắt buộc)'
                        : field === 'ward'
                        ? 'Xã / Phường'
                        : 'Tỉnh / Thành phố'
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* --- Chọn xe và dịch vụ --- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Chọn xe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                <Label>Xe có sẵn</Label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <Label className="text-xs">Hãng</Label>
                    <select className="w-full p-2 border rounded" value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModelFilter(''); setSelectedVehicle(''); }}>
                      <option value="">Tất cả hãng</option>
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Loại / Mẫu</Label>
                    <select className="w-full p-2 border rounded" value={selectedModelFilter} onChange={(e) => { setSelectedModelFilter(e.target.value); setSelectedVehicle(''); }}>
                      <option value="">Tất cả</option>
                      {Array.from(new Set(vehicles.filter(v => !selectedBrand || v.brand === selectedBrand).map(v => v.model))).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Chọn xe</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn xe" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.filter(v => (!selectedBrand || v.brand === selectedBrand) && (!selectedModelFilter || v.model === selectedModelFilter)).length === 0 && <div className="p-2 text-sm">Không có xe khả dụng</div>}
                        {vehicles.filter(v => (!selectedBrand || v.brand === selectedBrand) && (!selectedModelFilter || v.model === selectedModelFilter)).map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              {vehicle.image && (
                                <img src={vehicle.image} alt={vehicle.model} className="w-10 h-10 object-cover rounded" />
                              )}
                              <span>{vehicle.brand} {vehicle.model} - {formatCurrency(vehicle.price)} (Còn: {vehicle.quantity})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedVehicle && vehicles.find(v => v.id === selectedVehicle)?.image && (
                  <div className="mt-2">
                    <img 
                      src={vehicles.find(v => v.id === selectedVehicle)?.image} 
                      alt="Xe đã chọn" 
                      className="w-full max-w-md h-48 object-cover rounded-lg border"
                    />
                    {vehicles.find(v => v.id === selectedVehicle)?.colors && vehicles.find(v => v.id === selectedVehicle)!.colors!.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Màu sắc có sẵn: {vehicles.find(v => v.id === selectedVehicle)?.colors?.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Dịch vụ thêm {selectedServices.length > 0 && `(${selectedServices.length} đã chọn)`}</Label>
                <div className="mt-2 space-y-2">
                  {services.map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                    <div 
                      key={service.id} 
                      className={`flex items-start space-x-2 p-2 rounded-md transition-colors ${
                        isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={service.id}
                        checked={isSelected}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <label htmlFor={service.id} className="text-sm flex-1 cursor-pointer leading-tight">
                        <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {service.name} - {formatCurrency(service.price)}
                        </span>
                        <p className="text-muted-foreground text-xs">{service.description}</p>
                      </label>
                    </div>
                  )})}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
                <Button onClick={handleSubmit} className="w-full" size="lg">
                  Tạo đơn hàng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BanHang;
