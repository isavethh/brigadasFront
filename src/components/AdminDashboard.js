import React, { useState, useEffect } from 'react';
import { getBrigadas, getBrigadaPDF } from '../services/api';

const AdminDashboard = () => {
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
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
                    <p className="text-white mt-4">Cargando Datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-cyan-300 mb-2">Visualizador de Brigadas</h1>
                    <p className="text-lg text-gray-400">Administra y descarga los reportes de las brigadas activas.</p>
                </div>

                <div className="bg-gray-800/50 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm">
                    <div className="overflow-x-auto rounded-2xl">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">Brigada</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">Comandante a Cargo</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {brigadas.map(brigada => (
                                    <tr key={brigada.id} className="hover:bg-gray-700/60 transition-colors duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-lg text-white">{brigada.nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{brigada.nombrecomandante}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleDownloadPDF(brigada.id, brigada.nombre)}
                                                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-2 px-5 rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                            >
                                                Descargar PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;