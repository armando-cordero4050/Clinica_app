import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { Service, ServiceFormData } from './useServices';

interface ServiceFormProps {
  service?: Service;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  convertGTQtoUSD: (gtq: number) => number;
  convertUSDtoGTQ: (usd: number) => number;
}

export function ServiceForm({ service, onClose, onSubmit, convertGTQtoUSD, convertUSDtoGTQ }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    price_gtq: 0,
    price_usd: 0,
    turnaround_days: 5,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastEditedCurrency, setLastEditedCurrency] = useState<'GTQ' | 'USD'>('GTQ');

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || '',
        price_gtq: service.price_gtq,
        price_usd: service.price_usd,
        turnaround_days: service.turnaround_days,
        active: service.active,
      });
    }
  }, [service]);

  function handlePriceChange(currency: 'GTQ' | 'USD', value: number) {
    setLastEditedCurrency(currency);

    if (currency === 'GTQ') {
      setFormData({
        ...formData,
        price_gtq: value,
        price_usd: convertGTQtoUSD(value),
      });
    } else {
      setFormData({
        ...formData,
        price_usd: value,
        price_gtq: convertUSDtoGTQ(value),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('El nombre del servicio es requerido');
      return;
    }

    if (formData.price_gtq <= 0 || formData.price_usd <= 0) {
      alert('Los precios deben ser mayores a cero');
      return;
    }

    if (formData.turnaround_days < 1) {
      alert('Los días de entrega deben ser al menos 1');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      alert('Error al guardar el servicio. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {service ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Servicio *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Corona de Porcelana"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Descripción del servicio..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Prótesis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Días de Entrega *
              </label>
              <input
                type="number"
                value={formData.turnaround_days}
                onChange={(e) => setFormData({ ...formData, turnaround_days: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio GTQ *
              </label>
              <input
                type="number"
                value={formData.price_gtq}
                onChange={(e) => handlePriceChange('GTQ', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Precio USD *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price_usd}
                  onChange={(e) => handlePriceChange('USD', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <div className="absolute right-2 top-2">
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Conversión automática desde {lastEditedCurrency}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Servicio activo
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Solo los servicios activos estarán disponibles en el formulario público
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Guardando...' : service ? 'Actualizar' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
