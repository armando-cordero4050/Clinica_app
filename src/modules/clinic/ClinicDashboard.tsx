import { useAuth } from '../auth/AuthContext';
import { LogOut, Package, Plus, Wallet, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ClinicOrdersList } from './ClinicOrdersList';
import { CreateOrderForm } from './CreateOrderForm';
import { ClinicPayments } from './ClinicPayments';

export function ClinicDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'create' | 'payments'>('orders');

  const availableTabs = useMemo(() => {
    const allTabs = [
      { id: 'orders', label: 'Mis Órdenes', icon: Package, roles: ['clinic_admin', 'clinic_staff'] },
      { id: 'create', label: 'Nueva Orden', icon: Plus, roles: ['clinic_admin', 'clinic_staff'] },
      { id: 'payments', label: 'Pagos', icon: Wallet, roles: ['clinic_admin'] },
    ] as const;

    return allTabs.filter(tab =>
      tab.roles.includes(profile?.global_role as any)
    );
  }, [profile?.global_role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50">
      <nav className="glass-card border-b border-emerald-200/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3 slide-in">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gradient">Portal de Clínica</h1>
                  <p className="text-xs text-slate-500 hidden sm:block">DentalFlow Lab</p>
                </div>
              </div>

              <div className="hidden md:flex gap-1">
                {availableTabs.map((tab, index) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 slide-in ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                          : 'text-slate-600 hover:bg-white hover:text-emerald-600 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right hidden sm:block scale-in">
                <p className="text-sm font-semibold text-slate-900">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.global_role?.replace('_', ' ')}</p>
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

          <div className="md:hidden flex gap-2 pb-3 overflow-x-auto scrollbar-thin">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
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

      <main className="max-w-7xl mx-auto px-4 py-8 fade-in">
        {activeTab === 'orders' && <ClinicOrdersList />}
        {activeTab === 'create' && <CreateOrderForm />}
        {activeTab === 'payments' && <ClinicPayments />}
      </main>
    </div>
  );
}
