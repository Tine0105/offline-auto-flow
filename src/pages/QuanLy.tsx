import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getOrders, getVehicles, getServices, addService, deleteService, getCustomers, Service, getPromotions, addPromotion, deletePromotion, Promotion } from '@/utils/storage';
import { toast } from 'sonner';
import { BarChart3, Package, Users, DollarSign, Plus, Trash2 } from 'lucide-react';

const QuanLy = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalVehicles: 0,
    totalCustomers: 0,
  });
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price: '',
    description: '',
  });
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoForm, setPromoForm] = useState({ name: '', discountPercent: '', description: '', vehicleId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setServices(getServices());
    setPromotions(getPromotions());
    
    const orders = getOrders();
    const paidOrders = orders.filter(o => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    setStats({
      totalRevenue,
      totalOrders: orders.length,
      totalVehicles: getVehicles().reduce((sum, v) => sum + v.quantity, 0),
      totalCustomers: getCustomers().length,
    });
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceForm.name || !serviceForm.price) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    addService({
      name: serviceForm.name,
      price: parseFloat(serviceForm.price),
      description: serviceForm.description,
    });

    toast.success('Đã thêm dịch vụ mới');
    setServiceForm({ name: '', price: '', description: '' });
    loadData();
  };

  const handleAddPromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.name || !promoForm.discountPercent) {
      toast.error('Vui lòng nhập tên và phần trăm giảm');
      return;
    }
    addPromotion({
      name: promoForm.name,
      description: promoForm.description,
      discountPercent: parseFloat(promoForm.discountPercent),
      vehicleIds: promoForm.vehicleId ? [promoForm.vehicleId] : [],
    });
    toast.success('Đã thêm khuyến mãi');
    setPromoForm({ name: '', discountPercent: '', description: '', vehicleId: '' });
    loadData();
  };

  const handleDeletePromotion = (id: string) => {
    deletePromotion(id);
    toast.success('Đã xóa khuyến mãi');
    loadData();
  };

  const handleDeleteService = (serviceId: string) => {
    deleteService(serviceId);
    toast.success('Đã xóa dịch vụ');
    loadData();
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
          <h1 className="text-3xl font-bold text-foreground">Quản lý</h1>
          <p className="text-muted-foreground mt-1">Báo cáo và quản lý hệ thống</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles} xe</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Thêm dịch vụ mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddService} className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="serviceName">Tên dịch vụ *</Label>
                <Input
                  id="serviceName"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="VD: Bảo hiểm..."
                />
              </div>
              <div>
                <Label htmlFor="servicePrice">Giá (VNĐ) *</Label>
                <Input
                  id="servicePrice"
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="VD: 5000000"
                />
              </div>
              <div>
                <Label htmlFor="serviceDesc">Mô tả</Label>
                <Input
                  id="serviceDesc"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Mô tả dịch vụ..."
                />
              </div>
              <div className="col-span-3">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dịch vụ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Quản lý khuyến mãi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPromotion} className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="promoName">Tên khuyến mãi</Label>
                <Input id="promoName" value={promoForm.name} onChange={(e) => setPromoForm({...promoForm, name: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="promoDiscount">Giảm (%)</Label>
                <Input id="promoDiscount" type="number" value={promoForm.discountPercent} onChange={(e) => setPromoForm({...promoForm, discountPercent: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="promoVehicle">Áp dụng cho xe (tuỳ chọn)</Label>
                <Input id="promoVehicle" placeholder="Mã xe (ví dụ VH...)" value={promoForm.vehicleId} onChange={(e)=>setPromoForm({...promoForm, vehicleId: e.target.value})} />
              </div>
              <div className="col-span-3">
                <Label htmlFor="promoDesc">Mô tả</Label>
                <Input id="promoDesc" value={promoForm.description} onChange={(e)=>setPromoForm({...promoForm, description: e.target.value})} />
              </div>
              <div className="col-span-3">
                <Button type="submit">Thêm khuyến mãi</Button>
              </div>
            </form>

            <div>
              <h3 className="font-medium mb-2">Danh sách khuyến mãi</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Giảm (%)</TableHead>
                    <TableHead>Áp dụng xe</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.discountPercent}%</TableCell>
                      <TableCell>{(p.vehicleIds || []).join(', ') || 'Tất cả'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={()=>handleDeletePromotion(p.id)}>Xóa</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách dịch vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã dịch vụ</TableHead>
                  <TableHead>Tên dịch vụ</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Chưa có dịch vụ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.id}</TableCell>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{formatCurrency(service.price)}</TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default QuanLy;
