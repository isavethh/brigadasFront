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
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue) || parsedValue < 0) {
            // Optionally, provide feedback to the user about invalid input
            return;
        }

        // Optimistically update the UI
        const updatedInventory = inventory.map(item => 
            item.id === id ? { ...item, [field]: parsedValue } : item
        );
        setInventory(updatedInventory);

        try {
            await updateInventoryItem(id, { [field]: parsedValue });
            // No need to call loadInventory() right away due to optimistic update
        } catch (error) {
            console.error('Error updating inventory:', error);
            // If the update fails, revert the change
            loadInventory(); 
        }
    };

    if (loading) return <div className="text-center py-8 text-white">Cargando inventario...</div>;

    return (
        <div className="bg-gray-900 text-white p-4 md:p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-fuchsia-400">Gestión de Inventario</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inventory.map(item => (
                    <div key={item.id} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-fuchsia-500/50 transition-all duration-300 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-xl text-fuchsia-300 truncate">{item.item}</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {item.categoria} {item.talla ? `- Talla: ${item.talla}` : ''}
                            </p>
                        </div>

                        <div className="space-y-4 mt-2">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    Cantidad Total ({item.unidad_medida})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={item.cantidad_total}
                                    onBlur={(e) => handleQuantityChange(item.id, 'cantidad_total', e.target.value)}
                                    onChange={(e) => {
                                        const updatedInventory = inventory.map(invItem => 
                                            invItem.id === item.id ? { ...invItem, cantidad_total: e.target.value } : invItem
                                        );
                                        setInventory(updatedInventory);
                                    }}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    Disponible
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={item.cantidad_disponible}
                                    onBlur={(e) => handleQuantityChange(item.id, 'cantidad_disponible', e.target.value)}
                                    onChange={(e) => {
                                        const updatedInventory = inventory.map(invItem => 
                                            invItem.id === item.id ? { ...invItem, cantidad_disponible: e.target.value } : invItem
                                        );
                                        setInventory(updatedInventory);
                                    }}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryManager;