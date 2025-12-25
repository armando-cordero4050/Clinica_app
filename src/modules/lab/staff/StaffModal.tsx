import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/AuthContext';
import { X, Loader2 } from 'lucide-react';

interface Clinic {
  id: string;
  name: string;
}

interface StaffModalProps {
  staff: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function StaffModal({ staff, onClose, onSuccess }: StaffModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [formData, setFormData] = useState({
    email: staff?.email || '',
    password: '',
    full_name: staff?.full_name || '',
    role: staff?.global_role || 'lab_staff',
    clinic_id: staff?.clinic_id || '',
    active: staff?.active ?? true,
  });

  const isLabAdmin = profile?.global_role === 'lab_admin';
  const isClinicAdmin = profile?.global_role === 'clinic_admin';
  const isEditing = !!staff;

  useEffect(() => {
    if (isLabAdmin) {
      loadClinics();
    }
  }, [isLabAdmin]);

  async function loadClinics() {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        const updateData: any = {
          full_name: formData.full_name,
          global_role: formData.role,
          active: formData.active,
        };

        if (isLabAdmin) {
          updateData.clinic_id = formData.clinic_id || null;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', staff.id);

        if (error) throw error;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const requestBody: any = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
        };

        if (isClinicAdmin) {
          requestBody.role = 'clinic_staff';
          requestBody.clinic_id = profile?.clinic_id;
        } else if (formData.role === 'clinic_admin' || formData.role === 'clinic_staff') {
          if (!formData.clinic_id) {
            alert('Debes seleccionar una clínica para roles de clínica');
            setLoading(false);
            return;
          }
          requestBody.clinic_id = formData.clinic_id;
        }

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Error al crear usuario');
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving staff:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = isLabAdmin
    ? [
        { value: 'lab_admin', label: 'Administrador Lab' },
        { value: 'lab_staff', label: 'Staff Lab' },
        { value: 'clinic_admin', label: 'Administrador Clínica' },
        { value: 'clinic_staff', label: 'Staff Clínica' },
      ]
    : [
        { value: 'clinic_staff', label: 'Staff Clínica' },
      ];

  const needsClinic = formData.role === 'clinic_admin' || formData.role === 'clinic_staff';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Editar Usuario' : 'Agregar Usuario'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dr. Juan Pérez"
            />
          </div>

          {!isEditing && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@dentalflow.gt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rol
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isClinicAdmin}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isLabAdmin && needsClinic && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Clínica
              </label>
              <select
                required
                value={formData.clinic_id}
                onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar clínica...</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm font-medium text-slate-700">
                Usuario activo
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditing ? 'Actualizar' : 'Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
