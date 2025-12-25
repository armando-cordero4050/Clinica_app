import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderHistoryProps {
  orderId: string;
}

interface HistoryEntry {
  id: string;
  status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  user_name: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  received: 'Recibido',
  in_design: 'En Diseño',
  in_fabrication: 'En Fabricación',
  quality_control: 'Control de Calidad',
  ready_delivery: 'Listo para Entrega',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-gray-100 text-gray-800',
  in_design: 'bg-blue-100 text-blue-800',
  in_fabrication: 'bg-yellow-100 text-yellow-800',
  quality_control: 'bg-purple-100 text-purple-800',
  ready_delivery: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderHistory({ orderId }: OrderHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [orderId]);

  async function loadHistory() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('order_status_history')
        .select(`
          id,
          status,
          changed_by,
          notes,
          created_at,
          profiles:changed_by (
            full_name
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((entry: any) => ({
        id: entry.id,
        status: entry.status,
        changed_by: entry.changed_by,
        notes: entry.notes,
        created_at: entry.created_at,
        user_name: entry.profiles?.full_name || null,
      })) || [];

      setHistory(formattedData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {history.map((entry, index) => (
            <div key={entry.id} className="relative pl-10">
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${STATUS_COLORS[entry.status] || 'bg-gray-100'}`}>
                <Clock className="w-4 h-4" />
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[entry.status] || entry.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(entry.created_at)}
                  </span>
                </div>

                {entry.user_name && (
                  <p className="text-sm text-gray-600 mt-1">
                    Por: <span className="font-medium">{entry.user_name}</span>
                  </p>
                )}

                {entry.notes && (
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded p-2">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
