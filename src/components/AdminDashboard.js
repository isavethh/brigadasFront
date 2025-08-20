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

    if (loading) return <div className="text-center py-8">Cargando brigadas...</div>;

    return (
        <div className="container mx-auto p-6 mt-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Panel de Encargado</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Brigada
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Comandante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Fecha de Registro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {brigadas.map(brigada => (
                        <tr key={brigada.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{brigada.nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">{brigada.nombrecomandante}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(brigada.fecha_creacion).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                    onClick={() => handleDownloadPDF(brigada.id, brigada.nombre)}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
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