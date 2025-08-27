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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-md">
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700"
                >
                    <h2 className="text-3xl font-bold mb-8 text-center text-cyan-400">
                        Acceso de Encargado
                    </h2>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2 text-sm" htmlFor="username">
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                            value={credentials.username}
                            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                            required
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-gray-400 mb-2 text-sm" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-cyan-600 transition-all duration-300 disabled:bg-cyan-700/50 transform hover:-translate-y-1"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <button
                    onClick={onBack}
                    className="w-full mt-6 bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:-translate-y-1"
                >
                    Regresar
                </button>
            </div>
        </div>
    );
};

export default Login;