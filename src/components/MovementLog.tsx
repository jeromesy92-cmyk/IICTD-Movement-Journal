import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar,
  X,
  ChevronDown,
  FileText,
  Navigation,
  Trash2,
  Eye,
  UserPlus,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { UserData } from '../App';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface Movement {
  id: number;
  staff_id: number;
  staff_name: string;
  district: string;
  division: string;
  area: string;
  branch: string;
  position: string;
  date: string;
  time_in: string;
  time_out: string;
  purpose: string;
  accomplishments: string;
  status: 'pending' | 'approved' | 'rejected' | 'acknowledged' | 'assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  supervisor_remarks: string;
  assigned_supervisor_name?: string;
  assigned_supervisor_id?: number;
  // New fields for detailed view
  start_location?: string;
  end_location?: string;
  notes?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  priority: 'Low' | 'Medium' | 'High';
  history?: {
    acknowledged_at?: string;
    approved_at?: string;
    rejected_at?: string;
  };
}

interface Supervisor {
  id: number;
  full_name: string;
  role: string;
}

import QRCode from 'react-qr-code';

export default function MovementLog({ user }: { user: UserData }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMovements, setSelectedMovements] = useState<number[]>([]);
  const [nextId, setNextId] = useState<number | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [expandedMovementId, setExpandedMovementId] = useState<number | null>(null); // State for expanded row
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  // Fix for default marker icon issue with Webpack
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
  
  const [filters, setFilters] = useState({
    date: '',
    time: '',
    division: '',
    district: '',
    area: '',
    branch: ''
  });

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time_in: '',
    time_out: '',
    division: '',
    district: '',
    area: '',
    branch: '',
    purpose: '',
    accomplishments: '',
    priority: 'Medium' // Default priority
  });

  useEffect(() => {
    fetchMovements();
    fetchSupervisors();
    const interval = setInterval(fetchMovements, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [user]);

  const fetchSupervisors = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        const sups = data.filter((u: any) => u.role === 'Senior Field Engineer');
        setSupervisors(sups);
      });
  };

  const fetchMovements = () => {
    // Original fetch for real data
    fetch(`/api/movements?staff_id=${user.id}&supervisor_id=${user.id}&role=${user.role}`)
      .then(res => res.json())
      .then(data => {
        // Add mock history for demonstration
        const dataWithHistory = data.map((m: Movement) => {
          if (m.status === 'approved' || m.status === 'acknowledged' || m.status === 'rejected') {
            return {
              ...m,
              history: {
                acknowledged_at: '2023-10-27T10:00:00Z',
                approved_at: m.status === 'approved' ? '2023-10-27T11:00:00Z' : undefined,
                rejected_at: m.status === 'rejected' ? '2023-10-27T11:00:00Z' : undefined,
              }
            };
          }
          return m;
        });
        setMovements(dataWithHistory);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching movements:', error);
        setLoading(false);
        setMovements([]); // Set to empty array on error
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, staff_id: user.id })
      });

      if (response.ok) {
        toast.success('Movement logged successfully');
        setShowForm(false);
        fetchMovements();
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          time_in: '',
          time_out: '',
          division: '',
          district: '',
          area: '',
          branch: '',
          purpose: '',
          accomplishments: '',
          priority: 'Medium'
        });
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to log movement');
      }
    } catch (error) {
      console.error('Error submitting movement:', error);
      toast.error('Connection error. Please try again.');
    }
  };

  const handleApprove = async (id: number, status: string, remarks: string) => {
    const response = await fetch(`/api/movements/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supervisor_id: user.id, status, remarks })
    });

    if (response.ok) {
      toast.success(`Movement ${status}`);
      fetchMovements();
    }
  };

  const handleAcknowledge = async (id: number) => {
    const response = await fetch(`/api/movements/${id}/acknowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      toast.success('Movement acknowledged');
      fetchMovements();
    }
  };

  const handleAssign = async () => {
    if (!selectedMovementId || !selectedSupervisorId) return;

    const response = await fetch(`/api/movements/${selectedMovementId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_supervisor_id: selectedSupervisorId })
    });

    if (response.ok) {
      toast.success('Movement assigned to supervisor');
      setShowAssignModal(false);
      setSelectedMovementId(null);
      setSelectedSupervisorId('');
      fetchMovements();
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const response = await fetch(`/api/movements/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      toast.success(`Movement status updated to ${status}`);
      fetchMovements();
    } else {
      toast.error('Failed to update movement status');
    }
  };

  const handleClaim = async (id: number) => {
    const response = await fetch(`/api/movements/${id}/claim`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supervisor_id: user.id })
    });

    if (response.ok) {
      toast.success('Movement claimed successfully');
      fetchMovements();
    } else {
      toast.error('Failed to claim movement');
    }
  };

  const handleDelete = async (id: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-slate-800">Delete this movement log?</p>
        <div className="flex gap-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const response = await fetch(`/api/movements/${id}`, { method: 'DELETE' });
              if (response.ok) {
                toast.success('Movement deleted successfully');
                fetchMovements();
              } else {
                toast.error('Failed to delete movement');
              }
            }}
            className="px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg font-medium hover:bg-rose-600 transition-colors"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(movements);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movements");
    XLSX.writeFile(wb, `IICTD_Movements_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleBulkAction = async (action: 'acknowledge' | 'delete') => {
    if (selectedMovements.length === 0) return;

    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedMovements.length} movements?`)) return;
      
      try {
        const response = await fetch('/api/movements/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedMovements })
        });
        
        if (response.ok) {
          toast.success(`${selectedMovements.length} movements deleted successfully`);
          setSelectedMovements([]);
          fetchMovements();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to delete movements');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    } else if (action === 'acknowledge') {
      try {
        const response = await fetch('/api/movements/bulk/acknowledge', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedMovements })
        });
        
        if (response.ok) {
          toast.success(`${selectedMovements.length} movements acknowledged successfully`);
          setSelectedMovements([]);
          fetchMovements();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to acknowledge movements');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedMovements.length === filteredMovements.length) {
      setSelectedMovements([]);
    } else {
      setSelectedMovements(filteredMovements.map(m => m.id));
    }
  };

  const toggleSelectMovement = (id: number) => {
    if (selectedMovements.includes(id)) {
      setSelectedMovements(selectedMovements.filter(movementId => movementId !== id));
    } else {
      setSelectedMovements([...selectedMovements, id]);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      const response = await fetch('/api/movements/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movements: json, staff_id: user.id })
      });

      if (response.ok) {
        toast.success('Movements imported successfully');
        fetchMovements();
      } else {
        toast.error('Failed to import movements');
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredMovements = movements.filter(m => {
    const matchesGlobalSearch = (m.division?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                                (Array.isArray(m.district) ? m.district.join(', ') : m.district || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (m.area?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                                (m.branch?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                                (m.staff_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                                (m.purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    
    const matchesDate = !filters.date || m.date === filters.date;
    const matchesTime = !filters.time || (m.time_in?.toLowerCase() || '').includes(filters.time.toLowerCase()) || (m.time_out?.toLowerCase() || '').includes(filters.time.toLowerCase());
    const matchesDivision = !filters.division || (m.division?.toLowerCase() || '').includes(filters.division.toLowerCase());
    const matchesDistrict = !filters.district || (Array.isArray(m.district) ? m.district.join(', ') : m.district || '').toLowerCase().includes(filters.district.toLowerCase());
    const matchesArea = !filters.area || (m.area?.toLowerCase() || '').includes(filters.area.toLowerCase());
    const matchesBranch = !filters.branch || (m.branch?.toLowerCase() || '').includes(filters.branch.toLowerCase());

    return matchesGlobalSearch && matchesStatus && matchesDate && matchesDivision && matchesDistrict && matchesArea && matchesBranch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Movement Journal</h1>
          <p className="text-slate-400 text-sm mt-1">Log and monitor daily field activities and travel details.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => document.getElementById('import-input')?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-all"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <input type="file" id="import-input" className="hidden" onChange={handleImport} accept=".xlsx, .xls, .csv" />
          {(user.role === 'Field Engineer' || user.role === 'Senior Field Engineer') && (
            <button 
              onClick={async () => {
                const now = new Date();
                const currentTime = format(now, 'HH:mm');
                setFormData(prev => ({
                  ...prev,
                  time_in: currentTime
                }));
                
                // Fetch next ID
                try {
                  const res = await fetch('/api/movements/next-id');
                  const data = await res.json();
                  setNextId(data.nextId);
                } catch (e) {
                  console.error('Failed to fetch next ID');
                }
                
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#001a33] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/[0.01] space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by Field Engineer, Purpose..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all border ${
                  showFilters ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Advanced Search'}
              </button>
              <div className="relative">
                <select 
                  className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 pr-10 text-sm text-blue-400 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer min-w-[140px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all" className="bg-[#001a33] text-blue-400">All Status</option>
                  <option value="pending" className="bg-[#001a33] text-blue-400">Pending</option>
                  <option value="In Progress" className="bg-[#001a33] text-blue-400">In Progress</option>
                  <option value="Completed" className="bg-[#001a33] text-blue-400">Completed</option>
                  <option value="Cancelled" className="bg-[#001a33] text-blue-400">Cancelled</option>
                  <option value="approved" className="bg-[#001a33] text-blue-400">Approved</option>
                  <option value="rejected" className="bg-[#001a33] text-blue-400">Rejected</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      value={filters.date}
                      onChange={(e) => setFilters({...filters, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 08:00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      value={filters.time}
                      onChange={(e) => setFilters({...filters, time: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Division</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-blue-400 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                      value={filters.division}
                      onChange={(e) => setFilters({...filters, division: e.target.value})}
                    >
                      <option value="" className="bg-[#001a33] text-slate-400">All Divisions</option>
                      {Array.from({ length: 8 }, (_, i) => `Division ${i + 1}`).map(div => (
                        <option key={div} value={div} className="bg-[#001a33] text-blue-400">{div}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">District</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-blue-400 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                      value={filters.district}
                      onChange={(e) => setFilters({...filters, district: e.target.value})}
                    >
                      <option value="" className="bg-[#001a33] text-slate-400">All Districts</option>
                      {Array.from({ length: 33 }, (_, i) => `District ${i + 1}`).map(dist => (
                        <option key={dist} value={dist} className="bg-[#001a33] text-blue-400">{dist}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Area</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-blue-400 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                      value={filters.area}
                      onChange={(e) => setFilters({...filters, area: e.target.value})}
                    >
                      <option value="" className="bg-[#001a33] text-slate-400">All Areas</option>
                      {Array.from({ length: 165 }, (_, i) => `Area ${i + 1}`).map(area => (
                        <option key={area} value={area} className="bg-[#001a33] text-blue-400">{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Branch</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Filter branch..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        value={filters.branch}
                        onChange={(e) => setFilters({...filters, branch: e.target.value})}
                      />
                      <button 
                        onClick={() => {
                          setFilters({ date: '', time: '', division: '', district: '', area: '', branch: '' });
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all"
                        title="Clear All Filters"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="overflow-x-auto">
          {selectedMovements.length > 0 && (
            <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-400">
                {selectedMovements.length} movement{selectedMovements.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {(user.role === 'Administrator' || user.role === 'System Administrator' || user.role === 'Senior Field Engineer') && (
                  <button 
                    onClick={() => handleBulkAction('acknowledge')}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {(user.role === 'Administrator' || user.role === 'System Administrator') && (
                  <button 
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-5 w-12">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filteredMovements.length > 0 && selectedMovements.length === filteredMovements.length}
                      onChange={toggleSelectAll}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:bg-blue-600 checked:border-blue-600"
                    />
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                  </div>
                </th>
                <th className="px-6 py-5 w-24 text-center border-r border-white/5">JO</th>
                <th className="px-6 py-5 min-w-[200px]">Field Engineer</th>
                <th className="px-6 py-5 min-w-[150px]">Date & Time</th>
                <th className="px-6 py-5 min-w-[120px]">Division</th>
                <th className="px-6 py-5 min-w-[120px]">District</th>
                <th className="px-6 py-5 min-w-[120px]">Area</th>
                <th className="px-6 py-5 min-w-[120px]">Branch</th>
                <th className="px-6 py-5 min-w-[250px]">Purpose</th>
                <th className="px-6 py-5 w-24 text-center">Priority</th>
                <th className="px-6 py-5 w-32 text-center">Status</th>
                <th className="px-6 py-5 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={11} className="px-6 py-8 text-center text-slate-500">Loading movements...</td></tr>
              ) : filteredMovements.length === 0 ? (
                <tr><td colSpan={11} className="px-6 py-8 text-center text-slate-500">No movements found.</td></tr>
              ) : filteredMovements.map((m) => (
                <React.Fragment key={m.id}>
                  <tr className={`hover:bg-white/[0.02] transition-all group border-b border-white/[0.02] last:border-0 ${selectedMovements.includes(m.id) ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-6 py-6">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedMovements.includes(m.id)}
                        onChange={() => toggleSelectMovement(m.id)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:bg-blue-600 checked:border-blue-600"
                      />
                      <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center border-r border-white/5">
                    <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">JO-{m.id.toString().padStart(4, '0')}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shadow-inner">
                        {m.staff_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{m.staff_name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium mt-0.5">{m.position} • {m.district}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {format(new Date(m.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-white/5 w-fit px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        {m.time_in} - {m.time_out}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs text-slate-300">{m.division || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs text-slate-300">{m.district || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs text-slate-300">{m.area || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-xs text-slate-300">{m.branch || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-[11px] text-slate-500 line-clamp-2 max-w-[320px] leading-relaxed italic">"{m.purpose}"</p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      m.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      m.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {m.priority}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      m.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      m.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      m.status === 'acknowledged' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      m.status === 'assigned' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      m.status === 'In Progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                      m.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      m.status === 'Cancelled' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {m.status === 'pending' ? <Clock className="w-3 h-3" /> : 
                       m.status === 'rejected' ? <X className="w-3 h-3" /> : 
                       m.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> :
                       <CheckCircle2 className="w-3 h-3" />}
                      {m.status}
                    </span>
                    {m.assigned_supervisor_name && (
                      <p className="text-[9px] text-slate-500 mt-1">Assigned to: {m.assigned_supervisor_name}</p>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button 
                      onClick={() => setExpandedMovementId(expandedMovementId === m.id ? null : m.id)}
                      className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Toggle Details"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedMovementId === m.id ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex items-center justify-end gap-2">
                      {/* Admin Actions: Acknowledge & Assign */}
                      {(user.role === 'Administrator' || user.role === 'System Administrator') && (m.status === 'pending' || m.status === 'acknowledged') && (
                        <button 
                          onClick={() => handleAcknowledge(m.id)}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                          title="Acknowledge"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}

                      {(user.role === 'Administrator' || user.role === 'System Administrator') && (m.status === 'pending' || m.status === 'acknowledged') && (
                        <button 
                          onClick={() => {
                            setSelectedMovementId(m.id);
                            setShowAssignModal(true);
                          }}
                          className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all"
                          title="Assign to Supervisor"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                      )}

                      {/* Supervisor Actions: Approve & Reject - ONLY for the assigned supervisor */}
                      {(user.role === 'Senior Field Engineer') && m.assigned_supervisor_id === user.id && (m.status === 'pending' || m.status === 'acknowledged' || m.status === 'assigned') && (
                        <>
                          <button 
                            onClick={() => handleApprove(m.id, 'approved', 'Approved by supervisor')}
                            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleApprove(m.id, 'rejected', 'Rejected by supervisor')}
                            className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-all"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Supervisor Action: Claim - For unassigned movements in their district */}
                      {(user.role === 'Senior Field Engineer') && !m.assigned_supervisor_id && (
                        <button 
                          onClick={() => handleClaim(m.id)}
                          className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all"
                          title="Claim / Assign to Me"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}

                      {(user.role === 'Senior Field Engineer' || user.role === 'System Administrator' || user.role === 'Administrator') && (
                        <div className="relative">
                          <button 
                            onClick={() => setOpenActionMenu(openActionMenu === m.id ? null : m.id)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                          {openActionMenu === m.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 bottom-full mb-2 w-48 bg-[#002a4f] border border-white/10 rounded-xl shadow-lg z-20 p-2"
                              onMouseLeave={() => setOpenActionMenu(null)}
                            >
                              <div className="flex flex-col gap-1">
                                <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Change Status</p>
                                <button onClick={() => { handleStatusChange(m.id, 'In Progress'); setOpenActionMenu(null); }} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2"><Clock className="w-3 h-3"/> In Progress</button>
                                <button onClick={() => { handleStatusChange(m.id, 'Completed'); setOpenActionMenu(null); }} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> Completed</button>
                                <button onClick={() => { handleStatusChange(m.id, 'Cancelled'); setOpenActionMenu(null); }} className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2"><X className="w-3 h-3"/> Cancelled</button>
                              </div>
                            </motion.div>
                          )}
                          </AnimatePresence>
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedMovement(m)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Delete button removed for Field Engineer, only allowed for Admin */}
                      {(user.role === 'Administrator' || user.role === 'System Administrator') && (
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedMovementId === m.id && (
                  <tr className="bg-white/[0.01]">
                    <td colSpan={11} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
                        <div className="md:col-span-2 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <p className="font-bold text-white mb-2">Purpose:</p>
                                  <p className="text-slate-400 italic">{m.purpose || 'N/A'}</p>
                              </div>
                              <div>
                                  <p className="font-bold text-white mb-2">Accomplishments:</p>
                                  <p className="text-slate-400 italic">{m.accomplishments || 'N/A'}</p>
                              </div>
                          </div>
                          {m.supervisor_remarks && (
                              <div>
                              <p className="font-bold text-white mb-2">Supervisor Remarks:</p>
                              <p className="text-slate-400 italic">{m.supervisor_remarks}</p>
                              </div>
                          )}
                          {(m.history && (m.status === 'acknowledged' || m.status === 'approved' || m.status === 'rejected')) && (
                            <div>
                              <p className="font-bold text-white mb-2">History:</p>
                              <div className="text-slate-400 text-xs space-y-1">
                                {m.history.acknowledged_at && <p><span className="font-semibold text-slate-300">Acknowledged:</span> {format(new Date(m.history.acknowledged_at), 'MMM dd, yyyy - HH:mm')}</p>}
                                {m.history.approved_at && <p><span className="font-semibold text-slate-300">Approved:</span> {format(new Date(m.history.approved_at), 'MMM dd, yyyy - HH:mm')}</p>}
                                {m.history.rejected_at && <p><span className="font-semibold text-slate-300">Rejected:</span> {format(new Date(m.history.rejected_at), 'MMM dd, yyyy - HH:mm')}</p>}
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {m.assigned_supervisor_name && (
                                  <div>
                                  <p className="font-bold text-white mb-2">Assigned Supervisor:</p>
                                  <p className="text-slate-400">{m.assigned_supervisor_name}</p>
                                  </div>
                              )}
                              {m.start_location && (
                                  <div>
                                  <p className="font-bold text-white mb-2">Start Location:</p>
                                  <p className="text-slate-400">{m.start_location}</p>
                                  </div>
                              )}
                              {m.end_location && (
                                  <div>
                                  <p className="font-bold text-white mb-2">End Location:</p>
                                  <p className="text-slate-400">{m.end_location}</p>
                                  </div>
                              )}
                          </div>
                          {m.notes && (
                              <div>
                              <p className="font-bold text-white mb-2">Notes:</p>
                              <p className="text-slate-400 italic">{m.notes}</p>
                              </div>
                          )}
                        </div>
                        <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 min-h-[250px]">
                          {m.start_lat && m.start_lng && m.end_lat && m.end_lng ? (
                            <MapContainer 
                              center={[(m.start_lat + m.end_lat) / 2, (m.start_lng + m.end_lng) / 2]} 
                              zoom={10} 
                              className="h-full w-full"
                              scrollWheelZoom={false}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                              />
                              <Marker position={[m.start_lat, m.start_lng]}>
                                <Popup>Start: {m.start_location || 'N/A'}</Popup>
                              </Marker>
                              <Marker position={[m.end_lat, m.end_lng]}>
                                <Popup>End: {m.end_location || 'N/A'}</Popup>
                              </Marker>
                            </MapContainer>
                          ) : (
                            <div className="h-full w-full bg-white/5 flex items-center justify-center text-slate-500 text-xs">
                              Map data not available
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#001a33] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Assign Supervisor</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Supervisor</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  >
                    <option value="" className="bg-[#001a33]">Select Supervisor</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#001a33]">{s.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-slate-400 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAssign}
                    disabled={!selectedSupervisorId}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#001a33] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                <h2 className="text-xl font-bold text-white">Log New Movement</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">JO Number</label>
                    <input 
                      type="text" 
                      disabled
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-slate-400 font-mono cursor-not-allowed"
                      value={nextId ? `JO-${nextId.toString().padStart(4, '0')}` : 'Loading...'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time In</label>
                    <input 
                      type="time" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={formData.time_in || ''}
                      onChange={(e) => setFormData({...formData, time_in: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Out</label>
                    <input 
                      type="time" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={formData.time_out || ''}
                      onChange={(e) => setFormData({...formData, time_out: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="priority" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="High" className="bg-[#001a33] text-rose-400">High</option>
                      <option value="Medium" className="bg-[#001a33] text-amber-400">Medium</option>
                      <option value="Low" className="bg-[#001a33] text-blue-400">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Division</label>
                    <select 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-blue-400 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      value={formData.division || ''}
                      onChange={(e) => setFormData({...formData, division: e.target.value})}
                    >
                      <option value="" disabled className="bg-[#001a33] text-slate-400">Select Division</option>
                      {Array.from({ length: 8 }, (_, i) => `Division ${i + 1}`).map(div => (
                        <option key={div} value={div} className="bg-[#001a33] text-blue-400">{div}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">District</label>
                    <select 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-blue-400 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      value={formData.district || ''}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                    >
                      <option value="" disabled className="bg-[#001a33] text-slate-400">Select District</option>
                      {Array.from({ length: 33 }, (_, i) => `District ${i + 1}`).map(dist => (
                        <option key={dist} value={dist} className="bg-[#001a33] text-blue-400">{dist}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Area</label>
                    <select 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-blue-400 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      value={formData.area || ''}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                    >
                      <option value="" disabled className="bg-[#001a33] text-slate-400">Select Area</option>
                      {Array.from({ length: 165 }, (_, i) => `Area ${i + 1}`).map(area => (
                        <option key={area} value={area} className="bg-[#001a33] text-blue-400">{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Branch</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Main Branch"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                      value={formData.branch || ''}
                      onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Purpose of Visit</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="Brief description of the visit objective..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                    value={formData.purpose || ''}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Work Accomplishments</label>
                  <textarea 
                    rows={3}
                    placeholder="Detail what was achieved during the visit..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                    value={formData.accomplishments || ''}
                    onChange={(e) => setFormData({...formData, accomplishments: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-medium text-slate-400 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMovement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMovement(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#001a33] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Movement Details</h2>
                  <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">JO-{selectedMovement.id.toString().padStart(4, '0')}</span>
                </div>
                <button type="button" onClick={() => setSelectedMovement(null)} className="text-slate-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 flex items-center justify-center text-blue-400 font-bold text-lg shadow-inner">
                      {selectedMovement.staff_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{selectedMovement.staff_name}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mt-1">{selectedMovement.position} • {selectedMovement.district}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    selectedMovement.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    selectedMovement.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedMovement.status === 'pending' ? <Clock className="w-3 h-3" /> : selectedMovement.status === 'rejected' ? <X className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {selectedMovement.status}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date</p>
                    <div className="flex items-center gap-2 text-sm text-white font-medium">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      {format(new Date(selectedMovement.date), 'MMMM dd, yyyy')}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time</p>
                    <div className="flex items-center gap-2 text-sm text-white font-medium">
                      <Clock className="w-4 h-4 text-blue-400" />
                      {selectedMovement.time_in} - {selectedMovement.time_out || 'Ongoing'}
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Division</p>
                      <p className="text-sm text-white">{selectedMovement.division || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">District</p>
                      <p className="text-sm text-white">{selectedMovement.district || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Area</p>
                      <p className="text-sm text-white">{selectedMovement.area || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Branch</p>
                      <p className="text-sm text-white">{selectedMovement.branch || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Purpose & Accomplishments */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Navigation className="w-4 h-4" /> Purpose of Visit
                    </h3>
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedMovement.purpose || 'No purpose provided.'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Work Accomplishments
                    </h3>
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedMovement.accomplishments || 'No accomplishments recorded.'}</p>
                    </div>
                  </div>
                </div>

                {/* Supervisor Remarks if any */}
                {selectedMovement.supervisor_remarks && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Supervisor Remarks</h3>
                    <div className={`p-4 rounded-xl border ${
                      selectedMovement.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-200' :
                      selectedMovement.status === 'rejected' ? 'bg-rose-500/5 border-rose-500/10 text-rose-200' :
                      'bg-white/[0.02] border-white/5 text-slate-300'
                    }`}>
                      <p className="text-sm leading-relaxed italic">"{selectedMovement.supervisor_remarks}"</p>
                    </div>
                  </div>
                )}

                {/* History */}
                {(selectedMovement.history && (selectedMovement.status === 'acknowledged' || selectedMovement.status === 'approved' || selectedMovement.status === 'rejected')) && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> History
                    </h3>
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-2">
                      {selectedMovement.history.acknowledged_at && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Acknowledged</span>
                          <span className="font-medium text-white">{format(new Date(selectedMovement.history.acknowledged_at), 'MMM dd, yyyy - HH:mm')}</span>
                        </div>
                      )}
                      {selectedMovement.history.approved_at && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Approved</span>
                          <span className="font-medium text-white">{format(new Date(selectedMovement.history.approved_at), 'MMM dd, yyyy - HH:mm')}</span>
                        </div>
                      )}
                      {selectedMovement.history.rejected_at && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Rejected</span>
                          <span className="font-medium text-white">{format(new Date(selectedMovement.history.rejected_at), 'MMM dd, yyyy - HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Verification QR */}
                <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] rounded-2xl border border-white/5 mt-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Scan for Verification</p>
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    <QRCode 
                      value={JSON.stringify({
                        id: selectedMovement.id,
                        staff: selectedMovement.staff_name,
                        date: selectedMovement.date,
                        status: selectedMovement.status
                      })} 
                      size={120} 
                      level="M"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 font-mono">ID: {selectedMovement.id} • {format(new Date(), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
