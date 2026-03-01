import React from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  Shield, 
  Calendar, 
  Edit2, 
  Camera,
  Settings,
  Lock,
  Bell,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../App';

export default function Profile({ user }: { user: UserData }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-900 to-cyan-900 rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#000d1a] to-transparent" />
        </div>
        
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-card border-4 border-background flex items-center justify-center text-4xl font-black text-primary shadow-2xl">
              {user.full_name?.charAt(0) || '?'}
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-primary rounded-xl text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-all">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="pb-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">{user.full_name}</h1>
            <p className="text-white/80 font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {user.role}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
              <button className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                <Edit2 className="w-3 h-3" />
                Edit Details
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Username</p>
                <p className="text-foreground font-medium">@{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Designation</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-foreground font-medium capitalize">{user.role}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Assigned District</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="text-foreground font-medium">{user.district || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Supervisor</p>
                <p className="text-foreground font-medium">{user.supervisor_name || 'None'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-8">Security & Access</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Password</p>
                    <p className="text-xs text-muted-foreground">Last changed 3 months ago</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-bold text-foreground transition-all">
                  Change
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-secondary text-secondary-foreground rounded-lg">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">Email and system alerts</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white shadow-sm rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h4 className="text-foreground font-bold mb-1">Member Since</h4>
            <p className="text-muted-foreground text-sm">January 2024</p>
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-black text-foreground">124</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Logs</p>
              </div>
              <div>
                <p className="text-lg font-black text-foreground">98%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Approval</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Recent Login History
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="text-muted-foreground font-medium">Windows • Chrome</p>
                    <p className="text-muted-foreground">192.168.1.45</p>
                  </div>
                  <p className="text-muted-foreground font-mono">2h ago</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
