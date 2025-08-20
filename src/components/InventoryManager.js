import React, { useState, useEffect } from 'react';
import { getInventory, updateInventoryItem } from '../services/api';

const InventoryManager = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            const data = await getInventory();
            setInventory(data);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (id, field, value) => {
        try {
            await updateInventoryItem(id, { [field]: value });
            loadInventory();
        } catch (error) {
            console.error('Error updating inventory:', error);
        }
    };

    if (loading) return <div className="text-center py-8">Cargando inventario...</div>;

    return (
        <div className="container mx-auto p-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{item.item}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {item.categoria} {item.talla ? `- Talla: ${item.talla}` : ''}
                        </p>

                        <div className="mb-3">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                                Cantidad Total ({item.unidad_medida})
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={item.cantidad_total}
                                onChange={(e) => handleQuantityChange(item.id, 'cantidad_total', parseInt(e.target.value))}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                                Disponible
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={item.cantidad_disponible}
                                onChange={(e) => handleQuantityChange(item.id, 'cantidad_disponible', parseInt(e.target.value))}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryManager;