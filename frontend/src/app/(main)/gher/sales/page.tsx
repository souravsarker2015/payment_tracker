'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, X } from 'lucide-react';
import Modal from '@/components/Modal';

interface Pond {
    id: number;
    name: string;
}

interface SaleItem {
    pond_id: number;
    weight_kg: number;
    rate_per_kg: number;
    amount: number;
}

interface FishSale {
    id: number;
    date: string;
    buyer_name?: string;
    total_amount: number;
    total_weight?: number;
    items: any[];
}

export default function SalesPage() {
    const [sales, setSales] = useState<FishSale[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 16),
        buyer_name: ''
    });

    const [saleItems, setSaleItems] = useState<SaleItem[]>([{
        pond_id: 0,
        weight_kg: 0,
        rate_per_kg: 0,
        amount: 0
    }]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [salesRes, pondsRes] = await Promise.all([
                api.get('/fish-sales'),
                api.get('/ponds')
            ]);
            setSales(salesRes.data);
            setPonds(pondsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const addSaleItem = () => {
        setSaleItems([...saleItems, {
            pond_id: 0,
            weight_kg: 0,
            rate_per_kg: 0,
            amount: 0
        }]);
    };

    const removeSaleItem = (index: number) => {
        if (saleItems.length === 1) return;
        setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    const updateSaleItem = (index: number, field: keyof SaleItem, value: any) => {
        const updated = [...saleItems];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate amount
        if (field === 'weight_kg' || field === 'rate_per_kg') {
            updated[index].amount = updated[index].weight_kg * updated[index].rate_per_kg;
        }

        setSaleItems(updated);
    };

    const handleAddSale = async (e: React.FormEvent) => {
        e.preventDefault();

        const totalAmount = saleItems.reduce((sum, item) => sum + item.amount, 0);
        const totalWeight = saleItems.reduce((sum, item) => sum + item.weight_kg, 0);

        try {
            await api.post('/fish-sales', {
                date: new Date(formData.date).toISOString(),
                buyer_name: formData.buyer_name,
                total_amount: totalAmount,
                total_weight: totalWeight,
                items: saleItems
            });

            setIsAddModalOpen(false);
            setFormData({
                date: new Date().toISOString().slice(0, 16),
                buyer_name: ''
            });
            setSaleItems([{
                pond_id: 0,
                weight_kg: 0,
                rate_per_kg: 0,
                amount: 0
            }]);
            fetchData();
        } catch (error) {
            console.error('Failed to add sale', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/fish-sales/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete sale', error);
        }
    };

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalWeight = sales.reduce((sum, sale) => sum + (sale.total_weight || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Fish Sales (মাছ বিক্রি)</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sale
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="text-3xl font-bold text-green-600">৳{totalRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500">Total Weight Sold</div>
                    <div className="text-3xl font-bold text-gray-900">{totalWeight.toFixed(2)} kg</div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : sales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No sales recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(sale.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {sale.buyer_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {sale.total_weight?.toFixed(2) || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                            ৳{sale.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleDelete(sale.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Sale Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Fish Sale"
            >
                <form onSubmit={handleAddSale} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Buyer Name (Optional)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.buyer_name}
                            onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-gray-700">Sale Items</label>
                            <button
                                type="button"
                                onClick={addSaleItem}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                + Add Pond
                            </button>
                        </div>

                        {saleItems.map((item, index) => (
                            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg relative">
                                {saleItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSaleItem(index)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700">Pond</label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                            value={item.pond_id}
                                            onChange={(e) => updateSaleItem(index, 'pond_id', parseInt(e.target.value))}
                                        >
                                            <option value={0}>Select pond</option>
                                            {ponds.map((pond) => (
                                                <option key={pond.id} value={pond.id}>
                                                    {pond.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Weight (kg)</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                            value={item.weight_kg || ''}
                                            onChange={(e) => updateSaleItem(index, 'weight_kg', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Rate/kg</label>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                            value={item.rate_per_kg || ''}
                                            onChange={(e) => updateSaleItem(index, 'rate_per_kg', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700">Amount</label>
                                        <div className="mt-1 text-lg font-bold text-green-600">
                                            ৳{item.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                            <span className="text-2xl font-bold text-green-600">
                                ৳{saleItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                    >
                        Add Sale
                    </button>
                </form>
            </Modal>
        </div>
    );
}
