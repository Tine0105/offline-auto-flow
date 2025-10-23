import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOrders, getCustomers, getVehicles, getServices, updateOrderStatus, Order, addPaymentHistoryEntry, getPaymentHistory, updateOrder, deleteOrder } from '@/utils/storage';
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
      // persist orders via updateOrderStatus below (which also sets paidAt)
    }

    // create payment history snapshot before updating status
    const order = getOrders().find(o => o.id === orderId);
    if (order) {
      const vehicle = getVehicles().find(v => v.id === order.vehicleId);
      const servicesAll = getServices();
      const selected = selectedServicesMap[orderId] ?? order.services ?? [];
      const servicesSnapshot = selected.map(sid => {
        const s = servicesAll.find(x => x.id === sid);
        return { id: sid, name: s?.name ?? 'N/A', price: s?.price ?? 0 };
      });

      addPaymentHistoryEntry({
        orderId: order.id,
        customerId: order.customerId,
        vehicleId: order.vehicleId,
        vehicleModel: vehicle?.model ?? 'N/A',
        vehicleBrand: vehicle?.brand ?? 'N/A',
        services: servicesSnapshot,
        totalAmount: order.totalAmount ?? (vehicle?.price ?? 0) + servicesSnapshot.reduce((a,b) => a + b.price, 0),
        paidAt: new Date().toISOString(),
      });
    }

    updateOrderStatus(orderId, 'paid');
    toast.success('Đã xác nhận thanh toán thành công');
    loadOrders();
    // refresh history list
    refreshHistory();
  };

  const handleSaveOrder = (orderId: string) => {
    const selected = selectedServicesMap[orderId] ?? [];
    const vehicle = getVehicles().find(v => v.id === getOrders().find(o => o.id === orderId)!.vehicleId);
    const servicesAll = getServices();
    const servicesSum = selected.map(sid => servicesAll.find(s => s.id === sid)?.price ?? 0).reduce((a,b) => a+b, 0);
    const vehiclePrice = vehicle?.price ?? 0;
    const total = vehiclePrice + servicesSum;
    const updated = updateOrder(orderId, { services: selected, totalAmount: total });
    if (updated) {
      toast.success('Đã lưu thay đổi đơn hàng');
      loadOrders();
    } else {
      toast.error('Không tìm thấy đơn hàng để lưu');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    // confirm
  if (!confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    deleteOrder(orderId);
    toast('Đã xóa đơn hàng');
    loadOrders();
  };

  // Payment history state & export
  const [history, setHistory] = useState(() => getPaymentHistory());

  const refreshHistory = () => setHistory(getPaymentHistory());

  const exportHistoryCSV = () => {
    type Row = {
      id: string;
      orderId: string;
      customerId: string;
      vehicle: string;
      services: string;
      totalAmount: number;
      paidAt: string;
    };

    const rows: Row[] = history.map(h => ({
      id: h.id,
      orderId: h.orderId,
      customerId: h.customerId,
      vehicle: `${h.vehicleBrand} ${h.vehicleModel}`,
      services: h.services.map(s => `${s.name} (${s.price})`).join('; '),
      totalAmount: h.totalAmount,
      paidAt: h.paidAt,
    }));

    const header: (keyof Row)[] = ['id','orderId','customerId','vehicle','services','totalAmount','paidAt'];
    const csv = [header.join(',')].concat(rows.map(r =>
      header.map(hk => {
        const v = r[hk];
        // escape double quotes
        if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
        return String(v ?? '');
      }).join(',')
    )).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                      <TableCell className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePayment(order.id)}
                          className="bg-success hover:bg-success/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Thanh toán
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleSaveOrder(order.id)}>Lưu</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id)}>Xóa</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex items-center">
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-success" />
              Lịch sử thanh toán
            </CardTitle>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={exportHistoryCSV}>Xuất CSV</Button>
              <Button size="sm" variant="ghost" onClick={refreshHistory}>Làm mới</Button>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground">Chưa có lịch sử thanh toán</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Xe</TableHead>
                    <TableHead>Dịch vụ</TableHead>
                    <TableHead>Tổng</TableHead>
                    <TableHead>Ngày thanh toán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.id}</TableCell>
                      <TableCell>{h.orderId}</TableCell>
                      <TableCell>{`${h.vehicleBrand} ${h.vehicleModel}`}</TableCell>
                      <TableCell className="max-w-xs truncate">{h.services.map(s => s.name).join(', ')}</TableCell>
                      <TableCell>{formatCurrency(h.totalAmount)}</TableCell>
                      <TableCell>{formatDate(h.paidAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ThuNgan;
