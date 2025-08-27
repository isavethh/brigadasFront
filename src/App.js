import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import BombForm from './components/BombForm';

import AdminDashboard from './components/AdminDashboard';
import { getCurrentUser, logout } from './services/auth';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('landing'); // 'landing' | 'login' | 'brigada'
//hola
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-xl text-gray-700 dark:text-white">Cargando...</div>
            </div>
        );
    }

    // Si no hay usuario logueado, mostrar pantalla de elección (Encargado vs Brigada)
    if (!user) {
        if (view === 'login') return <Login onLogin={handleLogin} onBack={() => setView('landing')} />;
        if (view === 'brigada') return <BombForm />; // ocupa min-h-screen completo

        // Pantalla inicial (landing)
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-2">Bienvenido al Sistema de Brigadas</h1>
                    <p className="text-xl text-gray-400">Por favor, selecciona tu rol para continuar.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Opción Encargado */}
                    <div
                        onClick={() => setView('login')}
                        className="group bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-cyan-400 transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                        style={{ minWidth: '300px' }}
                    >
                        <h2 className="text-3xl font-bold text-cyan-400 mb-4">Encargado</h2>
                        <p className="text-gray-400 mb-6">Accede para gestionar inventario y visualizar el estado de las brigadas.</p>
                        <div className="flex items-center justify-end text-cyan-400">
                            <span className="text-lg mr-2 group-hover:mr-4 transition-all">Acceder</span>
                            <span className="text-2xl transform group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>

                    {/* Opción Brigada */}
                    <div
                        onClick={() => setView('brigada')}
                        className="group bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-fuchsia-400 transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                        style={{ minWidth: '300px' }}
                    >
                        <h2 className="text-3xl font-bold text-fuchsia-400 mb-4">Brigada</h2>
                        <p className="text-gray-400 mb-6">Continúa para registrar el uso de bombas y equipamiento en campo.</p>
                        <div className="flex items-center justify-end text-fuchsia-400">
                            <span className="text-lg mr-2 group-hover:mr-4 transition-all">Continuar</span>
                            <span className="text-2xl transform group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si el usuario es encargado, mostrar panel de administración
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Sistema de Gestión de Brigadas</h1>
                    <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300">
              {user.username} ({user.role})
            </span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        >
                            Cerrar Sesión
                        </button>
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