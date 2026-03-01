import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { UserData } from '../App';
import { Logo } from './Logo';

export default function Dashboard({ user }: { user: UserData }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('daily');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?timeframe=${timeframe}&user_id=${user.id}&role=${user.role}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, [timeframe, user.id, user.role]);

  if (loading) return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;

  const divisionColors: Record<string, string> = {
    'Division 1': '#3b82f6',
    'Division 2': '#f87171',
    'Division 3': '#4ade80',
    'Division 4': '#fbbf24',
    'Division 5': '#8b5cf6',
    'Division 6': '#ec4899',
    'Division 7': '#06b6d4',
    'Division 8': '#f97316',
  };

  const projectData = stats.divisionStats.map((stat: any) => ({
    name: stat.division,
    value: stat.count,
    color: divisionColors[stat.division] || `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  // If all values are 0, show placeholder data for visualization
  const hasData = projectData.length > 0 && projectData.some((d: any) => d.value > 0);
  const displayData = hasData ? projectData : [
    { name: 'No Data', value: 1, color: '#64748b' }
  ];

  const cards = [
    { 
      label: t('Total Movements'), 
      value: stats.totalMovements, 
      icon: Activity, 
      color: 'blue',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: t('Pending Approvals'), 
      value: stats.pendingApprovals, 
      icon: Clock, 
      color: 'amber',
      trend: '-2%',
      trendUp: false
    },
    { 
      label: t('Un-assigned entry'), 
      value: stats.unassignedEntries, 
      icon: AlertCircle, 
      color: 'rose',
      trend: stats.unassignedEntries > 0 ? 'Action Required' : 'Clear',
      trendUp: stats.unassignedEntries > 0
    },
    { 
      label: t('System Users'), 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'indigo',
      trend: 'Total',
      trendUp: true
    },
  ];

  const colorMap: Record<string, { bg: string, text: string, iconBg: string, iconText: string }> = {
    blue: { bg: 'bg-blue-500/5', text: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-500/10', iconText: 'text-blue-600 dark:text-blue-400' },
    amber: { bg: 'bg-amber-500/5', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500/10', iconText: 'text-amber-600 dark:text-amber-400' },
    rose: { bg: 'bg-rose-500/5', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-500/10', iconText: 'text-rose-600 dark:text-rose-400' },
    indigo: { bg: 'bg-indigo-500/5', text: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-500/10', iconText: 'text-indigo-600 dark:text-indigo-400' },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=0284c7&color=fff&size=128`}
              alt="Avatar"
              className="w-20 h-20 rounded-3xl object-cover border-4 border-primary/20 shadow-2xl"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('Welcome back')}, {user.full_name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t('Real-time overview of IICTD staff movements and field activities.')}
            </p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 relative">
          <Logo className="w-24 h-24 opacity-10 absolute -top-4 -right-4 pointer-events-none" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('Current Session')}</p>
          <p className="text-xl font-black text-foreground">{format(new Date(), 'HH:mm')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const colors = colorMap[card.color] || colorMap['blue'];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
              className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${colors.bg} blur-3xl -mr-8 -mt-8 group-hover:bg-primary/5 transition-all`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors.iconBg} ${colors.iconText}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${card.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {card.trend}
                  {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-foreground/80 text-sm font-medium">{card.label}</h3>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-foreground">{t('Movement Status Monitoring')}</h3>
              <div className="flex items-center gap-4 text-xs text-foreground">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Approved</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Pending</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Rejected</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart 
                  data={[
                    { name: 'Approved', count: stats.approvedMovements, color: '#10b981' },
                    { name: 'Pending', count: stats.pendingApprovals, color: '#f59e0b' },
                    { name: 'Rejected', count: stats.rejectedMovements, color: '#f43f5e' }
                  ]}
                  layout="vertical"
                  margin={{ left: 20, right: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={40}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#f43f5e" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{t('Movement Trends')}</h3>
                <p className="text-xs text-foreground/80 mt-1">Activity volume over {timeframe === 'daily' ? 'the last 7 days' : timeframe === 'month' ? 'the last 12 months' : 'the last 5 years'}</p>
              </div>
              <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
                <button 
                  onClick={() => setTimeframe('daily')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === 'daily' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === 'month' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Months
                </button>
                <button 
                  onClick={() => setTimeframe('year')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === 'year' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Year
                </button>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={stats.movementTrends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--foreground))" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value === 'No Data') return value;
                      try {
                        if (timeframe === 'month') {
                          const [year, month] = value.split('-');
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return `${monthNames[parseInt(month) - 1]} ${year}`;
                        }
                        if (timeframe === 'daily') {
                          return format(new Date(value), 'MMM dd');
                        }
                        if (timeframe === 'year') {
                          return value;
                        }
                      } catch (e) {
                        return value;
                      }
                      return value;
                    }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    labelFormatter={(value) => {
                      if (value === 'No Data') return value;
                      try {
                        if (timeframe === 'month') {
                          const [year, month] = value.split('-');
                          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                          return `${monthNames[parseInt(month) - 1]} ${year}`;
                        }
                        if (timeframe === 'daily') {
                          return format(new Date(value), 'MMMM dd, yyyy');
                        }
                        if (timeframe === 'year') {
                          return `Year ${value}`;
                        }
                      } catch (e) {}
                      return value;
                    }}
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#06b6d4" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-6">{t('Division Distribution')}</h3>
            <div className="h-[280px] w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={displayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      outerRadius,
                      value
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 20;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs font-bold"
                        >
                          {value}
                        </text>
                      );
                    }}
                    labelLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                  >
                    {displayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-8">
              {displayData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-4 rounded-md border border-border" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <span className="text-[11px] text-foreground font-medium truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-foreground mb-6">{t('Recent Activity')}</h3>
            <div className="space-y-6">
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity: any, i: number) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    {i !== stats.recentActivity.length - 1 && <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />}
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10 ${
                      activity.action.includes('APPROVED') ? 'bg-primary/20 text-primary' : 
                      activity.action.includes('LOGGED') ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-muted/20 text-muted-foreground'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground font-medium">
                        {t(activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()))}
                      </p>
                      <p className="text-xs text-foreground/70">
                        {activity.details}
                      </p>
                      <p className="text-[10px] text-foreground/50 font-mono uppercase">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('No recent activity')}</p>
              )}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-all">
              {t('View All Activity')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
