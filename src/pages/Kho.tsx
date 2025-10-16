import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVehicles, addVehicle, Vehicle } from '@/utils/storage';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const Kho = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    price: '',
    quantity: '',
    color: '',
    description: '',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setVehicles(getVehicles());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.model || !formData.brand || !formData.price || !formData.quantity) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    addVehicle({
      model: formData.model,
      brand: formData.brand,
      year: formData.year,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      color: formData.color,
      description: formData.description,
    });

    toast.success('Đã thêm xe vào kho thành công');
    setFormData({
      model: '',
      brand: '',
      year: new Date().getFullYear(),
      price: '',
      quantity: '',
      color: '',
      description: '',
    });
    loadVehicles();
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
          <h1 className="text-3xl font-bold text-foreground">Quản lý Kho</h1>
          <p className="text-muted-foreground mt-1">Nhập xe mới và quản lý tồn kho</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Nhập xe mới vào kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Hãng xe *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="VD: Toyota, Honda..."
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="VD: Camry, City..."
                />
              </div>
              <div>
                <Label htmlFor="year">Năm sản xuất</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="color">Màu sắc</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="VD: Trắng, Đen..."
                />
              </div>
              <div>
                <Label htmlFor="price">Giá bán (VNĐ) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="VD: 800000000"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Số lượng *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="VD: 5"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về xe..."
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm vào kho
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã xe</TableHead>
                  <TableHead>Hãng</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Năm</TableHead>
                  <TableHead>Màu</TableHead>
                  <TableHead>Giá bán</TableHead>
                  <TableHead>Tồn kho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Chưa có xe trong kho
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.id}</TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.color || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(vehicle.price)}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${vehicle.quantity > 0 ? 'text-success' : 'text-destructive'}`}>
                          {vehicle.quantity}
                        </span>
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

export default Kho;
