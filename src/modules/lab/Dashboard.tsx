import { useAuth } from '../auth/AuthContext';
import { LogOut, Package, Settings, BarChart3, Wrench, Building2, Wallet } from 'lucide-react';
import { KanbanBoard } from '../lab-orders/KanbanBoard';
import { ServiceList } from './services/ServiceList';
import { LaboratorySettings } from './settings/LaboratorySettings';
import { DashboardStats } from './dashboard/DashboardStats';
import { ClinicsList } from './clinics/ClinicsList';
import { PaymentsReport } from '../payments/PaymentsReport';
import { useState } from 'react';

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'clinics' | 'payments' | 'stats' | 'settings'>('orders');

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">DentalFlow</h1>
                  <p className="text-xs text-slate-500">Lab Guatemala</p>
                </div>
              </div>

              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Órdenes
                </button>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'services'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Servicios
                </button>
                <button
                  onClick={() => setActiveTab('clinics')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'clinics'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Clínicas
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'payments'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Pagos
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Estadísticas
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Configuración
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

      <main>
        {activeTab === 'orders' && <KanbanBoard />}
        {activeTab === 'services' && <ServiceList />}
        {activeTab === 'clinics' && (
          <div className="p-6">
            <ClinicsList />
          </div>
        )}
        {activeTab === 'payments' && (
          <div className="p-6">
            <PaymentsReport />
          </div>
        )}
        {activeTab === 'stats' && <DashboardStats />}
        {activeTab === 'settings' && <LaboratorySettings />}
      </main>
    </div>
  );
}
