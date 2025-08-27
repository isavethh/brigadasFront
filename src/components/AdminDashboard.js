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
            link.setAttribute('download', `formulario-${brigadaName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Error al descargar el PDF: ' + error.message);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No disponible';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) return <div className="text-center py-8 text-white">Cargando brigadas...</div>;

    return (
        <div className="bg-gray-900 text-white p-4 md:p-8 rounded-2xl shadow-2xl border border-gray-700 mt-10">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">Registros de Brigadas</h2>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Brigada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Comandante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha de Registro</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                        {brigadas.map(brigada => (
                            <tr key={brigada.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{brigada.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{brigada.nombrecomandante}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(brigada.fecha_creacion)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleDownloadPDF(brigada.id, brigada.nombre)}
                                        className="bg-cyan-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-cyan-600 transition-all duration-300 transform hover:-translate-y-0.5"
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
    );
};

export default AdminDashboard;