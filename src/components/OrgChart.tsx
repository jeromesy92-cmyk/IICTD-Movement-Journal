import React, { useState, useEffect } from 'react';
import { UserData } from '../App';
import { User, ChevronRight, ChevronDown, Search, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TreeNode extends UserData {
  children: TreeNode[];
}

const OrgNode: React.FC<{ node: TreeNode, level?: number }> = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
          level === 0 
            ? 'bg-blue-600/10 border-blue-600/20 mb-4' 
            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 mb-2'
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          level === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
        }`}>
          {node.avatar_url ? (
            <img src={node.avatar_url} alt={node.full_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            node.full_name.charAt(0)
          )}
        </div>
        
        <div className="flex-1">
          <p className={`font-medium ${level === 0 ? 'text-blue-400 text-lg' : 'text-slate-200'}`}>
            {node.full_name}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="uppercase tracking-wider font-bold">{node.role}</span>
            {node.district && (
              <>
                <span>•</span>
                <span>{node.district}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              {/* Vertical line connecting children */}
              <div 
                className="absolute left-[11px] top-0 bottom-4 w-px bg-white/10" 
                style={{ left: `${(level * 24) + 24 + 11}px` }} 
              />
              {node.children.map(child => (
                <OrgNode key={child.id} node={child} level={level + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function OrgChart({ user }: { user: UserData }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch users", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (users.length === 0) return;

    const buildTree = (users: UserData[]): TreeNode[] => {
      const userMap = new Map<number, TreeNode>();
      const roots: TreeNode[] = [];

      // Initialize all nodes
      users.forEach(u => {
        userMap.set(u.id, { ...u, children: [] });
      });

      // Build hierarchy
      users.forEach(u => {
        const node = userMap.get(u.id)!;
        if (u.supervisor_id && userMap.has(u.supervisor_id)) {
          const parent = userMap.get(u.supervisor_id)!;
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    };

    const filteredUsers = searchTerm 
      ? users.filter(u => 
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(u.district) ? u.district.join(', ') : u.district || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      : users;

    // If searching, we might break the tree structure, so we just show a flat list or try to rebuild relevant subtrees.
    // For simplicity, if searching, we just show the matching nodes as a flat list (or roots of a new tree if we want to be fancy, but flat is clearer for search).
    // Actually, let's stick to the tree structure but highlight matches? 
    // Or just filter the list and rebuild the tree from the filtered list (which might result in many roots).
    // Let's try rebuilding the tree from the full list, but only showing paths to matching nodes? That's complex.
    // Simple approach: If search is active, show flat list. If not, show tree.
    
    const buildFilteredTree = (users: UserData[], searchTerm: string): TreeNode[] => {
      const userMap = new Map<number, TreeNode>();
      users.forEach(u => userMap.set(u.id, { ...u, children: [] }));

      const filteredUserIds = new Set<number>();
      users.forEach(u => {
        if (u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
          filteredUserIds.add(u.id);
          // Add all superiors to the set
          let supervisorId = u.supervisor_id;
          while (supervisorId && userMap.has(supervisorId)) {
            filteredUserIds.add(supervisorId);
            const supervisor = userMap.get(supervisorId)!;
            supervisorId = supervisor.supervisor_id;
          }
        }
      });

      const finalUsers = users.filter(u => filteredUserIds.has(u.id));
      return buildTree(finalUsers);
    };

    if (searchTerm) {
      setTree(buildFilteredTree(users, searchTerm));
    } else {
      setTree(buildTree(users));
    }

  }, [users, searchTerm]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-500" />
            Organization Hierarchy
          </h1>
          <p className="text-slate-400">View the reporting structure and team organization.</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-[#001a33] border border-white/10 rounded-2xl p-6 shadow-xl overflow-hidden">
          {tree.length > 0 ? (
            <div className="space-y-2">
              {tree.map(node => (
                <OrgNode key={node.id} node={node} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No users found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
