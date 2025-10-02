import React, { useState } from 'react';
import { login } from '../services/auth';
import alas from '../images/alas2.png';

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
            {/* 📱 ELEMENTOS DECORATIVOS RESPONSIVE */}
            <div className="absolute inset-0">
                <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-40 sm:w-72 h-40 sm:h-72 bg-yellow-400/10 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-orange-400/10 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-80 h-32 sm:h-80 bg-amber-400/5 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* 📱 LOGO RESPONSIVE */}
            <div className="relative w-full flex justify-center items-start mb-2 sm:mb-6">
  <div className="group relative">
    <img 
      src={alas} 
      alt="Logo" 
      className="w-20 h-16 sm:w-40 sm:h-40 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-all duration-500" 
    />
  </div>
</div>
            {/* 📱 CONTENEDOR PRINCIPAL RESPONSIVE */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in min-h-[calc(100vh-100px)]">
                {/* 📱 BOTÓN DE REGRESAR RESPONSIVE */}
                {onBack && (
                    <div className="w-full max-w-md mb-4 sm:mb-6 animate-slide-up">
                        <button
                            onClick={onBack}
                            className="group flex items-center text-yellow-400 hover:text-yellow-300 transition-all duration-300 text-sm sm:text-base"
                        >
                            <span className="text-lg sm:text-xl mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                            <span className="font-medium">Volver</span>
                        </button>
                    </div>
                )}

                {/* 📱 FORMULARIO DE LOGIN COMPLETAMENTE RESPONSIVE */}
                <div className="group relative bg-slate-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-10 border border-yellow-400/30 shadow-2xl w-full max-w-sm sm:max-w-md animate-slide-up-delay">
                    {/* Efecto de brillo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl"></div>
                    
                    <div className="relative z-10">
                        {/* 📱 TÍTULO RESPONSIVE */}
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="flex items-center justify-center mb-3 sm:mb-4">
                                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-lg sm:text-xl font-bold">🔐</span>
                                </div>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                                Iniciar Sesión
                            </h2>
                            <p className="text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Accede como administrador</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {/* 📱 ERROR MESSAGE RESPONSIVE */}
                            {error && (
                                <div className="bg-red-500/20 border border-red-400/50 text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg backdrop-blur-sm animate-shake">
                                    <div className="flex items-center text-sm sm:text-base">
                                        <span className="text-red-400 mr-2 text-sm sm:text-base">⚠️</span>
                                        <span className="break-words">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* 📱 CAMPO USUARIO RESPONSIVE */}
                            <div className="space-y-1 sm:space-y-2">
                                <label className="block text-slate-300 font-medium text-sm sm:text-base">
                                    Usuario
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                                        placeholder="Ingresa tu usuario"
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                                        required
                                    />
                                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm sm:text-base">
                                        👤
                                    </div>
                                </div>
                            </div>

                            {/* 📱 CAMPO CONTRASEÑA RESPONSIVE */}
                            <div className="space-y-1 sm:space-y-2">
                                <label className="block text-slate-300 font-medium text-sm sm:text-base">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 backdrop-blur-sm text-sm sm:text-base"
                                        placeholder="Ingresa tu contraseña"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                        required
                                    />
                                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm sm:text-base">
                                        🔒
                                    </div>
                                </div>
                            </div>

                            {/* 📱 BOTÓN DE SUBMIT COMPLETAMENTE RESPONSIVE */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold py-3 sm:py-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-sm sm:text-base"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                                        <span className="text-sm sm:text-base">Iniciando sesión...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <span className="mr-2 group-hover:mr-3 transition-all duration-300 text-sm sm:text-base">Iniciar Sesión</span>
                                        <span className="transform group-hover:translate-x-1 transition-transform duration-300 text-sm sm:text-base">→</span>
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 📱 ESPACIADO ADICIONAL PARA MÓVILES */}
                <div className="h-4 sm:h-8"></div>
            </div>

            {/* 📱 ANIMACIONES CSS RESPONSIVE */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slide-up-delay {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                
                .animate-slide-up {
                    animation: slide-up 0.8s ease-out;
                }
                
                .animate-slide-up-delay {
                    animation: slide-up-delay 1s ease-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                /* 📱 MEJORAS ADICIONALES PARA PANTALLAS MUY PEQUEÑAS */
                @media (max-width: 360px) {
                    .group.relative {
                        margin: 0 0.5rem;
                    }
                }
                
                /* 📱 ALTURA MÍNIMA PARA EVITAR SCROLL INNECESARIO */
                @media (max-height: 600px) {
                    .min-h-screen {
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;