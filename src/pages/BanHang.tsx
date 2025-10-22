import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getVehicles, getServices, addCustomer, addOrder, Vehicle, Service } from '@/utils/storage';
import { toast } from 'sonner';
import { Search, ShoppingCart } from 'lucide-react';

const BanHang = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    setVehicles(getVehicles().filter(v => v.quantity > 0));
    setServices(getServices());
  }, []);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedService(prev => prev === serviceId ? null : serviceId);
  };

  const calculateTotal = () => {
    const vehiclePrice = vehicles.find(v => v.id === selectedVehicle)?.price || 0;
    const servicePrice = selectedService 
      ? services.find(s => s.id === selectedService)?.price || 0 
      : 0;
    return vehiclePrice + servicePrice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerData.name || !customerData.phone || !selectedVehicle) {
      toast.error('Vui lòng điền đầy đủ thông tin khách hàng và chọn xe');
      return;
    }

    const customer = addCustomer(customerData);
    addOrder({
      customerId: customer.id,
      vehicleId: selectedVehicle,
      services: selectedService ? [selectedService] : [],
      totalAmount: calculateTotal(),
      status: 'pending',
    });

    toast.success('Đã tạo đơn hàng thành công');
    setCustomerData({ name: '', phone: '', email: '', address: '' });
    setSelectedVehicle('');
    setSelectedService(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bán hàng</h1>
          <p className="text-muted-foreground mt-1">Tạo đơn hàng mới và quản lý khách hàng</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Họ tên *</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="0123456789"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  placeholder="Địa chỉ"
                />
              </div>
            </CardContent>
          </Card>

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
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn xe" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {formatCurrency(vehicle.price)} (Còn: {vehicle.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dịch vụ thêm (chọn 1)</Label>
                <div className="mt-2">
                  <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedService === service.id}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <label htmlFor={service.id} className="text-sm flex-1 cursor-pointer">
                        {service.name} - {formatCurrency(service.price)}
                        <p className="text-muted-foreground text-xs">{service.description}</p>
                      </label>
                    </div>
                  ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
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
