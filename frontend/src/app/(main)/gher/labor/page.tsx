'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Users } from 'lucide-react';
import Modal from '@/components/Modal';

interface Pond {
    id: number;
    name: string;
}

interface LaborCost {
    id: number;
    date: string;
    amount: number;
    worker_count: number;
    description?: string;
    pond_id?: number;
}

export default function LaborPage() {
    const [laborCosts, setLaborCosts] = useState<LaborCost[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 16),
        amount: '',
        worker_count: '',
        description: '',
        pond_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [laborRes, pondsRes] = await Promise.all([
                api.get('/labor-costs'),
                api.get('/ponds')
            ]);
            setLaborCosts(laborRes.data);
            setPonds(pondsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLabor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/labor-costs', {
                date: new Date(formData.date).toISOString(),
                amount: parseFloat(formData.amount),
                worker_count: parseInt(formData.worker_count),
                description: formData.description,
                pond_id: formData.pond_id ? parseInt(formData.pond_id) : null
            });
            setIsAddModalOpen(false);
            setFormData({
                date: new Date().toISOString().slice(0, 16),
                amount: '',
                worker_count: '',
                description: '',
                pond_id: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to add labor cost', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/labor-costs/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete labor cost', error);
        }
    };

    const totalAmount = laborCosts.reduce((sum, labor) => sum + labor.amount, 0);
    const totalWorkers = laborCosts.reduce((sum, labor) => sum + labor.worker_count, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Labor Costs (শ্রমিক)</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Labor Cost
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500">Total Labor Cost</div>
                    <div className="text-3xl font-bold text-gray-900">৳{totalAmount.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500">Total Worker Days</div>
                    <div className="text-3xl font-bold text-gray-900">{totalWorkers}</div>
                </div>
            </div>

            {/* Labor Costs Table */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workers</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pond</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : laborCosts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No labor costs recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                laborCosts.map((labor) => {
                                    const pond = ponds.find(p => p.id === labor.pond_id);
                                    return (
                                        <tr key={labor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(labor.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                                                    {labor.worker_count}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {pond?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {labor.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                                ৳{labor.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDelete(labor.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Labor Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Labor Cost"
            >
                <form onSubmit={handleAddLabor} className="space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700">Number of Workers (জন)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.worker_count}
                            onChange={(e) => setFormData({ ...formData, worker_count: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount (টাকা)</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pond (Optional)</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.pond_id}
                            onChange={(e) => setFormData({ ...formData, pond_id: e.target.value })}
                        >
                            <option value="">General</option>
                            {ponds.map((pond) => (
                                <option key={pond.id} value={pond.id}>
                                    {pond.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                    >
                        Add Labor Cost
                    </button>
                </form>
            </Modal>
        </div>
    );
}
