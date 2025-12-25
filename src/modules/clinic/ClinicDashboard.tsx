import { useAuth } from '../auth/AuthContext';
import { LogOut, Package, Plus, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ClinicOrdersList } from './ClinicOrdersList';
import { CreateOrderForm } from './CreateOrderForm';
import { ClinicPayments } from './ClinicPayments';

export function ClinicDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'create' | 'payments'>('orders');

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Portal de Clínica</h1>
                  <p className="text-xs text-slate-500">DentalFlow Lab</p>
                </div>
              </div>

              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Mis Órdenes
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'create'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Nueva Orden
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'payments'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Pagos
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.global_role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'orders' && <ClinicOrdersList />}
        {activeTab === 'create' && <CreateOrderForm />}
        {activeTab === 'payments' && <ClinicPayments />}
      </main>
    </div>
  );
}
