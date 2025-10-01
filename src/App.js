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
            <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-amber-900">
                <div className="text-xl text-amber-800 dark:text-amber-100">Cargando...</div>
            </div>
        );
    }

    // Si no hay usuario logueado, mostrar pantalla de elección (Encargado vs Brigada)
    if (!user) {
        if (view === 'login') return <Login onLogin={handleLogin} onBack={() => setView('landing')} />;
        if (view === 'brigada') return <BombForm onBack={() => setView('landing')} />;

        // Pantalla inicial (landing)
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-amber-800 text-white flex flex-col">
                {/* Espacio para el logo */}
                <div className="w-full bg-amber-800/50 py-6 flex justify-center">
                    <div className="w-32 h-20 bg-white/10 rounded-lg flex items-center justify-center border border-amber-400/30">
                        {/* Aquí va tu logo */}
                        <img 
                            src="/path/to/your/logo.png" 
                            alt="Logo de la empresa" 
                            className="max-w-full max-h-full object-contain"
                        />
                        {/* Placeholder mientras no tengas el logo */}
                        <span className="text-amber-200 text-sm">LOGO</span>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold mb-2 text-amber-100">Bienvenido al Sistema de Brigadas</h1>
                        <p className="text-xl text-amber-200">Por favor, selecciona tu rol para continuar.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Opción Encargado */}
                        <div
                            onClick={() => setView('login')}
                            className="group bg-amber-800/40 backdrop-blur-sm rounded-lg p-8 border border-amber-600/50 hover:border-amber-400 hover:bg-amber-700/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20"
                            style={{ minWidth: '300px' }}
                        >
                            <h2 className="text-3xl font-bold text-amber-300 mb-4">Administrador</h2>
                            <p className="text-amber-100 mb-6">Accede para visualizar el estado de las brigadas.</p>
                            <div className="flex items-center justify-end text-amber-300">
                                <span className="text-lg mr-2 group-hover:mr-4 transition-all">Acceder</span>
                                <span className="text-2xl transform group-hover:translate-x-2 transition-transform">→</span>
                            </div>
                        </div>

                        {/* Opción Brigada */}
                        <div
                            onClick={() => setView('brigada')}
                            className="group bg-yellow-800/40 backdrop-blur-sm rounded-lg p-8 border border-yellow-600/50 hover:border-yellow-400 hover:bg-yellow-700/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/20"
                            style={{ minWidth: '300px' }}
                        >
                            <h2 className="text-3xl font-bold text-yellow-300 mb-4">Equipo o Brigada</h2>
                            <p className="text-amber-100 mb-6">Continúa para registrar a tu brigada y todo lo que necesiten.</p>
                            <div className="flex items-center justify-end text-yellow-300">
                                <span className="text-lg mr-2 group-hover:mr-4 transition-all">Continuar</span>
                                <span className="text-2xl transform group-hover:translate-x-2 transition-transform">→</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si el usuario es encargado, mostrar panel de administración
    return (
        <div className="min-h-screen bg-amber-50 dark:bg-amber-900">
            {/* Header con logo */}
            <header className="bg-gradient-to-r from-amber-600 to-yellow-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {/* Contenedor del logo */}
                    <div className="flex justify-center mb-4">
                        <div className="w-24 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                            <img 
                                src="/path/to/your/logo.png" 
                                alt="Logo de la empresa" 
                                className="max-w-full max-h-full object-contain"
                            />
                            {/* Placeholder mientras no tengas el logo */}
                            <span className="text-white text-xs">LOGO</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold text-white">Sistema de Gestión de Brigadas</h1>
                        <div className="flex items-center space-x-4">
                            <span className="text-amber-100">
                                {user.username} ({user.role})
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 px-4">
                {user.role === 'encargado' && <AdminDashboard />}
            </main>
        </div>
    );
}

export default App;
