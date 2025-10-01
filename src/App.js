import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import BombForm from './components/BombForm';
import AdminDashboard from './components/AdminDashboard';
import { getCurrentUser, logout } from './services/auth';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('landing'); // 'landing' | 'login' | 'brigada'

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setView('login'); // Asegura que se mantenga en la vista de administrador
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        logout();
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-orange-400 border-b-transparent rounded-full animate-spin animate-reverse"></div>
                    <div className="mt-4 text-xl text-yellow-300 animate-pulse text-center">Cargando...</div>
                </div>
            </div>
        );
    }

    // Si no hay usuario logueado, mostrar pantalla de elección (Encargado vs Brigada)
    if (!user) {
        if (view === 'login') return <Login onLogin={handleLogin} onBack={() => setView('landing')} />;
        if (view === 'brigada') return <BombForm onBack={() => setView('landing')} />;
    }

    if (user) {
        return <AdminDashboard onBack={() => {
            handleLogout();
            setView('landing');
        }} />;
    }

    // Pantalla inicial (landing)
       return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-hidden">
                {/* Elementos decorativos de fondo */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
                </div>

         {/* Logo solo, sin fondo */}
<div className="relative w-full py-6 flex justify-center">
    <div className="group relative">
        <div className="w-32 h-16 bg-white/95 rounded-xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-500">
            <img 
                src="/images/alas.png" 
                alt="Logo de la empresa" 
                className="max-w-full max-h-full object-contain"
            />
            <span className="text-slate-700 font-bold text-base tracking-wide">LOGO</span>
        </div>
    </div>
</div>


                <div className="relative flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
    <div className="text-center mb-16 animate-slide-up">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent animate-gradient-x leading-tight pb-2">
            Bienvenido al Sistema de Brigadas
        </h1>
        <p className="text-2xl text-slate-300 animate-fade-in-delay">Por favor, selecciona tu rol para continuar.</p>
    </div>


                    <div className="flex flex-col lg:flex-row gap-10 animate-slide-up-delay">
                        {/* Opción Encargado */}
                        <div
                            onClick={() => setView('login')}
                            className="group relative bg-gradient-to-br from-slate-800/80 to-indigo-900/80 backdrop-blur-xl rounded-2xl p-10 border border-yellow-400/30 hover:border-yellow-400/70 transition-all duration-500 cursor-pointer transform hover:-translate-y-3 hover:scale-105 shadow-2xl hover:shadow-yellow-500/25"
                            style={{ minWidth: '320px' }}
                        >
                            {/* Efecto de brillo en hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mr-4 transform group-hover:rotate-6 transition-transform duration-300">
                                        <span className="text-white text-xl font-bold">👨‍💼</span>
                                    </div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                        Administrador
                                    </h2>
                                </div>
                                <p className="text-slate-300 mb-8 leading-relaxed">Accede para visualizar el estado de las brigadas y gestionar el sistema completo.</p>
                                <div className="flex items-center justify-end text-yellow-400 group-hover:text-yellow-300 transition-colors">
                                    <span className="text-lg mr-3 group-hover:mr-6 transition-all duration-300 font-medium">Acceder</span>
                                    <span className="text-2xl transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">→</span>
                                </div>
                            </div>
                        </div>

                        {/* Opción Brigada */}
                        <div
                            onClick={() => setView('brigada')}
                            className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-10 border border-orange-400/30 hover:border-orange-400/70 transition-all duration-500 cursor-pointer transform hover:-translate-y-3 hover:scale-105 shadow-2xl hover:shadow-orange-500/25"
                            style={{ minWidth: '320px' }}
                        >
                            {/* Efecto de brillo en hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center mr-4 transform group-hover:rotate-6 transition-transform duration-300">
                                        <span className="text-white text-xl font-bold">👥</span>
                                    </div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                                        Equipo o Brigada
                                    </h2>
                                </div>
                                <p className="text-slate-300 mb-8 leading-relaxed">Continúa para registrar a tu brigada y todo lo que necesiten para sus operaciones.</p>
                                <div className="flex items-center justify-end text-orange-400 group-hover:text-orange-300 transition-colors">
                                    <span className="text-lg mr-3 group-hover:mr-6 transition-all duration-300 font-medium">Continuar</span>
                                    <span className="text-2xl transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300">→</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si el usuario está logueado, mostrar el dashboard de administrador
    return <AdminDashboard onBack={() => {
        handleLogout();
        setView('landing');
    }} />;

export default App;
