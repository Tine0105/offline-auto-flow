import { Link, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { path: '/kho', label: 'Kho', icon: Package },
    { path: '/ban-hang', label: 'Bán hàng', icon: ShoppingCart },
    { path: '/thu-ngan', label: 'Thu ngân', icon: DollarSign },
    { path: '/quan-ly', label: 'Quản lý', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-sidebar border-b border-sidebar-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-sidebar-primary" />
              <span className="text-xl font-bold text-sidebar-foreground">Hệ thống Bán Xe</span>
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout;
