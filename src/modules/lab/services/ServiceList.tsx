import { useState } from 'react';
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight, DollarSign, Clock } from 'lucide-react';
import { useServices, Service } from './useServices';
import { ServiceForm } from './ServiceForm';

export function ServiceList() {
  const {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    toggleServiceActive,
    convertGTQtoUSD,
    convertUSDtoGTQ,
  } = useServices();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  function handleCreate() {
    setSelectedService(undefined);
    setShowForm(true);
  }

  function handleEdit(service: Service) {
    setSelectedService(service);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setSelectedService(undefined);
  }

  async function handleSubmit(formData: any) {
    if (selectedService) {
      await updateService(selectedService.id, formData);
    } else {
      await createService(formData);
    }
  }

  async function handleDelete(service: Service) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${service.name}"?`)) return;

    try {
      await deleteService(service.id);
    } catch (error) {
      alert('No se puede eliminar este servicio porque está asociado a órdenes existentes.');
    }
  }

  async function handleToggleActive(service: Service) {
    await toggleServiceActive(service.id, service.active);
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && service.active) ||
      (filterActive === 'inactive' && !service.active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
            <p className="text-gray-600 mt-1">Gestiona los servicios del laboratorio</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Servicio
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar servicios..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactivos
            </button>
          </div>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No se encontraron servicios</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow ${
                service.active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {service.name}
                    </h3>
                    {service.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {service.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(service)}
                    className="ml-2"
                    title={service.active ? 'Desactivar' : 'Activar'}
                  >
                    {service.active ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>

                {service.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio GTQ:
                    </span>
                    <span className="font-semibold text-gray-900">
                      Q{service.price_gtq.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio USD:
                    </span>
                    <span className="font-semibold text-gray-900">
                      ${service.price_usd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Entrega:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {service.turnaround_days} días
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceForm
          service={selectedService}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          convertGTQtoUSD={convertGTQtoUSD}
          convertUSDtoGTQ={convertUSDtoGTQ}
        />
      )}
    </div>
  );
}
