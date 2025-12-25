import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Check, Loader2 } from 'lucide-react';
import { FileUpload } from '../shared/components/FileUpload';

type Service = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_gtq: number;
  price_usd: number;
  turnaround_days: number;
};

type ToothSelection = {
  number: string;
  service?: Service;
  condition?: string;
};

const FDI_TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

const CONDITIONS = [
  { value: 'caries', label: 'Caries' },
  { value: 'restoration', label: 'Restauración' },
  { value: 'crown', label: 'Corona' },
  { value: 'implant', label: 'Implante' },
  { value: 'prosthesis', label: 'Prótesis' },
  { value: 'missing', label: 'Diente Ausente' },
  { value: 'endodontics', label: 'Endodoncia' },
  { value: 'orthodontics', label: 'Ortodoncia' },
  { value: 'surgery', label: 'Cirugía' },
];

export function OrderForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedTeeth, setSelectedTeeth] = useState<ToothSelection[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentTooth, setCurrentTooth] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [firstOrderId, setFirstOrderId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    clinicId: '',
    clinicName: '',
    doctorName: '',
    doctorEmail: '',
    patientName: '',
    patientAge: '',
    patientGender: 'M' as 'M' | 'F' | 'Otro',
    diagnosis: '',
    notes: '',
    currency: 'GTQ' as 'GTQ' | 'USD',
  });

  useEffect(() => {
    loadServices();
    loadClinics();
  }, []);

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('lab_services')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  async function loadClinics() {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  }

  function handleToothClick(toothNumber: string) {
    setCurrentTooth(toothNumber);
    setShowModal(true);
  }

  function handleAddSelection(service: Service, condition: string) {
    setSelectedTeeth([
      ...selectedTeeth.filter((t) => t.number !== currentTooth),
      { number: currentTooth!, service, condition },
    ]);
    setShowModal(false);
    setCurrentTooth(null);
  }

  function isToothSelected(toothNumber: string): boolean {
    return selectedTeeth.some((t) => t.number === toothNumber);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedTeeth.length === 0) {
      alert('Por favor selecciona al menos un diente en el odontograma');
      return;
    }

    setLoading(true);

    try {
      const { data: labData } = await supabase
        .from('laboratories')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!labData) throw new Error('No laboratory found');

      let firstId: string | null = null;

      for (const tooth of selectedTeeth) {
        if (!tooth.service) continue;

        const price = formData.currency === 'GTQ' ? tooth.service.price_gtq : tooth.service.price_usd;

        const { data: orderData, error: orderError } = await supabase
          .from('lab_orders')
          .insert({
            laboratory_id: labData.id,
            clinic_id: formData.clinicId || null,
            clinic_name: formData.clinicName,
            doctor_name: formData.doctorName,
            doctor_email: formData.doctorEmail,
            patient_name: formData.patientName,
            patient_age: formData.patientAge ? parseInt(formData.patientAge) : null,
            patient_gender: formData.patientGender,
            service_id: tooth.service.id,
            service_name: tooth.service.name,
            price,
            currency: formData.currency,
            diagnosis: formData.diagnosis,
            doctor_notes: formData.notes,
            order_number: '',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        if (!firstId) firstId = orderData.id;

        const { error: selectionError } = await supabase
          .from('odontogram_selections')
          .insert({
            order_id: orderData.id,
            tooth_number: tooth.number,
            tooth_notation: 'FDI',
            condition_type: tooth.condition!,
          });

        if (selectionError) throw selectionError;
      }

      setFirstOrderId(firstId);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error al enviar la orden. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Orden Enviada Exitosamente
          </h2>
          <p className="text-slate-600 mb-6">
            Hemos recibido tu orden. Te contactaremos pronto con los detalles.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Enviar Otra Orden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">DentalFlow Lab Guatemala</h1>
          <p className="text-slate-600 mt-1">Formulario de Orden para Dentistas</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Información de la Clínica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Selecciona tu Clínica (Opcional)
                  </label>
                  <select
                    value={formData.clinicId}
                    onChange={(e) => {
                      const selectedClinic = clinics.find(c => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        clinicId: e.target.value,
                        clinicName: selectedClinic ? selectedClinic.name : formData.clinicName,
                      });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Selecciona una clínica o escribe el nombre abajo --</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Si tu clínica no aparece en la lista, escribe el nombre abajo
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre de la Clínica *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  disabled={!!formData.clinicId}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Doctor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo del Doctor *
                </label>
                <input
                  type="email"
                  required
                  value={formData.doctorEmail}
                  onChange={(e) => setFormData({ ...formData, doctorEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Información del Paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Paciente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Edad</label>
                <input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Género</label>
                <select
                  value={formData.patientGender}
                  onChange={(e) => setFormData({ ...formData, patientGender: e.target.value as 'M' | 'F' | 'Otro' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Moneda</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'GTQ' | 'USD' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GTQ">Quetzales (Q)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Odontograma (FDI) *</h2>
            <p className="text-sm text-slate-600 mb-4">
              Haz clic en los dientes que requieren tratamiento
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Arcada Superior</p>
                <div className="flex gap-1 justify-center">
                  {FDI_TEETH.upper.map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className={`w-10 h-12 rounded-lg border-2 text-xs font-semibold transition-all ${
                        isToothSelected(tooth)
                          ? 'bg-blue-500 border-blue-600 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Arcada Inferior</p>
                <div className="flex gap-1 justify-center">
                  {FDI_TEETH.lower.map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className={`w-10 h-12 rounded-lg border-2 text-xs font-semibold transition-all ${
                        isToothSelected(tooth)
                          ? 'bg-blue-500 border-blue-600 text-white'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedTeeth.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-slate-900 mb-2">
                  Dientes seleccionados ({selectedTeeth.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTeeth.map((tooth) => (
                    <span
                      key={tooth.number}
                      className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-lg text-sm border border-blue-200"
                    >
                      <span className="font-semibold">#{tooth.number}</span>
                      <span className="text-slate-600">- {tooth.service?.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTeeth(selectedTeeth.filter((t) => t.number !== tooth.number))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Información Clínica</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Diagnóstico
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Archivos Adjuntos (Opcional)
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Puedes subir radiografías, fotografías intraorales o cualquier imagen relevante para el caso
            </p>
            <FileUpload
              orderId={firstOrderId || undefined}
              uploaderEmail={formData.doctorEmail}
              maxFiles={10}
              maxSizeMB={10}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || selectedTeeth.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Orden'
              )}
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                Diente #{currentTooth}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Condición / Diagnóstico
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((condition) => (
                    <button
                      key={condition.value}
                      type="button"
                      onClick={() => {
                        const tempCondition = condition.value;
                        document.querySelectorAll('[data-condition]').forEach((el) => {
                          el.setAttribute('data-selected', 'false');
                        });
                        const btn = document.querySelector(`[data-condition="${tempCondition}"]`);
                        btn?.setAttribute('data-selected', 'true');
                      }}
                      data-condition={condition.value}
                      className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-100 text-sm font-medium text-slate-700"
                    >
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Servicio a Realizar
                </label>
                <div className="space-y-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        const selectedCondition = document.querySelector('[data-condition][data-selected="true"]');
                        const conditionValue = selectedCondition?.getAttribute('data-condition');
                        if (!conditionValue) {
                          alert('Por favor selecciona una condición primero');
                          return;
                        }
                        handleAddSelection(service, conditionValue);
                      }}
                      className="w-full text-left px-4 py-3 border border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                          )}
                          {service.category && (
                            <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                              {service.category}
                            </span>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-slate-900">
                            {formData.currency === 'GTQ' ? 'Q' : '$'}
                            {(formData.currency === 'GTQ' ? service.price_gtq : service.price_usd).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {service.turnaround_days} días
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
