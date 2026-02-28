import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Key,
  MapPin,
  Briefcase,
  X,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { UserData } from '../App';
import QRCode from 'react-qr-code';

const ALL_DISTRICTS = Array.from({ length: 33 }, (_, i) => `District ${i + 1}`);

const UserSkeleton = () => (
  <tr className="animate-pulse border-b border-white/[0.02]">
    <td className="px-6 py-4"><div className="w-4 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/5 rounded-xl" />
        <div className="space-y-2">
          <div className="w-24 h-4 bg-white/5 rounded" />
          <div className="w-16 h-3 bg-white/5 rounded" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-16 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-24 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-16 h-6 bg-white/5 rounded-lg" /></td>
    <td className="px-6 py-4"><div className="w-24 h-4 bg-white/5 rounded" /></td>
    <td className="px-6 py-4"><div className="w-24 h-8 bg-white/5 rounded-lg ml-auto" /></td>
  </tr>
);

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <tr>
    <td colSpan={11} className="px-6 py-20 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center max-w-xs mx-auto"
      >
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
          <Search className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No users found</h3>
        <p className="text-sm text-slate-500 mb-6">We couldn't find any users matching your current filters or search criteria.</p>
        <button 
          onClick={onReset}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all"
        >
          Clear all filters
        </button>
      </motion.div>
    </td>
  </tr>
);

