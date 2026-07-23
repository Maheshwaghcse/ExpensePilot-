import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  LayoutDashboard, 
  Receipt, 
  ShieldAlert, 
  Settings, 
  Users, 
  LogOut, 
  Bell, 
  Check, 
  Menu, 
  X,
  CreditCard
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Fetch in-app notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation options based on user role
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Employee', 'Company Admin', 'HR Manager', 'Auditor'] },
    { name: 'Expenses', path: '/expenses', icon: Receipt, roles: ['Employee', 'Company Admin', 'HR Manager', 'Auditor'] },
    { name: 'Policies', path: '/policies', icon: Settings, roles: ['Company Admin'] },
    { name: 'Employees', path: '/users', icon: Users, roles: ['Company Admin', 'HR Manager'] },
    { name: 'Auditing & Fraud', path: '/fraud', icon: ShieldAlert, roles: ['Company Admin', 'Auditor'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-sidebar flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
            <div className="p-2 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none text-glow-brand">ExpensePilot</h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Auditing SaaS</span>
            </div>
            <button className="lg:hidden ml-auto text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600/25 text-white border-l-4 border-indigo-500 shadow-md shadow-indigo-600/5' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card Profile & Logout */}
        <div className="p-4 border-t border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-white/5 text-sm font-semibold text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 glass-card border-b border-white/5">
          <button 
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <h2 className="text-lg font-bold text-white hidden sm:block">
            {navItems.find(item => item.path === location.pathname)?.name || 'Account'}
          </h2>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-xl bg-slate-900 border border-white/5 text-slate-300 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900 pulse-glow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-card bg-slate-900 border border-white/10 shadow-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-slate-950/40">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          className={`p-4 transition-colors hover:bg-white/5 ${notif.isRead ? 'opacity-60' : 'bg-indigo-600/5'}`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h5 className="text-xs font-bold text-white leading-tight">{notif.title}</h5>
                            {!notif.isRead && (
                              <button 
                                onClick={() => handleMarkAsRead(notif._id)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-normal">{notif.message}</p>
                          <span className="text-[9px] text-slate-400 font-medium block mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Widget */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/5 bg-slate-900/60">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden md:inline">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
