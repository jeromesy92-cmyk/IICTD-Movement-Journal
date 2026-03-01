import React, { useState, useRef, useEffect } from 'react';
import { UserData } from '../App';
import { toast } from 'react-hot-toast';
import { Upload, Folder, Trash2, Users, Mail, Phone, MapPin as Location, Calendar, Languages, Globe, Columns, Link as LinkIcon, Lock, Activity, Clock } from 'lucide-react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const ProfileInput = ({ label, id, value, onChange, type = 'text', icon: Icon, locked = false, placeholder, children }: { label: any, id: any, value: any, onChange: any, type?: string, icon?: any, locked?: boolean, placeholder?: string, children?: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-muted-foreground flex items-center gap-2">
      {label}
      {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
      {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
    </label>
    {children ? (
      <div className="relative">
        {children}
      </div>
    ) : type === 'textarea' ? (
      <textarea
        id={id}
        name={id}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="bg-input border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring transition w-full resize-none"
      />
    ) : (
      <input
        type={type}
        id={id}
        name={id}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-input border border-border rounded-md px-3 py-2 text-foreground focus:ring-2 focus:ring-ring transition w-full"
      />
    )}
  </div>
);

export default function MyProfile({ user, onUpdate }: { user: UserData, onUpdate: (user: UserData) => void }) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState(user);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(user);
    
    // Fetch activity logs
    fetch(`/api/users/${user.id}/activity`)
      .then(res => res.json())
      .then(data => setActivityLogs(data))
      .catch(err => console.error("Failed to fetch activity logs", err));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'language') {
      const langCode = value === 'Tagalog' ? 'tl' : 'en';
      i18n.changeLanguage(langCode);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Do not set formData.avatar_url here to avoid sending huge base64 strings in PUT
          setPreviewUrl(base64String);
          setNewAvatar(file);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('The file must be a PNG or JPG');
      }
    }
  };

  const handleAvatarUpload = async (): Promise<string | undefined> => {
    if (!newAvatar) return undefined;
    
    const uploadData = new FormData();
    uploadData.append('avatar', newAvatar);

    const uploadPromise = fetch(`/api/users/${user.id}/avatar`, {
      method: 'POST',
      body: uploadData,
    }).then(async res => {
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.success) {
        onUpdate(data.user);
        setFormData(prev => ({ ...prev, avatar_url: data.user.avatar_url }));
        setNewAvatar(null);
        setPreviewUrl(null);
        return data.user.avatar_url;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    });

    toast.promise(uploadPromise, {
      loading: 'Uploading avatar...',
      success: 'Avatar updated successfully',
      error: 'Failed to upload avatar',
    });

    return uploadPromise;
  };

  const handleProfileSave = async () => {
    let currentFormData = { ...formData };
    
    // If there's a pending avatar upload, do it first
    if (newAvatar) {
      try {
        const newAvatarUrl = await handleAvatarUpload();
        if (newAvatarUrl) {
          currentFormData.avatar_url = newAvatarUrl;
        }
      } catch (e) {
        toast.error('Failed to upload avatar before saving profile');
        return;
      }
    }

    const promise = fetch(`/api/users/${user.id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentFormData)
    })
      .then(res => res.ok ? res.json() : Promise.reject('Update failed'))
      .then(() => {
        onUpdate(currentFormData);
        return 'Profile updated successfully';
      });

    toast.promise(promise, {
      loading: 'Saving...',
      success: (msg) => msg,
      error: 'Update failed',
    });
    
    return promise;
  };

  const handleAvatarDelete = async () => {
    const promise = fetch(`/api/users/${user.id}/avatar`, { 
      method: 'DELETE', 
    })
      .then(res => res.ok ? res.json() : Promise.reject('Delete failed'))
      .then(data => {
        if (data.success) {
          const updatedFormData = { ...formData, avatar_url: null };
          setFormData(updatedFormData);
          onUpdate(data.user);
          setNewAvatar(null);
          setPreviewUrl(null);
          return 'Avatar removed successfully';
        } else {
          return Promise.reject(data.message || 'Delete failed');
        }
      });

    toast.promise(promise, {
      loading: 'Removing...',
      success: (msg) => msg,
      error: 'Failed to remove avatar',
    });
  };

  return (
    <div className="text-slate-900 dark:text-white font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">{t('Profile picture')}</h2>
            <Users className="w-6 h-6 text-foreground" />
          </div>
          
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="relative group">
              <img 
                src={previewUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=1e293b&color=94a3b8&size=256`}
                alt="Profile"
                className="w-48 h-48 rounded-2xl object-cover shadow-2xl"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors shadow-sm"
                title="Upload"
              >
                <Upload className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) {
                    setFormData(prev => ({ ...prev, avatar_url: url }));
                    setPreviewUrl(url);
                  }
                }} 
                className="p-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors shadow-sm"
                title="Link"
              >
                <LinkIcon className="w-5 h-5 text-foreground" />
              </button>
              <button 
                onClick={handleAvatarDelete} 
                className="p-3 bg-card border border-border rounded-xl hover:bg-accent transition-colors shadow-sm"
                title="Delete"
              >
                <Trash2 className="w-5 h-5 text-foreground" />
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".png, .jpg, .jpeg" />
            <p className="text-sm font-medium text-foreground">{t('The file must be a PNG or JPG')}</p>
            
            { (newAvatar || previewUrl) && (
              <div className="flex gap-3">
                <button 
                  onClick={newAvatar ? handleAvatarUpload : handleProfileSave} 
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('Save Picture')}
                </button>
                <button 
                  onClick={() => { setNewAvatar(null); setPreviewUrl(null); setFormData(user); }}
                  className="px-6 py-2 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('Cancel')}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-bold text-foreground">Profile</h2>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="enable-profile" 
                className="toggle-switch" 
                defaultChecked 
              />
              <label htmlFor="enable-profile" className="text-lg font-medium text-foreground">{t('Enable profile')}</label>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProfileInput label={t("Full name")} id="full_name" value={formData.full_name} onChange={handleInputChange} icon={Users} />
            <ProfileInput label={t("Email")} id="email" value={formData.email} onChange={handleInputChange} icon={Mail} />
            <ProfileInput label={t("Phone number")} id="phone_number" value={formData.phone_number} onChange={handleInputChange} icon={Phone} locked />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProfileInput label={t("Location")} id="location" value={formData.location} onChange={handleInputChange} icon={Location} locked />
            <ProfileInput label={t("Date of birth")} id="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} type="date" icon={Calendar} locked />
            <ProfileInput label={t("Language")} id="language" value={formData.language} onChange={handleInputChange} icon={Languages}>
              <select id="language" name="language" value={formData.language || 'English'} onChange={handleInputChange} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full">
                <option value="English">{t('English')}</option>
                <option value="Tagalog">{t('Tagalog')}</option>
              </select>
            </ProfileInput>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <ProfileInput label={t("Website")} id="website" value={formData.website} onChange={handleInputChange} placeholder="Your website" locked />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <ProfileInput label={t("Role")} id="profile_role" value={formData.profile_role} onChange={handleInputChange} placeholder="Your role" locked />
            <ProfileInput label={t("Headline")} id="headline" value={formData.headline} onChange={handleInputChange} placeholder="Your headline" locked />
            <ProfileInput label={t("About")} id="about" value={formData.about} onChange={handleInputChange} type="textarea" placeholder="Interested in connecting or collaborating? Feel free to reach out!" locked />
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProfileInput label={t("Locale")} id="locale" value={formData.locale} onChange={handleInputChange} icon={Globe}>
              <select id="locale" name="locale" value={formData.locale || 'English (United States)'} onChange={handleInputChange} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full">
                  <option>English (United States)</option>
                  <option>Spanish (Spain)</option>
                  <option>French (France)</option>
              </select>
            </ProfileInput>
            <ProfileInput label={t("First day of week")} id="first_day_of_week" value={formData.first_day_of_week} onChange={handleInputChange} icon={Columns}>
              <select id="first_day_of_week" name="first_day_of_week" value={formData.first_day_of_week || 'Sunday'} onChange={handleInputChange} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full">
                  <option>Sunday</option>
                  <option>Monday</option>
              </select>
            </ProfileInput>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border w-full md:w-1/2">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6" />
          {t('Recent Activity')}
        </h2>
        
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {activityLogs.length > 0 ? (
            <div className="divide-y divide-border">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-accent/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                        {log.action}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('No recent activity found.')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={handleProfileSave} className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition">{t('Save Changes')}</button>
      </div>
    </div>
  );
}
