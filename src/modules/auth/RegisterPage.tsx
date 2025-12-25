import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Building2, User, Mail, Lock, Phone, MapPin } from 'lucide-react';

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [clinicData, setClinicData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Guatemala',
  });

  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (userData.password !== userData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (userData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: clinicData.name,
          phone: clinicData.phone,
          address: clinicData.address,
          city: clinicData.city,
          country: clinicData.country,
          active: true,
        })
        .select()
        .single();

      if (clinicError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw clinicError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          role: 'clinic_admin',
          clinic_id: clinic.id,
          active: true,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        throw profileError;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Error al registrar la clínica');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registro Exitoso</h2>
          <p className="text-slate-600">Tu clínica ha sido registrada. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Registrar Clínica
            </h1>
            <p className="text-slate-600">
              Crea una cuenta para tu clínica dental
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Información de la Clínica
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre de la Clínica
                </label>
                <input
                  type="text"
                  required
                  value={clinicData.name}
                  onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Clínica Dental"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={clinicData.phone}
                    onChange={(e) => setClinicData({ ...clinicData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+502 1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Ciudad
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicData.city}
                    onChange={(e) => setClinicData({ ...clinicData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Guatemala"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  required
                  value={clinicData.address}
                  onChange={(e) => setClinicData({ ...clinicData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Calle, zona, ciudad"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Datos del Administrador
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={userData.full_name}
                  onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dr. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@clinica.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={userData.confirmPassword}
                    onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                Iniciar Sesión
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          DentalFlow Lab Guatemala © 2025
        </p>
      </div>
    </div>
  );
}
