import React, { useState, useEffect } from 'react';
import { UserData } from '../App';
import { format } from 'date-fns';
import { CheckCircle2, Trash2, Bell, Search, Filter, X, AlertCircle, CheckCircle, Info, UserPlus, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export type NotificationType = 'general' | 'system' | 'approval' | 'assignment' | 'alert' | 'security';

interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: NotificationType;
  is_read: number;
  created_at: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'approval': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'assignment': return <UserPlus className="w-4 h-4 text-blue-400" />;
    case 'alert': return <AlertCircle className="w-4 h-4 text-rose-400" />;
    case 'system': return <Info className="w-4 h-4 text-amber-400" />;
    case 'security': return <Shield className="w-4 h-4 text-indigo-400" />;
    default: return <Bell className="w-4 h-4 text-slate-400" />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'approval': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'assignment': return 'bg-blue-500/10 border-blue-500/20';
    case 'alert': return 'bg-rose-500/10 border-rose-500/20';
    case 'system': return 'bg-amber-500/10 border-amber-500/20';
    case 'security': return 'bg-indigo-500/10 border-indigo-500/20';
    default: return 'bg-slate-500/10 border-slate-500/20';
  }
};

export default function NotificationSummary({ user }: { user: UserData }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${user.id}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    if (action === 'delete') {
      try {
        const response = await fetch('/api/notifications/bulk/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedNotifications })
        });
        
        if (response.ok) {
          toast.success(`${selectedNotifications.length} notifications deleted`);
          setSelectedNotifications([]);
          fetchNotifications();
        } else {
          toast.error('Failed to delete notifications');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    } else if (action === 'read') {
      try {
        const response = await fetch('/api/notifications/bulk/read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedNotifications })
        });
        
        if (response.ok) {
          toast.success(`${selectedNotifications.length} notifications marked as read`);
          setSelectedNotifications([]);
          fetchNotifications();
        } else {
          toast.error('Failed to update notifications');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const toggleSelectNotification = (id: number) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(nId => nId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/notifications/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      
      if (response.ok) {
        toast.success('Notification deleted');
        fetchNotifications();
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' 
      ? true 
      : filter === 'unread' 
        ? !n.is_read 
        : n.is_read;
    const matchesType = typeFilter === 'all' ? true : n.type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">Stay updated with system alerts and activity.</p>
        </div>
      </div>

      <div className="bg-[#001a33] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search notifications..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'unread' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                Unread
              </button>
              <button 
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'read' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                Read
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center mr-2">Filter by Type:</span>
            {(['all', 'approval', 'assignment', 'system', 'alert', 'security', 'general'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  typeFilter === type 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-transparent border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedNotifications.length > 0 && (
            <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-400">
                {selectedNotifications.length} selected
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Mark as Read
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4 w-12">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filteredNotifications.length > 0 && selectedNotifications.length === filteredNotifications.length}
                      onChange={toggleSelectAll}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:bg-blue-600 checked:border-blue-600"
                    />
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                  </div>
                </th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Message</th>
                <th className="px-6 py-4 w-48">Date</th>
                <th className="px-6 py-4 w-32 text-center">Status</th>
                <th className="px-6 py-4 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading notifications...</td></tr>
              ) : filteredNotifications.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No notifications found.</td></tr>
              ) : filteredNotifications.map((n) => (
                <tr key={n.id} className={`hover:bg-white/[0.02] transition-all group border-b border-white/[0.02] last:border-0 ${selectedNotifications.includes(n.id) ? 'bg-blue-500/5' : ''} ${!n.is_read ? 'bg-blue-500/[0.02]' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedNotifications.includes(n.id)}
                        onChange={() => toggleSelectNotification(n.id)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:bg-blue-600 checked:border-blue-600"
                      />
                      <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getNotificationColor(n.type)}`}>
                      {getNotificationIcon(n.type)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-slate-700'}`} />
                      <p className={`text-sm ${!n.is_read ? 'text-white font-medium' : 'text-slate-400'}`}>{n.message}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 font-mono">
                      {format(new Date(n.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${!n.is_read ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-500'}`}>
                      {!n.is_read ? 'Unread' : 'Read'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(n.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
