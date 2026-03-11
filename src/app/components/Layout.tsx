import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const employeeNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/employee/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      label: 'Historico',
      path: '/employee/history',
      icon: <Calendar className="w-5 h-5" />
    }
  ];

  const supervisorNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/supervisor/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      label: 'Meu Painel',
      path: '/supervisor/my-dashboard',
      icon: <Calendar className="w-5 h-5" />
    },
    {
      label: 'Meu Historico',
      path: '/supervisor/my-history',
      icon: <FileText className="w-5 h-5" />
    },
    {
      label: 'Funcionarios',
      path: '/supervisor/employees',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Relatorios',
      path: '/supervisor/reports',
      icon: <FileText className="w-5 h-5" />
    },
    {
      label: 'Configuracoes',
      path: '/supervisor/settings',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const navItems = user?.role === 'supervisor' || user?.role === 'admin' ? supervisorNavItems : employeeNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-gradient-to-b from-primary via-[#39b3ef] to-accent">
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <img src="/labs.png" alt="Labs" className="w-6 h-6 object-contain" />
              </div>
            <div className="flex flex-col">
              <span className="text-sidebar-foreground font-semibold">Reembolso Combustivel Labs</span>
              <span className="text-xs text-white/92">Plataforma Labs</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-white/80 truncate">
                  {user?.employeeId || user?.role}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-primary via-[#39b3ef] to-accent shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                    <img src="/labs.png" alt="Labs" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sidebar-foreground font-semibold">Reembolso Combustivel Labs</span>
                    <span className="text-xs text-white/92">Plataforma Labs</span>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.path)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.name.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-white/80 truncate">
                      {user?.employeeId || user?.role}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <img src="/labs.png" alt="Labs" className="w-5 h-5 object-contain" />
              </div>
              <span className="font-semibold text-foreground">Reembolso Combustivel Labs</span>
            </div>
            <div className="w-6" />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
