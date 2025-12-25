import { useState, useEffect } from 'react';
import { Save, Building2, Phone, MapPin, FileText, DollarSign } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Laboratory {
  id: string;
  name: string;
  country: string;
  phone: string | null;
  address: string | null;
  tax_id: string;
  tax_rate: number;
  default_currency: string;
  allowed_currencies: string[];
  logo_url: string | null;
}

export function LaboratorySettings() {
  const [laboratory, setLaboratory] = useState<Laboratory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLaboratory();
  }, []);

  async function loadLaboratory() {
    try {
      const { data, error } = await supabase
        .from('laboratories')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLaboratory(data);
    } catch (error) {
      console.error('Error loading laboratory:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!laboratory) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('laboratories')
        .update({
          name: laboratory.name,
          country: laboratory.country,
          phone: laboratory.phone || null,
          address: laboratory.address || null,
          tax_id: laboratory.tax_id,
          tax_rate: laboratory.tax_rate,
          default_currency: laboratory.default_currency,
          allowed_currencies: laboratory.allowed_currencies,
        })
        .eq('id', laboratory.id);

      if (error) throw error;

      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving laboratory:', error);
      alert('Error al guardar la configuración. Por favor intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!laboratory) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">No se pudo cargar la configuración del laboratorio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Laboratorio</h1>
        <p className="text-gray-600 mt-1">Gestiona la información general del laboratorio</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Información General
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Laboratorio *
                </label>
                <input
                  type="text"
                  value={laboratory.name}
                  onChange={(e) => setLaboratory({ ...laboratory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={laboratory.phone || ''}
                    onChange={(e) => setLaboratory({ ...laboratory, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+502 1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={laboratory.country}
                    onChange={(e) => setLaboratory({ ...laboratory, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Dirección
                </label>
                <textarea
                  value={laboratory.address || ''}
                  onChange={(e) => setLaboratory({ ...laboratory, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Dirección completa del laboratorio"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Información Fiscal
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIT / RFC
                  </label>
                  <input
                    type="text"
                    value={laboratory.tax_id}
                    onChange={(e) => setLaboratory({ ...laboratory, tax_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="CF"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Impuesto (%)
                  </label>
                  <input
                    type="number"
                    value={laboratory.tax_rate * 100}
                    onChange={(e) => setLaboratory({ ...laboratory, tax_rate: parseFloat(e.target.value) / 100 })}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor actual: {(laboratory.tax_rate * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
              Configuración de Moneda
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda Predeterminada
                </label>
                <select
                  value={laboratory.default_currency}
                  onChange={(e) => setLaboratory({ ...laboratory, default_currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GTQ">GTQ - Quetzal Guatemalteco</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monedas Permitidas
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={laboratory.allowed_currencies.includes('GTQ')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLaboratory({
                            ...laboratory,
                            allowed_currencies: [...laboratory.allowed_currencies, 'GTQ'],
                          });
                        } else {
                          setLaboratory({
                            ...laboratory,
                            allowed_currencies: laboratory.allowed_currencies.filter(c => c !== 'GTQ'),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">GTQ - Quetzal</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={laboratory.allowed_currencies.includes('USD')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setLaboratory({
                            ...laboratory,
                            allowed_currencies: [...laboratory.allowed_currencies, 'USD'],
                          });
                        } else {
                          setLaboratory({
                            ...laboratory,
                            allowed_currencies: laboratory.allowed_currencies.filter(c => c !== 'USD'),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">USD - Dólar</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
