import { useAuth } from '../auth/AuthContext';
import { LogOut, Package, Settings, BarChart3, Wrench, Building2, Wallet, Users, Sparkles } from 'lucide-react';
import { KanbanBoard } from '../lab-orders/KanbanBoard';
import { ServiceList } from './services/ServiceList';
import { LaboratorySettings } from './settings/LaboratorySettings';
import { DashboardStats } from './dashboard/DashboardStats';
import { ClinicsList } from './clinics/ClinicsList';
import { PaymentsReport } from '../payments/PaymentsReport';
import { StaffList } from './staff/StaffList';
import { useState, useMemo } from 'react';

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'clinics' | 'payments' | 'staff' | 'stats' | 'settings'>('orders');

  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: 'orders', label: 'Órdenes', icon: Package, roles: ['super_admin', 'lab_admin', 'lab_staff'] },
      { id: 'services', label: 'Servicios', icon: Wrench, roles: ['super_admin', 'lab_admin'] },
      { id: 'clinics', label: 'Clínicas', icon: Building2, roles: ['super_admin', 'lab_admin'] },
      { id: 'payments', label: 'Pagos', icon: Wallet, roles: ['super_admin', 'lab_admin'] },
      { id: 'staff', label: 'Personal', icon: Users, roles: ['super_admin', 'lab_admin'] },
      { id: 'stats', label: 'Estadísticas', icon: BarChart3, roles: ['super_admin', 'lab_admin'] },
      { id: 'settings', label: 'Configuración', icon: Settings, roles: ['super_admin', 'lab_admin'] },
    ] as const;

    return allTabs.filter(tab =>
      tab.roles.includes(profile?.global_role as any)
    );
  }, [profile?.global_role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <nav className="glass-card border-b border-slate-200/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3 slide-in">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gradient">DentalFlow</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Lab Guatemala</p>
                </div>
              </div>

              <div className="hidden lg:flex gap-1">
                {availableTabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 slide-in ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                          : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xl:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right hidden sm:block scale-in">
                <p className="text-sm font-semibold text-slate-900">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">
                  {profile?.global_role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={signOut}
                className="p-2 sm:p-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="lg:hidden flex gap-2 pb-3 overflow-x-auto scrollbar-thin">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="fade-in">
        {activeTab === 'orders' && <KanbanBoard />}
        {activeTab === 'services' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <ServiceList />
          </div>
        )}
        {activeTab === 'clinics' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <ClinicsList />
          </div>
        )}
        {activeTab === 'payments' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <PaymentsReport />
          </div>
        )}
        {activeTab === 'staff' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <StaffList />
          </div>
        )}
        {activeTab === 'stats' && <DashboardStats />}
        {activeTab === 'settings' && (
          <div className="p-4 sm:p-6 lg:p-8">
            <LaboratorySettings />
          </div>
        )}
      </main>
    </div>
  );
}
