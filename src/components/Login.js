import React, { useState } from 'react';
import { login } from '../services/auth';

const Login = ({ onLogin, onBack }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { token, user } = await login(credentials);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            onLogin(user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                            src="/path/to/your/logo.png" 
                            alt="Logo de la empresa" 
                            className="max-w-full max-h-full object-contain"
                        />
                        <span className="text-slate-700 font-bold text-base tracking-wide">LOGO</span>
                    </div>
                </div>
            </div>

            {/* Contenedor principal del login */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
                {/* Botón de regresar */}
                {onBack && (
                    <div className="w-full max-w-md mb-6 animate-slide-up">
                        <button
                            onClick={onBack}
                            className="group flex items-center text-yellow-400 hover:text-yellow-300 transition-all duration-300"
                        >
                            <span className="text-xl mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                            <span className="font-medium">Volver</span>
                        </button>
                    </div>
                )}

                {/* Formulario de login */}
                <div className="group relative bg-slate-800/80 backdrop-blur-xl rounded-2xl p-10 border border-yellow-400/30 shadow-2xl w-full max-w-md animate-slide-up-delay">
                    {/* Efecto de brillo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                    
                    <div className="relative z-10">
                        {/* Título */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">🔐</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                Iniciar Sesión
                            </h2>
                            <p className="text-slate-400 mt-2">Accede como administrador</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error message */}
                            {error && (
                                <div className="bg-red-500/20 border border-red-400/50 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm animate-shake">
                                    <div className="flex items-center">
                                        <span className="text-red-400 mr-2">⚠️</span>
                                        {error}
                                    </div>
                                </div>
                            )}

                            {/* Campo Usuario */}
                            <div className="space-y-2">
                                <label className="block text-slate-300 font-medium">
                                    Usuario
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Ingresa tu usuario"
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                                        required
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                        👤
                                    </div>
                                </div>
                            </div>

                            {/* Campo Contraseña */}
                            <div className="space-y-2">
                                <label className="block text-slate-300 font-medium">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 backdrop-blur-sm"
                                        placeholder="Ingresa tu contraseña"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                        required
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                        🔒
                                    </div>
                                </div>
                            </div>

                            {/* Botón de submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                        Iniciando sesión...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <span className="mr-2 group-hover:mr-3 transition-all duration-300">Iniciar Sesión</span>
                                        <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </div>
                                )}
                            </button>
                        </form>

                        {/* Link adicional */}
                        <div className="mt-6 text-center">
                            <p className="text-slate-400 text-sm">
                                ¿Problemas para acceder? 
                                <span className="text-yellow-400 hover:text-yellow-300 ml-1 cursor-pointer transition-colors">
                                    Contacta al administrador
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
