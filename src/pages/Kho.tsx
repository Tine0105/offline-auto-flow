import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getVehicles, addVehicle, deleteVehicle, getBrands, addBrand, deleteBrand, addInventoryReport, getVehicles as fetchVehicles, Vehicle } from '@/utils/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const Kho = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
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
    loadBrands();
  }, []);

  const loadVehicles = () => {
    setVehicles(getVehicles());
  };

  const loadBrands = () => {
    setBrands(getBrands());
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

  const handleDeleteVehicle = (id: string) => {
    if (!confirm('Xác nhận xóa xe khỏi kho?')) return;
    deleteVehicle(id);
    toast.success('Đã xóa xe');
    loadVehicles();
  };

  const handleAddBrand = () => {
    const brand = prompt('Nhập tên hãng xe mới:');
    if (!brand) return;
    addBrand(brand.trim());
    toast.success('Đã thêm hãng');
    loadBrands();
  };

  const handleDeleteBrand = (brand: string) => {
    if (!confirm(`Xác nhận xóa hãng ${brand}?`)) return;
    deleteBrand(brand);
    toast.success('Đã xóa hãng');
    loadBrands();
  };

  // Inventory dialog state
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryNote, setInventoryNote] = useState('');
  const [inventoryItems, setInventoryItems] = useState<{ vehicleId: string; countedQuantity: number; note?: string }[]>([]);

  const openInventory = () => {
    // initialize items from current vehicles
    const items = fetchVehicles().map(v => ({ vehicleId: v.id, countedQuantity: v.quantity }));
    setInventoryItems(items);
    setInventoryNote('');
    setInventoryOpen(true);
  };

  const sendInventory = () => {
    if (inventoryItems.length === 0) {
      toast.error('Không có mục nào để kiểm kê');
      return;
    }
    addInventoryReport({
      createdBy: 'Quản lý kho',
      items: inventoryItems,
      note: inventoryNote,
    });
    toast.success('Đã gửi phiếu kiểm kê tới quản lý');
    setInventoryOpen(false);
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
      
      {/* Inventory Dialog */}
      <Dialog open={inventoryOpen} onOpenChange={setInventoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo phiếu kiểm kê</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Ghi chú</Label>
              <Textarea value={inventoryNote} onChange={(e) => setInventoryNote((e.target as HTMLTextAreaElement).value)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Danh sách kiểm kê</div>
              <div className="grid gap-2 max-h-72 overflow-auto">
                {inventoryItems.map((it, idx) => {
                  const v = vehicles.find(vv => vv.id === it.vehicleId);
                  return (
                    <div key={it.vehicleId} className="flex items-center gap-2">
                      <div className="w-1/2">{v ? `${v.brand} ${v.model}` : it.vehicleId}</div>
                      <Input type="number" value={it.countedQuantity} onChange={(e) => {
                        const v = [...inventoryItems];
                        v[idx] = { ...v[idx], countedQuantity: parseInt((e.target as HTMLInputElement).value || '0') };
                        setInventoryItems(v);
                      }} className="w-24" />
                      <div className="text-sm text-muted-foreground"> {v ? `Trên hệ thống: ${v.quantity}` : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setInventoryOpen(false)}>Hủy</Button>
              <Button onClick={sendInventory}>Gửi phiếu</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <TableHead>Hành động</TableHead>
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
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteVehicle(vehicle.id)} className="text-destructive">Xóa</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quản lý hãng xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Danh sách hãng hiện có</div>
              <div>
                <Button onClick={handleAddBrand}>
                  Thêm hãng
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              {brands.length === 0 ? (
                <div className="text-muted-foreground">Chưa có hãng nào</div>
              ) : (
                brands.map(b => (
                  <div key={b} className="flex items-center justify-between bg-muted/10 p-2 rounded">
                    <div>{b}</div>
                    <div>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteBrand(b)} className="text-destructive">Xóa</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phiếu kiểm kê kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={openInventory}>Tạo / Gửi phiếu kiểm kê</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Kho;