export default function UserManagement({ user }: { user: UserData }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [baseOfficeFilter, setBaseOfficeFilter] = useState('All');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkActionToConfirm, setBulkActionToConfirm] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    id_number: '',
    username: '',
    password: '',
    full_name: '',
    division: '',
    district: [] as string[], // Changed to array
    base_office: '',
    role: 'Field Engineer' as any,
    supervisor_id: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return;

    // Prevent non-administrators from modifying administrators
    const usersToModify = users.filter(u => selectedUsers.includes(u.id));
    const hasAdmin = usersToModify.some(u => u.role === 'Administrator');
    if (hasAdmin && user.role !== 'Administrator') {
      toast.error('You do not have permission to modify Administrator accounts.');
      return;
    }

    if (action === 'delete') {
      setBulkActionToConfirm('delete');
      setShowBulkConfirmModal(true);
    } else {
      executeBulkAction(action);
    }
  };

  const executeBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    setShowBulkConfirmModal(false);
    if (action === 'delete') {
      try {
        const response = await fetch('/api/users/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedUsers })
        });
        
        if (response.ok) {
          toast.success(`${selectedUsers.length} users deleted successfully`);
          setSelectedUsers([]);
          fetchUsers();
        } else {
          const data = await response.json();
          console.error('Bulk delete server response:', data);
          toast.error(data.message || 'Failed to delete users');
        }
      } catch (error) {
        console.error('Bulk delete connection error:', error);
        toast.error('Connection error');
      }
    } else {
      const status = action === 'activate' ? 'active' : 'inactive';
      try {
        const response = await fetch('/api/users/bulk/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedUsers, status })
        });
        
        if (response.ok) {
          toast.success(`${selectedUsers.length} users ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
          setSelectedUsers([]);
          fetchUsers();
        } else {
          const data = await response.json();
          toast.error(data.message || `Failed to ${action} users`);
        }
      } catch (error) {
        toast.error('Connection error');
      }
    }
    setBulkActionToConfirm(null);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      // Don't select administrators if the current user is not an administrator
      const selectableUsers = user.role === 'Administrator' 
        ? filteredUsers 
        : filteredUsers.filter(u => u.role !== 'Administrator');
      setSelectedUsers(selectableUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: number, role: string) => {
    if (role === 'Administrator' && user.role !== 'Administrator') {
      toast.error('You do not have permission to modify Administrator accounts.');
      return;
    }
    
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      id_number: user.id_number || '',
      username: user.username || '',
      password: '', // Leave empty unless they want to change it
      full_name: user.full_name || '',
      division: user.division || 'N/A',
      district: Array.isArray(user.district) ? user.district : (user.district ? [user.district] : []), // Ensure district is an array
      base_office: user.base_office || 'N/A',
      role: user.role || 'Field Engineer',
      supervisor_id: user.supervisor_id?.toString() || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setShowForm(false);
    setFormData({
      id_number: '',
      username: '',
      password: '',
      full_name: '',
      division: 'N/A',
      district: [], // Changed to empty array
      base_office: 'N/A',
      role: 'Field Engineer',
      supervisor_id: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form Validation
    if (!formData.full_name.trim()) {
      toast.error('Full Name is required');
      return;
    }
    if (!formData.id_number.trim()) {
      toast.error('ID Number is required');
      return;
    }
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      toast.error('Initial Password is required for new users');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (!formData.role) {
      toast.error('Designation (Role) is required');
      return;
    }
    if (!formData.base_office.trim()) {
      toast.error('Base Office is required');
      return;
    }
    if (!formData.division.trim()) {
      toast.error('Division is required');
      return;
    }
    if (formData.role === 'Senior Field Engineer' && formData.district.length === 0) {
      toast.error('Please select at least one district for Senior Field Engineer');
      return;
    }
    if (formData.role === 'Field Engineer' && !formData.supervisor_id) {
      toast.error('Please assign a supervisor for Field Engineer');
      return;
    }

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    
    // If editing and password is empty, don't send it
    const payload = { ...formData };
    if (editingUser && !payload.password) {
      delete (payload as any).password;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const newUser = await response.json();
      toast.success(editingUser ? 'User updated successfully' : 'User created successfully');
      resetForm();
      fetchUsers();
      if (!editingUser) {
        handleDelete(newUser.id, true);
      }
    } else {
      const data = await response.json();
      toast.error(data.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      toast.success(`User ${newStatus}`);
      fetchUsers();
    }
  };

  const handleDelete = (id: number, isNew?: boolean) => {
    if (isNew) {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-800">A new user has been added. Do you want to keep this user?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              Keep
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                const promise = fetch(`/api/users/${id}`, {
                  method: 'DELETE'
                }).then(async (res) => {
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Failed to delete user');
                  }
                  return res;
                });

                toast.promise(promise, {
                  loading: 'Removing user...',
                  success: () => {
                    fetchUsers();
                    return 'User removed successfully';
                  },
                  error: (err) => {
                    return err.message;
                  }
                });
              }}
              className="px-3 py-1.5 bg-rose-500 text-white text-xs rounded-lg font-medium hover:bg-rose-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ), { duration: 10000 });
    } else {
      setUserToDelete(id);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const promise = fetch(`/api/users/${userToDelete}`, {
      method: 'DELETE'
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      return res;
    });

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: () => {
        fetchUsers();
        setUserToDelete(null);
        return 'User deleted successfully';
      },
      error: (err) => {
        setUserToDelete(null);
        return err.message;
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (Array.isArray(u.district) ? u.district.join(', ').toLowerCase() : (u.district || '').toLowerCase()).includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    const matchesDivision = divisionFilter === 'All' || u.division === divisionFilter;
    const matchesBaseOffice = baseOfficeFilter === 'All' || u.base_office === baseOfficeFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDivision && matchesBaseOffice;
  }).filter(u => user.role === 'Administrator' || u.role !== 'Administrator');

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const { key, direction } = sortConfig;
    let aValue: any = a[key as keyof UserData];
    let bValue: any = b[key as keyof UserData];

    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5; // Max number of page buttons to show

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Show ellipsis if current page is far from the beginning
      if (currentPage > 2) {
        pageNumbers.push('...');
      }

      // Show pages around the current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Show ellipsis if current page is far from the end
      if (currentPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  const supervisors = users.filter(u => u.role === 'Senior Field Engineer' || u.role === 'System Administrator' || u.role === 'Administrator');
  const uniqueDivisions = Array.from(new Set(users.map(u => u.division).filter(d => d && d !== 'N/A')));
  const uniqueBaseOffices = Array.from(new Set(users.map(u => u.base_office).filter(b => b && b !== 'N/A')));

  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system access, designations, and personnel assignments.</p>
        </div>
        
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-xl text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      <div className="bg-[#001a33] border border-white/5 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
        <div className="p-5 border-b border-white/5 bg-white/[0.01] flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, username or district..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 pr-10 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All" className="bg-[#001a33]">All Roles</option>
                <option value="Field Engineer" className="bg-[#001a33]">Field Engineer</option>
                <option value="Senior Field Engineer" className="bg-[#001a33]">Senior Field Engineer</option>
                <option value="System Administrator" className="bg-[#001a33]">System Administrator</option>
                <option value="Administrator" className="bg-[#001a33]">Administrator</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 pr-10 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All" className="bg-[#001a33]">All Status</option>
                <option value="active" className="bg-[#001a33]">Active</option>
                <option value="inactive" className="bg-[#001a33]">Inactive</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 pr-10 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
              >
                <option value="All" className="bg-[#001a33]">All Divisions</option>
                {uniqueDivisions.map(div => (
                  <option key={div} value={div} className="bg-[#001a33]">{div}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 px-4 pr-10 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                value={baseOfficeFilter}
                onChange={(e) => setBaseOfficeFilter(e.target.value)}
              >
                <option value="All" className="bg-[#001a33]">All Offices</option>
                {uniqueBaseOffices.map(office => (
                  <option key={office} value={office} className="bg-[#001a33]">{office}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedUsers.length > 0 && (
            <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-400">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Activate
                </button>
                <button 
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Deactivate
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
                      checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:bg-blue-600 checked:border-blue-600"
                    />
                    <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('full_name')}>
                  <div className="flex items-center gap-2">User Details {renderSortIcon('full_name')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('id_number')}>
                  <div className="flex items-center gap-2">ID Number {renderSortIcon('id_number')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-2">Username {renderSortIcon('username')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-2">Designation {renderSortIcon('role')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('base_office')}>
                  <div className="flex items-center gap-2">Base Office {renderSortIcon('base_office')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('division')}>
                  <div className="flex items-center gap-2">Division {renderSortIcon('division')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('district')}>
                  <div className="flex items-center gap-2">District {renderSortIcon('district')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-2">Status {renderSortIcon('status')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('last_login')}>
                  <div className="flex items-center gap-2">Last Login {renderSortIcon('last_login')}</div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, i) => <UserSkeleton key={i} />)
              ) : filteredUsers.length === 0 ? (
                <EmptyState onReset={() => {
                  setSearchTerm('');
                  setRoleFilter('All');
                  setStatusFilter('All');
                  setDivisionFilter('All');
                  setBaseOfficeFilter('All');
                }} />
              ) : currentUsers.map((u) => (
                <tr key={u.id} className={`hover:bg-white/[0.03] transition-all group border-b border-white/[0.02] last:border-0 ${selectedUsers.includes(u.id) ? 'bg-blue-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id, u.role)}
                        disabled={u.role === 'Administrator' && user.role !== 'Administrator'}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-white/5 transition-all checked:bg-blue-600 checked:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <CheckCircle2 className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}&background=0284c7&color=fff&size=128`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/5"
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#001a33] ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{u.full_name}</p>
                        {u.supervisor_name && (
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            {u.supervisor_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 font-mono tracking-tighter">{u.id_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[11px] text-white font-semibold">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.role === 'Administrator' ? 'bg-rose-500' : u.role === 'Senior Field Engineer' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <span className="capitalize opacity-80">{u.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400">{u.base_office || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400">{u.division || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400 truncate max-w-[120px]">{Array.isArray(u.district) ? u.district.join(', ') : (u.district || 'N/A')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-400">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!(user.role !== 'Administrator' && u.role === 'Administrator') && (
                        <>
                          <button 
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`p-2 rounded-lg transition-all ${u.status === 'active' ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                            title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {u.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleEdit(u)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => setViewingUser(u)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        title="View User"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredUsers.length > itemsPerPage && (
          <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.01]">
            <div className="text-sm text-slate-400">
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {renderPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && paginate(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      currentPage === page ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10'
                    }`}
                    disabled={typeof page !== 'number'}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#001a33] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
            >
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{editingUser ? 'Update Profile' : 'New Account'}</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">System Access Configuration</p>
                </div>
                <button onClick={resetForm} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <form id="user-form" onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        Identity & Credentials
                      </h3>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Full legal name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-700"
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">ID Number</label>
                      <input 
                        type="text" 
                        required
                        placeholder="EMP-000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-700"
                        value={formData.id_number || ''}
                        onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                      <input 
                        type="text" 
                        required
                        placeholder="system_handle"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-700"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{editingUser ? 'New Password (Optional)' : 'Initial Password'}</label>
                      <input 
                        type="password" 
                        required={!editingUser}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-700"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2 pt-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                        Organizational Assignment
                      </h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Designation</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 pr-10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                        >
                          <option value="Field Engineer" className="bg-[#001a33]">Field Engineer</option>
                          <option value="Senior Field Engineer" className="bg-[#001a33]">Senior Field Engineer</option>
                          <option value="System Administrator" className="bg-[#001a33]">System Administrator</option>
                          <option value="Administrator" className="bg-[#001a33]">Administrator</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Division</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Operations"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                        value={formData.division || ''}
                        onChange={(e) => setFormData({...formData, division: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Base Office</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. HQ"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                        value={formData.base_office || ''}
                        onChange={(e) => setFormData({...formData, base_office: e.target.value})}
                      />
                    </div>

                    {formData.role === 'Field Engineer' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assign Supervisor</label>
                        <div className="relative">
                          <select 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 pr-10 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                            value={formData.supervisor_id}
                            onChange={(e) => setFormData({...formData, supervisor_id: e.target.value})}
                          >
                            <option value="" className="bg-[#001a33]">Select Supervisor</option>
                            {supervisors.map(s => (
                              <option key={s.id} value={s.id} className="bg-[#001a33]">{s.full_name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Districts</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-4 bg-white/[0.02] border border-white/5 rounded-2xl custom-scrollbar">
                        {ALL_DISTRICTS.map(district => (
                          <label key={district} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={formData.district.includes(district)}
                              onChange={(e) => {
                                const newDistricts = e.target.checked 
                                  ? [...formData.district, district]
                                  : formData.district.filter(d => d !== district);
                                setFormData({...formData, district: newDistricts});
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-offset-0 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-400 group-hover:text-white transition-colors">{district}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  form="user-form"
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#001a33] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative z-10 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">This action is permanent and will remove all associated data for this user account.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-rose-600 rounded-xl text-sm font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#001a33] border border-white/10 rounded-[2.5rem] w-full max-w-xl relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-600">
                <button 
                  onClick={() => setViewingUser(null)}
                  className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-10 pb-10 -mt-16">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="relative mb-6">
                    <img 
                      src={viewingUser.avatar_url || `https://ui-avatars.com/api/?name=${viewingUser.full_name}&background=0284c7&color=fff&size=256`}
                      alt="Avatar"
                      className="w-32 h-32 rounded-[2.5rem] object-cover ring-8 ring-[#001a33] shadow-2xl"
                    />
                    <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#001a33] ${viewingUser.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">{viewingUser.full_name}</h3>
                  <p className="text-blue-400 font-mono text-sm mt-1">@{viewingUser.username}</p>
                  
                  <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{viewingUser.role}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee ID</p>
                    <p className="text-white font-mono text-lg">{viewingUser.id_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Office</p>
                    <p className="text-white text-lg">{viewingUser.base_office || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Division</p>
                    <p className="text-white text-lg">{viewingUser.division || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Supervisor</p>
                    <p className="text-white text-lg">{viewingUser.supervisor_name || 'None'}</p>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl mb-10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Assigned Districts</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(viewingUser.district) && viewingUser.district.length > 0 ? (
                      viewingUser.district.map(d => (
                        <span key={d} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm italic">No districts assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System QR Code</p>
                    <p className="text-[10px] text-slate-600">Scan for quick identification</p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl shadow-xl">
                    <QRCode value={viewingUser.id_number || ''} size={64} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showBulkConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkConfirmModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#001a33] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative z-10 text-center shadow-2xl"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${
                bulkActionToConfirm === 'delete' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                {bulkActionToConfirm === 'delete' ? <Trash2 className="w-8 h-8 text-rose-500" /> : <Shield className="w-8 h-8 text-blue-500" />}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Bulk {bulkActionToConfirm === 'delete' ? 'Delete' : 'Action'}?</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Are you sure you want to {bulkActionToConfirm} {selectedUsers.length} selected users? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowBulkConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeBulkAction(bulkActionToConfirm!)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                    bulkActionToConfirm === 'delete' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
