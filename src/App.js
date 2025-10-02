import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import BombForm from './components/BombForm';
import AdminDashboard from './components/AdminDashboard';
import { getCurrentUser, logout } from './services/auth';
import alas from './images/alas2.png';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setView('admin');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setView('admin');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800">
        <div className="relative">
          <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 sm:w-16 h-12 sm:h-16 border-4 border-orange-400 border-b-transparent rounded-full animate-spin animate-reverse"></div>
          <div className="mt-4 text-lg sm:text-xl text-yellow-300 animate-pulse text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 shadow-xl relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 sm:w-12 h-8 sm:h-10 bg-white/90 rounded-lg flex items-center justify-center">
                <img src={alas} alt="logo" className="w-6 sm:w-8 h-6 sm:h-8 object-contain" />
              </div>
              <h1 className="text-base sm:text-xl font-bold text-white">Sistema de Gestión de Brigadas</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="text-white/90 bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg backdrop-blur-sm text-sm sm:text-base">
                <span className="font-medium">{user?.username}</span>
                <span className="text-white/70 ml-2">{user?.role ? `(${user.role})` : ''}</span>
              </div>
              <button
                onClick={handleLogout}
                className="group bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:py-8 px-3 sm:px-6">
          <AdminDashboard onBack={handleLogout} />
        </main>
      </div>
    );
  }

  if (view === 'login') return <Login onLogin={handleLogin} onBack={() => setView('landing')} />;
  if (view === 'brigada') return <BombForm onBack={() => setView('landing')} />;

  // LANDING RESPONSIVE
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute top-12 sm:top-20 left-10 sm:left-20 w-40 sm:w-72 h-40 sm:h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-12 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-80 h-32 sm:h-80 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Logo styled */}
      <div className="relative w-full py-4 sm:py-6 flex justify-center">
        <div className="group relative">
          <img 
            src={alas} 
            alt="Logo" 
            className="w-16 sm:w-24 h-16 sm:h-24 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-all duration-500" 
          />
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
        <div className="text-center mb-8 sm:mb-16 animate-slide-up">
          <h1 className="text-3xl sm:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent animate-gradient-x leading-tight pb-2">
            Bienvenido al Sistema de Brigadas
          </h1>
          <p className="text-base sm:text-2xl text-slate-300 animate-fade-in-delay">Por favor, selecciona tu rol para continuar.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-10 w-full max-w-xs sm:max-w-3xl mx-auto animate-slide-up-delay">
          {/* Opción Encargado */}
          <div
            onClick={() => setView('login')}
            className="group relative bg-gradient-to-br from-slate-800/80 to-indigo-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-10 border border-yellow-400/30 hover:border-yellow-400/70 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 shadow-2xl hover:shadow-yellow-500/25 w-full max-w-xs sm:max-w-md mx-auto"
          >
            {/* Brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-3 sm:mb-6">
                <div className="w-8 sm:w-12 h-8 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mr-3 sm:mr-4 transform group-hover:rotate-6 transition-transform duration-300">
                  <span className="text-white text-lg sm:text-xl font-bold">👨‍💼</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  Administrador
                </h2>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-8 leading-relaxed text-sm sm:text-base">Accede para visualizar el estado de las brigadas y gestionar el sistema completo.</p>
              <div className="flex items-center justify-end text-yellow-400 group-hover:text-yellow-300 transition-colors">
                <span className="text-base sm:text-lg mr-2 sm:mr-3 group-hover:mr-3 sm:group-hover:mr-6 transition-all duration-300 font-medium">Acceder</span>
                <span className="text-xl sm:text-2xl transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">→</span>
              </div>
            </div>
          </div>

          {/* Opción Brigada */}
          <div
            onClick={() => setView('brigada')}
            className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-10 border border-orange-400/30 hover:border-orange-400/70 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 hover:scale-105 shadow-2xl hover:shadow-orange-500/25 w-full max-w-xs sm:max-w-md mx-auto"
          >
            {/* Brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-3 sm:mb-6">
                <div className="w-8 sm:w-12 h-8 sm:h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center mr-3 sm:mr-4 transform group-hover:rotate-6 transition-transform duration-300">
                  <span className="text-white text-lg sm:text-xl font-bold">👥</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Equipo o Brigada
                </h2>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-8 leading-relaxed text-sm sm:text-base">Continúa para registrar a tu brigada y todo lo que necesiten para sus operaciones.</p>
              <div className="flex items-center justify-end text-orange-400 group-hover:text-orange-300 transition-colors">
                <span className="text-base sm:text-lg mr-2 sm:mr-3 group-hover:mr-3 sm:group-hover:mr-6 transition-all duration-300 font-medium">Continuar</span>
                <span className="text-xl sm:text-2xl transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
