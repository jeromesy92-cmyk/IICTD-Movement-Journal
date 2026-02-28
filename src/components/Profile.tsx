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
            <div className="w-32 h-32 rounded-3xl bg-[#001a33] border-4 border-[#000d1a] flex items-center justify-center text-4xl font-black text-blue-400 shadow-2xl">
              {user.full_name?.charAt(0) || '?'}
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-xl text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="pb-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">{user.full_name}</h1>
            <p className="text-blue-400 font-medium flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {user.role}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-[#001a33] border border-white/5 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white">Personal Information</h3>
              <button className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                <Edit2 className="w-3 h-3" />
                Edit Details
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Username</p>
                <p className="text-white font-medium">@{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Designation</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <p className="text-white font-medium capitalize">{user.role}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Assigned District</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <p className="text-white font-medium">{user.district || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Supervisor</p>
                <p className="text-white font-medium">{user.supervisor_name || 'None'}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#001a33] border border-white/5 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-8">Security & Access</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Password</p>
                    <p className="text-xs text-slate-500">Last changed 3 months ago</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all">
                  Change
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Notifications</p>
                    <p className="text-xs text-slate-500">Email and system alerts</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#001a33] border border-white/5 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-blue-400" />
            </div>
            <h4 className="text-white font-bold mb-1">Member Since</h4>
            <p className="text-slate-500 text-sm">January 2024</p>
            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-black text-white">124</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Logs</p>
              </div>
              <div>
                <p className="text-lg font-black text-white">98%</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Approval</p>
              </div>
            </div>
          </div>

          <div className="bg-[#001a33] border border-white/5 rounded-2xl p-8">
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Recent Login History
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="text-slate-300 font-medium">Windows • Chrome</p>
                    <p className="text-slate-500">192.168.1.45</p>
                  </div>
                  <p className="text-slate-600 font-mono">2h ago</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
