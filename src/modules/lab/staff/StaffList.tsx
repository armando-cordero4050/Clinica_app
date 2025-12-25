import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import { Users, Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { StaffModal } from './StaffModal';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  global_role: string;
  clinic_id: string | null;
  active: boolean;
  created_at: string;
  clinic?: {
    name: string;
  };
}

export function StaffList() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const isLabAdmin = profile?.global_role === 'lab_admin';
  const isClinicAdmin = profile?.global_role === 'clinic_admin';

  useEffect(() => {
    loadStaff();
  }, [profile]);

  async function loadStaff() {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          clinic:clinics(name)
        `)
        .order('created_at', { ascending: false });

      if (isClinicAdmin && profile?.clinic_id) {
        query = query.eq('clinic_id', profile.clinic_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(staffId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', staffId);

      if (error) throw error;
      await loadStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Error al eliminar usuario');
    }
  }

  const filteredStaff = staff.filter((member) =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      lab_admin: 'Administrador Lab',
      lab_staff: 'Staff Lab',
      clinic_admin: 'Administrador Clínica',
      clinic_staff: 'Staff Clínica',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      lab_admin: 'bg-purple-100 text-purple-800',
      lab_staff: 'bg-blue-100 text-blue-800',
      clinic_admin: 'bg-green-100 text-green-800',
      clinic_staff: 'bg-slate-100 text-slate-800',
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7" />
            Gestión de Personal
          </h2>
          <p className="text-slate-600 mt-1">
            {isLabAdmin ? 'Administra todo el personal del sistema' : 'Administra el personal de tu clínica'}
          </p>
        </div>

        {(isLabAdmin || isClinicAdmin) && (
          <button
            onClick={() => {
              setEditingStaff(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Personal
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rol
                </th>
                {isLabAdmin && (
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Clínica
                  </th>
                )}
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={isLabAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{member.full_name}</div>
                        <div className="text-sm text-slate-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.global_role)}`}>
                        {getRoleLabel(member.global_role)}
                      </span>
                    </td>
                    {isLabAdmin && (
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {member.clinic?.name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingStaff(member);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {member.active && (
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Desactivar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <StaffModal
          staff={editingStaff}
          onClose={() => {
            setShowModal(false);
            setEditingStaff(null);
          }}
          onSuccess={() => {
            loadStaff();
            setShowModal(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
}
