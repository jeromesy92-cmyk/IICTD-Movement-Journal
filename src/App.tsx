import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
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
import DebugModal from './components/DebugModal';

import OrgChart from './components/OrgChart';
import MovementMap from './components/MovementMap';

// Types
import GuidedTour from './components/GuidedTour';

import PageTransition from './components/PageTransition';

import SupportAI from './components/SupportAI';

export type Role = 'Administrator' | 'System Administrator' | 'Senior Field Engineer' | 'Field Engineer';

export interface UserData {
  id: number;
  id_number: string;
  username: string;
  full_name: string;
  division: string;
  district: string[]; // Changed to array
  area?: string;
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
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [runTour, setRunTour] = useState(false);

  // Error Tracking Logic
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const newError = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        message: event.message || 'Unknown runtime error',
        stack: event.error?.stack || 'N/A',
        type: 'error' as const,
      };
      setSystemErrors(prev => [newError, ...prev].slice(0, 50));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const newError = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack || 'N/A',
        type: 'error' as const,
      };
      setSystemErrors(prev => [newError, ...prev].slice(0, 50));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Intercept fetch for network errors and adding auth headers
    const originalFetch = window.fetch;
    try {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: async (input: RequestInfo | URL, init?: RequestInit) => {
          const userStr = localStorage.getItem('iictd_user');
          const currentUser = userStr ? JSON.parse(userStr) : null;
          
          const newInit = { ...init };
          if (currentUser?.id) {
            newInit.headers = {
              ...newInit.headers,
              'X-User-Id': currentUser.id.toString()
            };
          }

          try {
            const response = await originalFetch(input, newInit);
            if (!response.ok) {
              const newError = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                message: `Network Error: ${response.status} ${response.statusText} at ${input}`,
                type: 'network' as const,
              };
              setSystemErrors(prev => [newError, ...prev].slice(0, 50));
            }
            return response;
          } catch (error: any) {
            const newError = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
              message: `Fetch Failed: ${error.message} at ${input}`,
              type: 'network' as const,
            };
            setSystemErrors(prev => [newError, ...prev].slice(0, 50));
            throw error;
          }
        }
      });
    } catch (e) {
      console.warn("Could not intercept fetch globally:", e);
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      try {
        Object.defineProperty(window, 'fetch', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: originalFetch
        });
      } catch (e) {
        // Fallback for environments where defineProperty might fail on restore
        try { (window as any).fetch = originalFetch; } catch (e2) {}
      }
    };
  }, []);

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
      
      // Check if tour has run
      const hasSeenTour = localStorage.getItem(`iictd_tour_seen_${user.id}`);
      if (!hasSeenTour) {
        setRunTour(true);
      }

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
      case 'approval': return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'assignment': return <UserPlus className="w-3 h-3 text-blue-500" />;
      case 'alert': return <AlertCircle className="w-3 h-3 text-rose-500" />;
      case 'system': return <InfoIcon className="w-3 h-3 text-amber-500" />;
      default: return <Bell className="w-3 h-3 text-muted-foreground" />;
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

  const location = useLocation();

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <Sidebar user={user} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] -z-10 pointer-events-none" />

        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
                                          <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {format(new Date(), 'EEEE, MMMM do yyyy')}
              </h2>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Help/Tour Icon */}
              <div className="relative">
                <button 
                  className="relative focus:outline-none hover:bg-accent p-2 rounded-full transition-colors"
                  onClick={() => setRunTour(true)}
                  title="Start Guided Tour"
                >
                  <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Debug/Error Icon */}
              <div className="relative">
                <button 
                  className="relative focus:outline-none p-2 rounded-full hover:bg-accent transition-colors group"
                  onClick={() => setIsDebugModalOpen(true)}
                  title="System Debug Console"
                >
                  <Bug className={`w-6 h-6 transition-all ${systemErrors.length > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {systemErrors.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center border-2 border-card">
                      {systemErrors.length}
                    </span>
                  )}
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
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
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
                              <div key={n.id} className={`p-3 rounded-lg border border-transparent transition-all ${n.is_read ? 'opacity-50' : 'bg-muted/50 border-border hover:bg-accent'}`}>
                                <div className="flex gap-3">
                                  <div className="mt-0.5 shrink-0">
                                    {getNotificationIcon(n.type)}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-popover-foreground leading-relaxed">{n.message}</p>
                                    {!n.is_read && (
                                      <button onClick={() => handleMarkAsRead(n.id)} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 mt-2 transition-colors">
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
                              className="block w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0284c7&color=fff&size=128`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/50 shadow-lg hover:ring-2 ring-primary transition-all"
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
                                                        <LogOut className="w-4 h-4 text-muted-foreground" />
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
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Dashboard user={user} /></PageTransition>} />
                <Route path="/movements" element={<PageTransition><MovementLog user={user} /></PageTransition>} />
                <Route path="/org-chart" element={<PageTransition><OrgChart user={user} /></PageTransition>} />
                <Route path="/movement-map" element={<PageTransition><MovementMap user={user} /></PageTransition>} />
                <Route path="/profile" element={<PageTransition><MyProfile user={user} onUpdate={handleProfileUpdate} /></PageTransition>} />
                
                <Route path="/settings" element={<PageTransition><SettingsPage user={user} /></PageTransition>} />
                <Route path="/notifications" element={<PageTransition><NotificationSummary user={user} /></PageTransition>} />
                
                {/* Supervisor & Admin Routes */}
                {(user.role === 'Administrator' || user.role === 'System Administrator' || user.role === 'Senior Field Engineer') && (
                  <>
                    <Route path="/reports" element={<PageTransition><Reports user={user} /></PageTransition>} />
                  </>
                )}

                {/* Admin Only Routes */}
                {(user.role === 'Administrator' || user.role === 'System Administrator') && (
                  <>
                    <Route path="/users" element={<PageTransition><UserManagement user={user} /></PageTransition>} />
                    <Route path="/audit" element={<PageTransition><AuditLogs /></PageTransition>} />
                  </>
                )}

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>
        </main>
        
        <Toaster position="top-right" />
        {isStatusModalOpen && <StatusModal user={user} onClose={() => setIsStatusModalOpen(false)} onStatusUpdate={handleStatusUpdate} />}
        {isAppearanceModalOpen && <AppearanceModal theme={theme} setTheme={setTheme} onClose={() => setIsAppearanceModalOpen(false)} />}
        <DebugModal 
          isOpen={isDebugModalOpen} 
          onClose={() => setIsDebugModalOpen(false)} 
          errors={systemErrors} 
          onClear={() => setSystemErrors([])} 
        />
        <SupportAI errors={systemErrors} onClearErrors={() => setSystemErrors([])} />
        <GuidedTour run={runTour} setRun={setRunTour} userRole={user.role} userId={user.id} />
      </div>
  );
}

const ProfileMenuItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md">
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4 text-muted-foreground' })}
    <span>{text}</span>
  </div>
);

function Sidebar({ user }: { user: UserData }) {
  const location = useLocation();
  const { t } = useTranslation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t('Dashboard'), path: '/', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { 
      icon: MapPin, 
      label: t('Movement Journal'), 
      roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'],
      children: [
        { icon: FileText, label: t('Journal Log'), path: '/movements', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
        { icon: BarChart3, label: t('Reports'), path: '/reports', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer'] },
      ]
    },
    { icon: Network, label: t('Org Chart'), path: '/org-chart', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: Globe, label: t('Movement Map'), path: '/movement-map', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: Users, label: t('User Management'), path: '/users', roles: ['Administrator', 'System Administrator'] },
    { icon: History, label: t('Audit Trails'), path: '/audit', roles: ['Administrator', 'System Administrator'] },
    { icon: User, label: t('My Profile'), path: '/profile', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
    { icon: Settings, label: user.role === 'Administrator' || user.role === 'System Administrator' ? t('System Settings') : t('Settings'), path: '/settings', roles: ['Administrator', 'System Administrator', 'Senior Field Engineer', 'Field Engineer'] },
  ];

  // Auto-open menu if child is active
  useEffect(() => {
    const activeParent = menuItems.find(item => 
      item.children?.some(child => location.pathname === child.path)
    );
    if (activeParent && !openMenus.includes(activeParent.label)) {
      setOpenMenus(prev => [...prev, activeParent.label]);
    }
  }, [location.pathname]);

  return (
    <aside className="w-72 bg-card/80 border-r border-border flex flex-col z-20">
      <div className="p-8 flex flex-col h-full">
        <LogoFull className="mb-8" />

        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.filter(item => item.roles.includes(user.role)).map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isMenuOpen = openMenus.includes(item.label);
            const isActive = item.path ? location.pathname === item.path : item.children?.some(c => location.pathname === c.path);
            const tourClass = item.path ? `nav-${item.path === '/' ? 'dashboard' : item.path.substring(1)}` : `nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`;
            
            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${tourClass} ${
                      isActive && !isMenuOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    <ChevronDown className={`ml-auto w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-4 space-y-1"
                      >
                        {item.children!.filter(child => child.roles.includes(user.role)).map((child) => {
                          const isChildActive = location.pathname === child.path;
                          const childTourClass = `nav-${child.path.substring(1)}`;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${childTourClass} ${
                                isChildActive 
                                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                              }`}
                            >
                              <child.icon className={`w-4 h-4 ${isChildActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                              <span className="font-medium text-xs">{child.label}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${tourClass} ${
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
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground"
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
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-accent transition-all group nav-profile"
          >
            <div className="relative">
              <img 
                src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0284c7&color=fff&size=128`}
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
