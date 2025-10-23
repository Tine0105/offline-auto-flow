import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOrders, getCustomers, getVehicles, getServices, updateOrderStatus, Order, addPaymentHistoryEntry, getPaymentHistory, updateOrder, deleteOrder, PaymentHistoryEntry, formatAddress, PaymentMethod, getPromotions } from '@/utils/storage';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

const ThuNgan = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  // map orderId -> selected service ids
  const [selectedServicesMap, setSelectedServicesMap] = useState<Record<string, string[]>>({});
  // map orderId -> payment method
  const [paymentMethodMap, setPaymentMethodMap] = useState<Record<string, PaymentMethod | undefined>>({});
  // map orderId -> selected promotion id
  const [promoMap, setPromoMap] = useState<Record<string, string | undefined>>({});
  const [availablePromotions, setAvailablePromotions] = useState(() => getPromotions());

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
      const paymentMethod = paymentMethodMap[orderId] ?? undefined;
      const promoId = promoMap[orderId];
      const promo = getPromotions().find(p => p.id === promoId);
      const baseTotal = order.totalAmount ?? (vehicle?.price ?? 0) + servicesSnapshot.reduce((a,b) => a + b.price, 0);
      const discountedTotal = promo && promo.discountPercent ? Math.max(0, Math.round(baseTotal * (1 - promo.discountPercent / 100))) : baseTotal;

      addPaymentHistoryEntry({
        orderId: order.id,
        customerId: order.customerId,
        vehicleId: order.vehicleId,
        vehicleModel: vehicle?.model ?? 'N/A',
        vehicleBrand: vehicle?.brand ?? 'N/A',
        services: servicesSnapshot,
        paymentMethod,
        promotionId: promoId,
        totalAmount: discountedTotal,
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
  const [selectedHistory, setSelectedHistory] = useState<PaymentHistoryEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const refreshHistory = () => setHistory(getPaymentHistory());

  const exportHistoryCSV = () => {
    type Row = {
      id: string;
      orderId: string;
      customerId: string;
      vehicle: string;
      services: string;
      paymentMethod?: string;
      totalAmount: number;
      paidAt: string;
    };

    const rows: Row[] = history.map(h => ({
      id: h.id,
      orderId: h.orderId,
      customerId: h.customerId,
      vehicle: `${h.vehicleBrand} ${h.vehicleModel}`,
      services: h.services.map(s => `${s.name} (${s.price})`).join('; '),
      paymentMethod: h.paymentMethod ?? '',
      // attach promotion name if exists
      // (we'll place the promotion name into paymentMethod field? better add column)
      totalAmount: h.totalAmount,
      paidAt: h.paidAt,
    }));

    // build rows with promotion name available via lookup
    const promotions = getPromotions();
    const rowsWithPromo = history.map(h => ({
      id: h.id,
      orderId: h.orderId,
      customerId: h.customerId,
      vehicle: `${h.vehicleBrand} ${h.vehicleModel}`,
      services: h.services.map(s => `${s.name} (${s.price})`).join('; '),
      paymentMethod: h.paymentMethod ?? '',
      promotion: promotions.find(p => p.id === h.promotionId)?.name ?? '',
      totalAmount: h.totalAmount,
      paidAt: h.paidAt,
    }));

    const header = ['id','orderId','customerId','vehicle','services','paymentMethod','promotion','totalAmount','paidAt'];
    type RowWithPromo = {
      id: string; orderId: string; customerId: string; vehicle: string; services: string; paymentMethod: string; promotion: string; totalAmount: number; paidAt: string
    };
    const rowsTyped: RowWithPromo[] = rowsWithPromo;
    const csv = [header.join(',')].concat(rowsTyped.map(r =>
      [
        r.id,
        r.orderId,
        r.customerId,
        r.vehicle,
        r.services,
        r.paymentMethod,
        r.promotion,
        String(r.totalAmount),
        r.paidAt,
      ].map(v => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v))).join(',')
    )).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePaymentMethodChange = (orderId: string, method: PaymentMethod) => {
    setPaymentMethodMap(prev => ({ ...prev, [orderId]: method }));
    // also persist to order so saving order keeps the method
    updateOrder(orderId, { paymentMethod: method });
  };

  const openHistoryDetail = (h: PaymentHistoryEntry) => {
    setSelectedHistory(h);
    setDetailOpen(true);
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
                            <div className="pt-2">
                              <label className="text-sm">Hình thức thanh toán</label>
                              <select
                                className="block w-full mt-1 p-2 border rounded"
                                value={paymentMethodMap[order.id] ?? ''}
                                onChange={(e) => handlePaymentMethodChange(order.id, e.target.value as PaymentMethod)}
                              >
                                <option value="">Chọn hình thức</option>
                                <option value="cash">Tiền mặt</option>
                                <option value="bank_transfer">Chuyển khoản</option>
                                <option value="card">Thẻ</option>
                                <option value="other">Khác</option>
                              </select>
                            </div>
                              <div className="pt-2">
                                <label className="text-sm">Khuyến mãi (tuỳ chọn)</label>
                                <select
                                  className="block w-full mt-1 p-2 border rounded"
                                  value={promoMap[order.id] ?? ''}
                                  onChange={(e) => setPromoMap(prev => ({ ...prev, [order.id]: e.target.value || undefined }))}
                                >
                                  <option value="">Không áp dụng</option>
                                  {availablePromotions.map(p => {
                                    // show only promotions that apply to this vehicle or all
                                    if (p.vehicleIds && p.vehicleIds.length > 0 && !p.vehicleIds.includes(order.vehicleId)) return null;
                                    return <option key={p.id} value={p.id}>{p.name} ({p.discountPercent}%)</option>;
                                  })}
                                </select>
                              </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {(() => {
                          const base = computedOrderTotal(order);
                          const promoId = promoMap[order.id];
                          const promo = getPromotions().find(p => p.id === promoId);
                          if (promo && promo.discountPercent) {
                            const discounted = Math.max(0, Math.round(base * (1 - promo.discountPercent / 100)));
                            return (
                              <div>
                                <div className="text-sm line-through text-muted-foreground">{formatCurrency(base)}</div>
                                <div className="text-lg font-semibold text-primary">{formatCurrency(discounted)}</div>
                              </div>
                            );
                          }
                          return <div className="text-lg font-semibold">{formatCurrency(base)}</div>;
                        })()}
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
                      <TableCell className="flex items-center gap-2">
                        <span>{h.orderId}</span>
                        <button title="Xem chi tiết" onClick={() => openHistoryDetail(h)} className="p-1 hover:bg-muted rounded">
                          <Info className="h-4 w-4" />
                        </button>
                      </TableCell>
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

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chi tiết giao dịch</DialogTitle>
              <DialogDescription>Thông tin người mua và thông tin cơ bản từ Bán hàng</DialogDescription>
            </DialogHeader>
            {selectedHistory ? (
              <div className="space-y-3 mt-4">
                <div>
                  <div className="text-sm text-muted-foreground">Mã đơn</div>
                  <div className="font-medium">{selectedHistory.orderId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Khách hàng</div>
                  <div className="font-medium">{getCustomers().find(c => c.id === selectedHistory.customerId)?.name || selectedHistory.customerId}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Số điện thoại</div>
                  <div className="font-medium">{getCustomers().find(c => c.id === selectedHistory.customerId)?.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Địa chỉ</div>
                  <div className="font-medium">{formatAddress(getCustomers().find(c => c.id === selectedHistory.customerId)?.address)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Xe</div>
                  <div className="font-medium">{`${selectedHistory.vehicleBrand} ${selectedHistory.vehicleModel}`}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Dịch vụ</div>
                  <div className="font-medium">{selectedHistory.services.map(s => `${s.name} (${formatCurrency(s.price)})`).join(', ')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tổng</div>
                  <div className="font-medium">{formatCurrency(selectedHistory.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Thời gian thanh toán</div>
                  <div className="font-medium">{formatDate(selectedHistory.paidAt)}</div>
                </div>
              </div>
            ) : (
              <div>Không có dữ liệu</div>
            )}
            <DialogFooter className="mt-4">
              <DialogClose className="btn">Đóng</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ThuNgan;
