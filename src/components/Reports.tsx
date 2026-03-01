import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  PieChart as PieChartIcon,
  TrendingUp,
  MapPin,
  Users,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { UserData } from '../App';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';

export default function Reports({ user }: { user: UserData }) {
  const [stats, setStats] = useState({
    totalMovements: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    completedMovements: 0
  });
  const [movementsByDivision, setMovementsByDivision] = useState([]);
  const [movementsByDistrict, setMovementsByDistrict] = useState([]);
  const [movementsByArea, setMovementsByArea] = useState([]);
  const [movementsOverTime, setMovementsOverTime] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('daily');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, divisionRes, districtRes, areaRes, timeRes, usersRes, movementsRes] = await Promise.all([
        fetch('/api/reports/stats'),
        fetch('/api/reports/by-division'),
        fetch('/api/reports/by-district'),
        fetch('/api/reports/by-area'),
        fetch(`/api/reports/over-time?range=${dateRange}`),
        fetch('/api/reports/top-users'),
        fetch(`/api/movements?staff_id=${user.id}&supervisor_id=${user.id}&role=${user.role}&limit=10`)
      ]);

      const statsData = await statsRes.json();
      const divisionData = await divisionRes.json();
      const districtData = await districtRes.json();
      const areaData = await areaRes.json();
      const timeData = await timeRes.json();
      const usersData = await usersRes.json();
      const movementsData = await movementsRes.json();

      setStats(statsData);
      setMovementsByDivision(divisionData);
      setMovementsByDistrict(districtData);
      setMovementsByArea(areaData);
      setMovementsOverTime(timeData);
      setTopUsers(usersData);
      setRecentMovements(movementsData.slice(0, 10)); // Just in case
    } catch (error) {
      console.error("Failed to fetch report data", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const ws = XLSX.utils.json_to_sheet(recentMovements);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movement Report");
    XLSX.writeFile(wb, `IICTD_Report_${dateRange}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive insights into field operations and performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="bg-card border border-border rounded-xl py-2 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="daily">Daily Trend</option>
            <option value="weekly">Weekly Trend</option>
            <option value="monthly">Monthly Trend</option>
          </select>
          <button 
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Movements" 
          value={stats.totalMovements} 
          icon={<Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />} 
          trend="+12% vs last month"
          color="blue"
        />
        <StatCard 
          title="Active Field Staff" 
          value={stats.activeUsers} 
          icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />} 
          trend="Stable"
          color="emerald"
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />} 
          trend="Needs attention"
          color="amber"
        />
        <StatCard 
          title="Completed" 
          value={stats.completedMovements} 
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />} 
          trend="98% completion rate"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* Side Chart: By Division */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            By Division
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={movementsByDivision}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="division"
                >
                  {movementsByDivision.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            By District
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={movementsByDistrict}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="district"
                >
                  {movementsByDistrict.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            By Area
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={movementsByArea}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="area"
                >
                  {movementsByArea.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Users */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Top Active Field Engineers
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={topUsers} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis dataKey="full_name" type="category" stroke="var(--muted-foreground)" fontSize={10} width={100} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
          <div className="p-8 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Recent Activity Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-6 py-4">Field Engineer</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentMovements.map((m) => (
                  <tr key={m.id} className="text-sm hover:bg-accent transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{m.staff_name}</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{m.purpose}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{format(new Date(m.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                        m.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    purple: 'bg-purple-500/10',
  };

  const bgColorClass = colorMap[color] || 'bg-muted/50';

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${bgColorClass} rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 ${bgColorClass} rounded-xl`}>
            {icon}
          </div>
          <span className={`text-xs font-medium ${
            trend.includes('+') ? 'text-emerald-500' : 'text-muted-foreground'
          }`}>
            {trend}
          </span>
        </div>
        <h3 className="text-3xl font-black text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
      </div>
    </div>
  );
}
