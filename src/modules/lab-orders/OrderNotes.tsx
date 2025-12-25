import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface OrderNotesProps {
  orderId: string;
}

interface Note {
  id: string;
  note: string;
  user_id: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

export function OrderNotes({ orderId }: OrderNotesProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadNotes();

    const channel = supabase
      .channel(`order-notes-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_notes',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          loadNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function loadNotes() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('order_notes')
        .select(`
          id,
          note,
          user_id,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((entry: any) => ({
        id: entry.id,
        note: entry.note,
        user_id: entry.user_id,
        created_at: entry.created_at,
        user_name: entry.profiles?.full_name || 'Usuario Desconocido',
        user_email: entry.profiles?.email || '',
      })) || [];

      setNotes(formattedData);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newNote.trim() || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          user_id: user.id,
          note: newNote.trim(),
        });

      if (error) throw error;

      setNewNote('');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Error al crear la nota. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) return;

    try {
      const { error } = await supabase
        .from('order_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error al eliminar la nota. Por favor intenta de nuevo.');
    }
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('es-GT', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escribe una nota interna..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={submitting}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!newNote.trim() || submitting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Guardando...' : 'Agregar Nota'}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay notas todavía</p>
          <p className="text-sm mt-1">Sé el primero en agregar una nota</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{note.user_name}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(note.created_at)}</p>
                </div>
                {user?.id === note.user_id && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
