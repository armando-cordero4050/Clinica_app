import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Loader2, Sparkles, ArrowRight, Mail, Lock } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { signIn } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        @keyframes card-float {
          0%, 100% { transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px); }
          50% { transform: perspective(1000px) rotateX(2deg) rotateY(2deg) translateY(-10px); }
        }

        .animated-gradient {
          background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        .card-3d {
          animation: card-float 8s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .input-shine {
          position: relative;
          overflow: hidden;
        }

        .input-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .input-shine:focus::before {
          animation: shine 1.5s infinite;
        }

        .btn-3d {
          transform-style: preserve-3d;
          transition: all 0.3s ease;
        }

        .btn-3d:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
        }

        .btn-3d:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
        }
      `}</style>

      <div
        className="animated-gradient absolute inset-0"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm float-animation"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>

            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              DentalFlow
            </h1>
            <p className="text-slate-600 font-medium">
              Sistema de Gestión de Laboratorio Dental
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="group">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2 group-hover:text-blue-600 transition-colors">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-shine w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm font-medium hover:border-blue-300"
                  placeholder="usuario@dentalflow.gt"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2 group-hover:text-purple-600 transition-colors">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-shine w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm font-medium hover:border-purple-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium shadow-lg animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-3d w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-2xl shadow-purple-500/50 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  <span className="text-lg">Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">Iniciar Sesión</span>
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-slate-200/50 space-y-4">
            <p className="text-center text-slate-600 text-sm font-medium">
              ¿No tienes una cuenta?{' '}
              <a
                href="/register"
                className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center"
              >
                Registrar Clínica
                <ArrowRight className="w-4 h-4 ml-1 text-purple-600" />
              </a>
            </p>
            <a
              href="/order"
              className="block text-center text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              ¿Eres dentista? Envía una orden →
            </a>
          </div>
        </div>

        <p className="text-center text-white/90 text-sm mt-8 font-medium backdrop-blur-sm bg-black/20 py-3 px-6 rounded-full inline-block mx-auto w-full">
          DentalFlow Lab Guatemala © 2025
        </p>
      </div>
    </div>
  );
}
