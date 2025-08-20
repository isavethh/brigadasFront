import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import BombForm from './components/BombForm';
import InventoryManager from './components/InventoryManager';
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="text-xl text-gray-700 dark:text-white">Cargando...</div>
            </div>
        );
    }

    // Si no hay usuario logueado, mostrar pantalla de elección (Encargado vs Brigada)
    if (!user) {
        if (view === 'login') return <Login onLogin={handleLogin} />;
        if (view === 'brigada') return <BombForm />; // ocupa min-h-screen completo

        // Pantalla inicial (landing)
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-full max-w-2xl border border-white p-8">
                    <h1 className="text-2xl font-semibold mb-6">Sistema de Brigadas</h1>
                    <p className="text-gray-400 mb-8">Elige cómo quieres continuar</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setView('login')}
                            className="w-full border border-white px-4 py-3 uppercase tracking-wide hover:bg-white hover:text-black transition-colors"
                            aria-label="Acceder como encargado"
                        >
                            Acceder como Encargado
                        </button>
                        <button
                            onClick={() => setView('brigada')}
                            className="w-full border border-white px-4 py-3 uppercase tracking-wide hover:bg-white hover:text-black transition-colors"
                            aria-label="Continuar como brigada"
                        >
                            Continuar como Brigada
                        </button>
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
                {user.role === 'encargado' && (
                    <>
                        <InventoryManager />
                        <AdminDashboard />
                    </>
                )}
            </main>
        </div>
    );
}

export default App;