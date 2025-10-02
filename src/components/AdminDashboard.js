import React, { useState, useEffect } from 'react';
import { getBrigadas, getBrigadaPDF } from '../services/api';

const AdminDashboard = ({ onBack }) => {
    const [brigadas, setBrigadas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadBrigadas(); }, []);

    const loadBrigadas = async () => {
        try {
            const data = await getBrigadas();
            setBrigadas(data);
        } catch (error) {
            console.error('Error loading brigadas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (brigadaId, brigadaName) => {
        try {
            const pdfBlob = await getBrigadaPDF(brigadaId);
            const url = window.URL.createObjectURL(new Blob([pdfBlob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte-${brigadaName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error al descargar el PDF: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center p-4">
                <div className="relative">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 sm:w-20 h-16 sm:h-20 border-4 border-orange-400 border-b-transparent rounded-full animate-spin animate-reverse"></div>
                    <div className="mt-4 sm:mt-6 text-lg sm:text-xl text-yellow-300 animate-pulse text-center font-medium">Cargando Datos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-hidden">

            {/* Efectos de fondo decorativos */}
            <div className="absolute inset-0">
                <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-40 sm:w-72 h-40 sm:h-72 bg-yellow-400/10 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-orange-400/10 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-80 h-32 sm:h-80 bg-amber-400/5 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Título principal y botón volver (tú lo defines arriba en App.js, así que aquí NO está el botón) */}
            <div className="relative container mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14 animate-fade-in">
                        <h1 className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent animate-gradient-x leading-tight">
                            Visualizador de Brigadas
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-slate-300 px-4">Administra y descarga los reportes de las brigadas activas.</p>
                    </div>

                    <div className="group relative bg-slate-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-yellow-400/30 shadow-2xl animate-slide-up-delay">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl sm:rounded-2xl"></div>
                        <div className="relative z-10 overflow-hidden rounded-xl sm:rounded-2xl">
                            {brigadas.length === 0 ? (
                                <div className="text-center py-12 sm:py-16 px-4">
                                    <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                        <span className="text-white text-2xl sm:text-3xl">📋</span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-300 mb-2">No hay brigadas registradas</h3>
                                    <p className="text-sm sm:text-base text-slate-400">Las brigadas aparecerán aquí una vez que se registren</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop: Tabla */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-slate-700/50">
                                                <tr>
                                                    <th className="px-4 lg:px-8 py-4 lg:py-6 text-left text-xs sm:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                                        Brigada
                                                    </th>
                                                    <th className="px-4 lg:px-8 py-4 lg:py-6 text-left text-xs sm:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                                        Comandante a Cargo
                                                    </th>
                                                    <th className="px-4 lg:px-8 py-4 lg:py-6 text-right text-xs sm:text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                                        Acciones
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-600/50">
                                                {brigadas.map((brigada, index) => (
                                                    <tr
                                                        key={brigada.id}
                                                        className="hover:bg-slate-700/30 transition-all duration-300 group/row"
                                                        style={{ animationDelay: `${index * 0.1}s` }}
                                                    >
                                                        <td className="px-4 lg:px-8 py-4 lg:py-6 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center mr-3 lg:mr-4 transform group-hover/row:rotate-6 transition-transform duration-300">
                                                                    <span className="text-white font-bold text-xs lg:text-sm">
                                                                        {brigada.nombre.charAt(0)}
                                                                    </span>
                                                                </div>
                                                                <div className="font-bold text-lg lg:text-xl text-white group-hover/row:text-yellow-300 transition-colors">
                                                                    {brigada.nombre}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 lg:px-8 py-4 lg:py-6 whitespace-nowrap">
                                                            <div className="text-slate-300 text-base lg:text-lg font-medium">
                                                                {brigada.nombrecomandante}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 lg:px-8 py-4 lg:py-6 whitespace-nowrap text-right">
                                                            <button
                                                                onClick={() => handleDownloadPDF(brigada.id, brigada.nombre)}
                                                                className="group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-2 lg:py-3 px-4 lg:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 text-sm lg:text-base"
                                                            >
                                                                <div className="flex items-center">
                                                                    <span className="mr-2 group-hover:mr-3 transition-all duration-300">📄</span>
                                                                    <span>Descargar PDF</span>
                                                                </div>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Móvil: Cards */}
                                    <div className="md:hidden p-4 space-y-4">
                                        {brigadas.map((brigada, index) => (
                                            <div
                                                key={brigada.id}
                                                className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30 hover:bg-slate-700/70 transition-all duration-300"
                                                style={{ animationDelay: `${index * 0.1}s` }}
                                            >
                                                <div className="flex items-center mb-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center mr-3">
                                                        <span className="text-white font-bold text-sm">{brigada.nombre.charAt(0)}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg text-white">{brigada.nombre}</h3>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <p className="text-xs text-yellow-400 font-medium uppercase tracking-wider mb-1">Comandante</p>
                                                    <p className="text-slate-300 text-base font-medium">{brigada.nombrecomandante}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadPDF(brigada.id, brigada.nombre)}
                                                    className="w-full group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <span className="mr-2 group-hover:mr-3 transition-all duration-300 text-lg">📄</span>
                                                        <span className="text-sm">Descargar PDF</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {brigadas.length > 0 && (
                        <div className="mt-8 text-center animate-fade-in-delay">
                            <p className="text-slate-400 text-base sm:text-lg">
                                Total de brigadas registradas:
                                <span className="text-yellow-400 font-bold ml-2">
                                    {brigadas.length}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
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
                @keyframes fade-in-delay {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradient-x {
                    0%, 100% { background-size: 200% 200%; background-position: left center; }
                    50% { background-size: 200% 200%; background-position: right center; }
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out; }
                .animate-slide-up { animation: slide-up 0.8s ease-out; }
                .animate-slide-up-delay { animation: slide-up-delay 1s ease-out; }
                .animate-fade-in-delay { animation: fade-in-delay 1.2s ease-out; }
                .animate-gradient-x { animation: gradient-x 3s ease-in-out infinite; }
                .animate-reverse { animation-direction: reverse; }
                @media (max-width: 360px) {
                    .container { padding-left: 1rem; padding-right: 1rem; }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
