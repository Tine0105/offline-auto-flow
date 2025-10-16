import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOrders, getCustomers, getVehicles, getServices, updateOrderStatus, Order } from '@/utils/storage';
import { toast } from 'sonner';
import { DollarSign, CheckCircle } from 'lucide-react';

const ThuNgan = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setOrders(getOrders().filter(o => o.status === 'pending'));
  };

  const getCustomerName = (customerId: string) => {
    return getCustomers().find(c => c.id === customerId)?.name || 'N/A';
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = getVehicles().find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'N/A';
  };

  const getServiceNames = (serviceIds: string[]) => {
    const allServices = getServices();
    return serviceIds
      .map(id => allServices.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Không có';
  };

  const handlePayment = (orderId: string) => {
    updateOrderStatus(orderId, 'paid');
    toast.success('Đã xác nhận thanh toán thành công');
    loadOrders();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thu ngân</h1>
          <p className="text-muted-foreground mt-1">Xử lý thanh toán đơn hàng</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Đơn hàng chờ thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Xe</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Không có đơn hàng chờ thanh toán
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{getCustomerName(order.customerId)}</TableCell>
                      <TableCell>{getVehicleInfo(order.vehicleId)}</TableCell>
                      <TableCell className="max-w-xs truncate">{getServiceNames(order.services)}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                          Chờ thanh toán
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handlePayment(order.id)}
                          className="bg-success hover:bg-success/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Thanh toán
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

export default ThuNgan;
