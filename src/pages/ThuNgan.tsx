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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  // map orderId -> selected service ids
  const [selectedServicesMap, setSelectedServicesMap] = useState<Record<string, string[]>>({});

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
    // When paying, we could update the order's services and total amount based on selection.
    const ordersAll = getOrders();
    const idx = ordersAll.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      const order = ordersAll[idx];
      const selected = selectedServicesMap[orderId] ?? [];
      // Recalculate total: base vehicle price + selected services
      const vehicle = getVehicles().find(v => v.id === order.vehicleId);
      const servicesAll = getServices();
      const servicesSum = selected
        .map(sid => servicesAll.find(s => s.id === sid)?.price ?? 0)
        .reduce((a, b) => a + b, 0);
      const vehiclePrice = vehicle?.price ?? 0;
      ordersAll[idx].services = selected;
      ordersAll[idx].totalAmount = vehiclePrice + servicesSum;
      // persist orders
      // saveOrders is not exported here; updateOrderStatus will save the status and persist
    }

    updateOrderStatus(orderId, 'paid');
    toast.success('Đã xác nhận thanh toán thành công');
    loadOrders();
  };

  const toggleServiceSelection = (orderId: string, serviceId: string) => {
    setSelectedServicesMap(prev => {
      const prevSel = prev[orderId] ?? [];
      const exists = prevSel.includes(serviceId);
      const next = exists ? prevSel.filter(s => s !== serviceId) : [...prevSel, serviceId];
      return { ...prev, [orderId]: next };
    });
  };

  const computedOrderTotal = (order: Order) => {
    const vehicle = getVehicles().find(v => v.id === order.vehicleId);
    const vehiclePrice = vehicle?.price ?? 0;
    const selected = selectedServicesMap[order.id] ?? order.services ?? [];
    const servicesAll = getServices();
    const servicesSum = selected
      .map(sid => servicesAll.find(s => s.id === sid)?.price ?? 0)
      .reduce((a, b) => a + b, 0);
    return vehiclePrice + servicesSum;
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
                      <TableCell className="max-w-xs truncate">
                        {getServiceNames(order.services)}
                        <div>
                          <button
                            className="text-sm text-primary underline mt-1"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          >
                            {expandedOrderId === order.id ? 'Thu gọn' : 'Chọn dịch vụ'}
                          </button>
                        </div>
                        {expandedOrderId === order.id && (
                          <div className="mt-2 space-y-2">
                            {getServices().map(s => (
                              <label key={s.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={(selectedServicesMap[order.id] ?? []).includes(s.id)}
                                  onChange={() => toggleServiceSelection(order.id, s.id)}
                                />
                                <span className="text-sm">{s.name} ({formatCurrency(s.price)})</span>
                              </label>
                            ))}
                            <div className="text-sm font-medium">Tổng tạm tính: {formatCurrency(computedOrderTotal(order))}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(computedOrderTotal(order))}
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
