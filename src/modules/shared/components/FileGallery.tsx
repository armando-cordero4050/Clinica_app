import { useState, useEffect } from 'react';
import { Trash2, Download, FileIcon, Image as ImageIcon, FileText, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { OrderAttachment } from './FileUpload';

interface FileGalleryProps {
  orderId: string;
  canDelete?: boolean;
}

export function FileGallery({ orderId, canDelete = false }: FileGalleryProps) {
  const [attachments, setAttachments] = useState<OrderAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAttachments();
  }, [orderId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('order_attachments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAttachments(data || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (filePath: string): string => {
    const { data } = supabase.storage.from('order-files').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const downloadFile = async (attachment: OrderAttachment) => {
    try {
      const url = getFileUrl(attachment.file_path);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Error al descargar el archivo');
    }
  };

  const deleteFile = async (attachment: OrderAttachment) => {
    if (!confirm(`¿Estás seguro de eliminar "${attachment.file_name}"?`)) {
      return;
    }

    try {
      setDeleting(attachment.id);

      const { error: deleteStorageError } = await supabase.storage
        .from('order-files')
        .remove([attachment.file_path]);

      if (deleteStorageError) throw deleteStorageError;

      const { error: deleteDbError } = await supabase
        .from('order_attachments')
        .delete()
        .eq('id', attachment.id);

      if (deleteDbError) throw deleteDbError;

      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Error al eliminar el archivo');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5" />;
    }
    return <FileIcon className="w-5 h-5" />;
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchAttachments}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8">
        <FileIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">No hay archivos adjuntos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-700">
        Archivos Adjuntos ({attachments.length})
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((attachment) => {
          const fileUrl = getFileUrl(attachment.file_path);

          return (
            <div
              key={attachment.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {isImage(attachment.file_type) ? (
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={fileUrl}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </a>
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-flex p-4 bg-gray-200 rounded-full mb-2">
                      {getFileIcon(attachment.file_type)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {attachment.file_type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate mb-1">
                  {attachment.file_name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  <span>{formatDate(attachment.created_at)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadFile(attachment)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => deleteFile(attachment)}
                      disabled={deleting === attachment.id}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleting === attachment.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
