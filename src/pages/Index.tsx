import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';
import { initializeDefaultData } from '@/utils/storage';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    initializeDefaultData();
  }, []);

  const modules = [
    {
      title: 'Bộ phận Kho',
      description: 'Nhập xe vào kho và quản lý tồn kho',
      icon: Package,
      path: '/kho',
      color: 'text-primary',
    },
    {
      title: 'Nhân viên Bán hàng',
      description: 'Tạo đơn hàng và quản lý khách hàng',
      icon: ShoppingCart,
      path: '/ban-hang',
      color: 'text-success',
    },
    {
      title: 'Nhân viên Thu ngân',
      description: 'Xử lý thanh toán đơn hàng',
      icon: DollarSign,
      path: '/thu-ngan',
      color: 'text-warning',
    },
    {
      title: 'Quản lý Cửa hàng',
      description: 'Báo cáo và quản lý hệ thống',
      icon: BarChart3,
      path: '/quan-ly',
      color: 'text-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Hệ thống Quản lý Bán xe
          </h1>
          <p className="text-xl text-muted-foreground">
            Giải pháp số hóa quy trình bán xe offline
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.path} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className={`h-6 w-6 ${module.color}`} />
                    <span>{module.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{module.description}</p>
                  <Button
                    onClick={() => navigate(module.path)}
                    className="w-full"
                  >
                    Truy cập
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
