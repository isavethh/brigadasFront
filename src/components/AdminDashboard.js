import React, { useState, useEffect } from 'react';
import { getBrigadas, getBrigadaPDF } from '../services/api';
import alas from '../images/alas.png';

const AdminDashboard = ({ onBack }) => {
    const [brigadas, setBrigadas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBrigadas();
    }, []);

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
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-orange-400 border-b-transparent rounded-full animate-spin animate-reverse"></div>
                    <div className="mt-6 text-xl text-yellow-300 animate-pulse text-center font-medium">Cargando Datos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 text-white relative overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Header con logo y botón de volver */}
            <div className="relative p-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center animate-slide-up">
                        <div className="w-12 h-12 bg-white/95 rounded-lg flex items-center justify-center shadow-lg mr-4">
                            <img src={alas} alt="logo" className="h-8 w-8 object-contain" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                            Panel de Administración
                        </h2>
                    </div>
                    
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="group bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 animate-slide-up"
                        >
                            <div className="flex items-center">
                                <span className="text-lg mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
                                <span className="group-hover:mr-1 transition-all duration-300">Volver al inicio</span>
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido principal */}
            <div className="relative container mx-auto px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Título principal */}
                    <div className="text-center mb-12 animate-fade-in">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent animate-gradient-x leading-tight pb-2">
                            Visualizador de Brigadas
                        </h1>
                        <p className="text-xl text-slate-300">Administra y descarga los reportes de las brigadas activas.</p>
                    </div>

                    {/* Contenedor de la tabla */}
                    <div className="group relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-yellow-400/30 shadow-2xl animate-slide-up-delay">
                        {/* Efecto de brillo sutil */}
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        
                        <div className="relative z-10 overflow-hidden rounded-2xl">
                            {brigadas.length === 0 ? (
                                /* Estado vacío */
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="text-white text-3xl">📋</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-300 mb-2">No hay brigadas registradas</h3>
                                    <p className="text-slate-400">Las brigadas aparecerán aquí una vez que se registren</p>
                                </div>
                            ) : (
                                /* Tabla de brigadas */
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="px-8 py-6 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                                    Brigada
                                                </th>
                                                <th className="px-8 py-6 text-left text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                                    Comandante a Cargo
                                                </th>
                                                <th className="px-8 py-6 text-right text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-600/50">
                                            {brigadas.map((brigada, index) => (
                                                <tr 
                                                    key={brigada.id} 
                                                    className="hover:bg-slate-700/30 transition-all duration-300 group/row"
                                                    style={{
                                                        animationDelay: `${index * 0.1}s`
                                                    }}
                                                >
                                                    <td className="px-8 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center mr-4 transform group-hover/row:rotate-6 transition-transform duration-300">
                                                                <span className="text-white font-bold text-sm">
                                                                    {brigada.nombre.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div className="font-bold text-xl text-white group-hover/row:text-yellow-300 transition-colors">
                                                                {brigada.nombre}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 whitespace-nowrap">
                                                        <div className="text-slate-300 text-lg font-medium">
                                                            {brigada.nombrecomandante}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleDownloadPDF(brigada.id, brigada.nombre)}
                                                            className="group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
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
                            )}
                        </div>
                    </div>

                    {/* Información adicional */}
                    {brigadas.length > 0 && (
                        <div className="mt-8 text-center animate-fade-in-delay">
                            <p className="text-slate-400 text-lg">
                                Total de brigadas registradas: 
                                <span className="text-yellow-400 font-bold ml-2">
                                    {brigadas.length}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
