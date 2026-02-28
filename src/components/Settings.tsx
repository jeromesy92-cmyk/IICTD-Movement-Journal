import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database, 
  Mail, 
  Lock,
  Smartphone,
  Eye,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { UserData } from '../App';

export default function Settings({ user }: { user: UserData }) {
  const { t, i18n } = useTranslation();
  const isAdmin = user.role === 'Administrator' || user.role === 'System Administrator';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'general' : 'security');

  const allTabs = [
    { id: 'general', label: t('General'), icon: Globe },
    { id: 'security', label: t('Security'), icon: Shield },
    { id: 'privacy', label: t('Privacy'), icon: Eye },
    { id: 'notifications', label: t('Notifications'), icon: Bell },
    { id: 'system', label: t('System'), icon: Database },
  ];

  const tabs = isAdmin 
    ? allTabs 
    : allTabs.filter(tab => tab.id === 'security' || tab.id === 'privacy');

  const [sessionTimeout, setSessionTimeout] = useState(() => {
    const saved = localStorage.getItem('session_timeout_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [privacySettings, setPrivacySettings] = useState(() => {
    const saved = localStorage.getItem('privacy_settings');
    return saved ? JSON.parse(saved) : {
      profileVisibility: true,
      activityStatus: true,
      dataCollection: false
    };
  });

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('notification_settings');
    return saved ? JSON.parse(saved) : {
      email: true,
      push: true,
      approvals: true,
      updates: true,
      assignments: true,
      security: true
    };
  });

  const handleSave = () => {
    localStorage.setItem('session_timeout_enabled', sessionTimeout.toString());
    localStorage.setItem('privacy_settings', JSON.stringify(privacySettings));
    localStorage.setItem('notification_settings', JSON.stringify(notificationSettings));
    toast.success('Settings saved successfully');
  };

  const notificationOptions = [
    { id: 'email', label: 'Email Notifications', description: 'Receive updates via your registered email.' },
    { id: 'push', label: 'Push Notifications', description: 'Get real-time alerts on your browser.' },
    { id: 'approvals', label: 'Approval Alerts', description: 'Notifications for movement approvals and rejections.' },
    { id: 'assignments', label: 'Assignment Alerts', description: 'Get notified when a movement is assigned to you.' },
    { id: 'updates', label: 'System Updates', description: 'Stay informed about system maintenance and new features.' },
    { id: 'security', label: 'Security Alerts', description: 'Alerts for login attempts and security changes.' },
  ];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">{isAdmin ? t('System Settings') : t('Settings')}</h1>
        <p className="text-slate-400">{t('Manage your')} {isAdmin ? t('system preferences and configuration') : t('account settings')}.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#001a33] border border-white/5 rounded-2xl p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">System Name</label>
                      <input 
                        type="text" 
                        defaultValue="IICTD Movement Journal"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Support Email</label>
                      <input 
                        type="email" 
                        defaultValue="support@iictd.gov"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">{t('Default Language')}</label>
                      <select 
                        onChange={handleLanguageChange}
                        value={i18n.language}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50"
                      >
                        <option value="en">{t('English')}</option>
                        <option value="tl">{t('Tagalog')}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Timezone</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50">
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="PST">Pacific Time (GMT-8)</option>
                        <option value="EST">Eastern Time (GMT-5)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Security</h3>
                  
                  <div className="p-6 bg-white/5 rounded-xl border border-white/5 space-y-4">
                    <h4 className="text-sm font-bold text-white mb-4">Change Password</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Current Password</label>
                        <input 
                          type="password" 
                          placeholder="Enter current password"
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">New Password</label>
                        <input 
                          type="password" 
                          placeholder="Enter new password"
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Confirm New Password</label>
                        <input 
                          type="password" 
                          placeholder="Confirm new password"
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 ring-blue-500/50"
                        />
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-slate-400">Add an extra layer of security to your account.</p>
                      </div>
                      <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">Session Timeout</p>
                        <p className="text-xs text-slate-400">Automatically log out after 30 minutes of inactivity.</p>
                      </div>
                      <button 
                        onClick={() => setSessionTimeout(!sessionTimeout)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${sessionTimeout ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: sessionTimeout ? 24 : 4 }}
                          initial={false}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Privacy</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">Profile Visibility</p>
                        <p className="text-xs text-slate-400">Allow other users to see your profile information.</p>
                      </div>
                      <button 
                        onClick={() => setPrivacySettings({...privacySettings, profileVisibility: !privacySettings.profileVisibility})}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${privacySettings.profileVisibility ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: privacySettings.profileVisibility ? 24 : 4 }}
                          initial={false}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">Activity Status</p>
                        <p className="text-xs text-slate-400">Show when you are currently active in the system.</p>
                      </div>
                      <button 
                        onClick={() => setPrivacySettings({...privacySettings, activityStatus: !privacySettings.activityStatus})}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${privacySettings.activityStatus ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: privacySettings.activityStatus ? 24 : 4 }}
                          initial={false}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">Data Collection</p>
                        <p className="text-xs text-slate-400">Allow the system to collect usage data to improve experience.</p>
                      </div>
                      <button 
                        onClick={() => setPrivacySettings({...privacySettings, dataCollection: !privacySettings.dataCollection})}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${privacySettings.dataCollection ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: privacySettings.dataCollection ? 24 : 4 }}
                          initial={false}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full" 
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">Notification Preferences</h3>
                  <div className="space-y-4">
                    {notificationOptions.map((option) => (
                      <div key={option.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">{option.label}</p>
                          <p className="text-xs text-slate-400">{option.description}</p>
                        </div>
                        <button 
                          onClick={() => setNotificationSettings({
                            ...notificationSettings, 
                            [option.id]: !notificationSettings[option.id as keyof typeof notificationSettings]
                          })}
                          className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${notificationSettings[option.id as keyof typeof notificationSettings] ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                          <motion.div 
                            animate={{ x: notificationSettings[option.id as keyof typeof notificationSettings] ? 24 : 4 }}
                            initial={false}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full" 
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white">System Configuration</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-sm text-blue-400 font-medium">System Version: v2.4.0-stable</p>
                    </div>
                    <button className="w-full py-3 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-all">
                      Check for Updates
                    </button>
                    <button className="w-full py-3 rounded-xl border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/5 transition-all">
                      Clear System Cache
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-white/5 flex justify-end">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Save className="w-4 h-4" />
                  {t('Save Changes')}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}