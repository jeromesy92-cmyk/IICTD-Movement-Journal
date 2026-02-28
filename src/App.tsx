import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Download,
  Menu,
  X,
  ChevronRight,
  User,
  Shield,
  Briefcase,
  Calendar,
  BarChart3,
  History,
  Bell,
  Network,
  Bug,
  Globe,
  AlertCircle,
  UserPlus,
  Info as InfoIcon
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { EyeOff, Palette, Settings as SettingsIcon, Info, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Components
import Dashboard from './components/Dashboard';
import { LogoFull } from './components/Logo';
import MovementLog from './components/MovementLog';
import UserManagement from './components/UserManagement';
import Reports from './components/Reports';
import SettingsPage from './components/Settings';

import Login from './components/Login';
import AuditLogs from './components/AuditLogs';
import MyProfile from './components/MyProfile';
import StatusModal from './components/StatusModal';
import AppearanceModal from './components/AppearanceModal';
import NotificationSummary from './components/NotificationSummary';

import OrgChart from './components/OrgChart';
import MovementMap from './components/MovementMap';

// Types
export type Role = 'Administrator' | 'System Administrator' | 'Senior Field Engineer' | 'Field Engineer';

export interface UserData {
  id: number;
  id_number: string;
  username: string;
  full_name: string;
  division: string;
  district: string[]; // Changed to array
  base_office?: string;
  role: Role;
  supervisor_id?: number;
  supervisor_name?: string;
  status: string;
  avatar_url?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  date_of_birth?: string;
  language?: string;
  locale?: string;
  first_day_of_week?: string;
  website?: string;
  x_handle?: string;
  fediverse_handle?: string;
  organisation?: string;
  profile_role?: string;
  headline?: string;
  about?: string;
  online_status?: string;
  status_message?: string;
  last_login?: string;
}

export default function App() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem('iictd_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Refresh user data from server to ensure it's up to date
      fetch(`/api/users/${user.id}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch user'))
        .then(data => {
          setUser(data);
          localStorage.setItem('iictd_user', JSON.stringify(data));
        })
        .catch(err => console.error("User refresh failed:", err));

      const interval = setInterval(fetchNotifications, 5000); // Auto-refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchNotifications = () => {
    if (user) {
      fetch(`/api/notifications/${user.id}`)
        .then(res => res.json())
        .then(data => setNotifications(data));
    }
  };

  const handleMarkAsRead = (id: number) => {
    fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
      .then(res => res.json())
      .then(() => fetchNotifications());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case 'assignment': return <UserPlus className="w-3 h-3 text-blue-400" />;
      case 'alert': return <AlertCircle className="w-3 h-3 text-rose-400" />;
      case 'system': return <InfoIcon className="w-3 h-3 text-amber-400" />;
      default: return <Bell className="w-3 h-3 text-slate-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n: any) => {
    const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
    if (Object.keys(settings).length === 0) return true;

    if (n.type === 'approval') return settings.approvals;
    if (n.type === 'assignment') return settings.assignments;
    if (n.type === 'system' || n.type === 'alert') return settings.updates;
    if (n.type === 'security') return settings.security;
    return true; // Show general by default
  });

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    localStorage.setItem('iictd_user', JSON.stringify(userData));
  };

  const handleProfileUpdate = (updatedUser: UserData) => {
    setUser(updatedUser);
    localStorage.setItem('iictd_user', JSON.stringify(updatedUser));
  };

  const handleStatusUpdate = (statusData: Partial<UserData>) => {
    if (!user) return;

    const updatedUser = { ...user, ...statusData };

    const promise = fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    })
    .then(() => {
      handleProfileUpdate(updatedUser);
      return 'Status updated successfully';
    });

    toast.promise(promise, {
      loading: 'Updating status...',
      success: (msg) => msg,
      error: (err) => err.message,
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('iictd_user');
  };

  // Session Timeout Logic
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

    const resetTimer = () => {
      const saved = localStorage.getItem('session_timeout_enabled');
      const isEnabled = saved === null ? true : saved === 'true';
      
      if (timeoutId) clearTimeout(timeoutId);

      if (!isEnabled) return;
      
      timeoutId = setTimeout(() => {
        handleLogout();
        toast('Session expired due to inactivity', {
          icon: '⏳',
          duration: 5000,
        });
      }, TIMEOUT_DURATION);
    };

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Initial timer setup
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <Router>
                  <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
        <Sidebar user={user} />
        
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] -z-10 pointer-events-none" />

                              <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
                                          <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {format(new Date(), 'EEEE, MMMM do yyyy')}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Debug/Error Icon */}
              <div className="relative">
                <button 
                  className="relative focus:outline-none"
                >
                  <Bug className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  className="relative focus:outline-none"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className={`w-6 h-6 transition-colors ${isNotificationsOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`} />
                  {filteredNotifications.filter((n: any) => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {filteredNotifications.filter((n: any) => !n.is_read).length}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsNotificationsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl p-4 space-y-2 z-30">
                      <h3 className="text-sm font-bold text-popover-foreground">{t('Notifications')}</h3>
                      {filteredNotifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t('No new notifications.')}</p>
                      ) : (
                        <>
                          <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
                            {filteredNotifications.slice(0, 5).map((n: any) => (
                              <div key={n.id} className={`p-3 rounded-lg border border-transparent transition-all ${n.is_read ? 'opacity-50' : 'bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10'}`}>
                                <div className="flex gap-3">
                                  <div className="mt-0.5 shrink-0">
                                    {getNotificationIcon(n.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-popover-foreground leading-relaxed">{n.message}</p>
                                    {!n.is_read && (
                                      <button onClick={() => handleMarkAsRead(n.id)} className="text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                                        {t('Mark as read')}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 mt-2 border-t border-border">
                            <Link 
                              to="/notifications" 
                              className="block w-full text-center text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                              onClick={() => setIsNotificationsOpen(false)}
                            >
                              {t('View all notifications')}
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=0284c7&color=fff&size=128`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/50 shadow-lg hover:ring-2 ring-blue-400 transition-all"
                  />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <>
                                                                  <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-72 bg-popover border border-border rounded-xl shadow-2xl z-30 overflow-hidden"
                      >
                                                                        <div className="p-4 border-b border-border">
                                                                              <p className="font-bold text-popover-foreground">{user.full_name}</p>
                                                                              <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="text-sm text-muted-foreground hover:underline">{t('View profile')}</Link>
                        </div>
                        <div className="p-2">
                          <button onClick={() => { setIsStatusModalOpen(true); setIsProfileMenuOpen(false); }} className="w-full">
                            <ProfileMenuItem icon={<EyeOff />} text={t("Invisible")} />
                          </button>
                                                    <button onClick={() => { setIsAppearanceModalOpen(true); setIsProfileMenuOpen(false); }} className="w-full">
                            <ProfileMenuItem icon={<Palette />} text={t("Appearance and accessibility")} />
                          </button>
                          <Link to="/settings" onClick={() => setIsProfileMenuOpen(false)}><ProfileMenuItem icon={<SettingsIcon />} text={t("Settings")} /></Link>
                          <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)}><ProfileMenuItem icon={<Info />} text={t("About & What's new")} /></Link>
                          <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)}><ProfileMenuItem icon={<HelpCircle />} text={t("Help & privacy")} /></Link>
                                                                              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md">
                                                        <LogOut className="w-4 h-4 text-slate-500" />
                            <span>{t('Log out')}</span>
                          </button>
                        </div>
                      </motion.div>
                      <div onClick={() => setIsProfileMenuOpen(false)} className="fixed inset-0 z-20" />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/movements" element={<MovementLog user={user} />} />
              <Route path="/org-chart" element={<OrgChart user={user} />} />
              <Route path="/movement-map" element={<MovementMap user={user} />} />
              <Route path="/profile" element={<MyProfile user={user} onUpdate={handleProfileUpdate} />} />
              
              <Route path="/settings" element={<SettingsPage user={user} />} />
              <Route path="/notifications" element={<NotificationSummary user={user} />} />
              
              {/* Supervisor & Admin Routes */}
              {(user.role === 'Administrator' || user.role === 'System Administrator' || user.role === 'Senior Field Engineer') && (
                <>
                  <Route path="/reports" element={<Reports user={user} />} />
                </>
              )}

              {/* Admin Only Routes */}
              {(user.role === 'Administrator' || user.role === 'System Administrator') && (
                <>
                  <Route path="/users" element={<UserManagement user={user} />} />
                  <Route path="/audit" element={<AuditLogs />} />
                </>
              )}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        
        <Toaster position="top-right" />
                {isStatusModalOpen && <StatusModal user={user} onClose={() => setIsStatusModalOpen(false)} onStatusUpdate={handleStatusUpdate} />}
        {isAppearanceModalOpen && <AppearanceModal theme={theme} setTheme={setTheme} onClose={() => setIsAppearanceModalOpen(false)} />}
      </div>
    </Router>
  );
}

const ProfileMenuItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md">
    {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 text-muted-foreground' })}
    <span>{text}</span>
  </div>
);

function Sidebar({ user }: { user: UserData }) {
  const location = useLocation();
  const { t } = useTranslation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('Dashboard'), path: '/', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: MapPin, label: t('Movement Journal'), path: '/movements', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: Network, label: t('Org Chart'), path: '/org-chart', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: Globe, label: t('Movement Map'), path: '/movement-map', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: BarChart3, label: t('Reports'), path: '/reports', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer'] },
    { icon: Users, label: t('User Management'), path: '/users', roles: ['Administrator', 'System Administrator'] },
    { icon: History, label: t('Audit Trails'), path: '/audit', roles: ['Administrator', 'System Administrator'] },
    { icon: User, label: t('My Profile'), path: '/profile', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: Settings, label: user.role === 'Administrator' || user.role === 'System Administrator' ? t('System Settings') : t('Settings'), path: '/settings', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
  ];

  return (
            <aside className="w-72 bg-card/80 border-r border-border flex flex-col z-20">
      <div className="p-8">
        <LogoFull className="mb-8" />

        <nav className="space-y-1 flex-1">
          {menuItems.filter(item => item.roles.includes(user.role)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                                      isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                                                 <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section in Sidebar */}
        <div className="mt-auto pt-8 border-t border-border">
          <Link 
            to="/profile"
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-accent transition-all group"
          >
            <div className="relative">
              <img 
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=0284c7&color=fff&size=128`}
                alt="Avatar"
                className="w-10 h-10 rounded-xl object-cover border border-border group-hover:border-primary/50 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role}</p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
