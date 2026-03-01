import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit')
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Audit Trails</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor system-wide activities and user actions for accountability.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                <th className="px-8 py-4">Timestamp</th>
                <th className="px-8 py-4">User</th>
                <th className="px-8 py-4">Action</th>
                <th className="px-8 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-muted-foreground">No audit logs found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="text-sm hover:bg-muted/50 transition-all">
                  <td className="px-8 py-6 text-muted-foreground font-mono text-xs">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground font-bold">{log.full_name || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-muted-foreground max-w-md leading-relaxed italic">
                    {log.details}
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
