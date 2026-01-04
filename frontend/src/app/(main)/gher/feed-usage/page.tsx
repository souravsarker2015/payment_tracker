'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, ShoppingBag, Calendar, Filter, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';

interface Pond {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
}

interface FishFeed {
    id: number;
    name: string;
    brand?: string;
}

interface FeedUsage {
    id: number;
    pond_id: number;
    feed_id: number;
    date: string;
    quantity: number;
    unit_id: number;
    price_per_unit: number;
    total_cost: number;
    user_id: number;

    // Expanded
    pond_name?: string;
    feed_name?: string;
    feed_brand?: string;
    unit_name?: string;
}

export default function FeedUsagePage() {
    const [usages, setUsages] = useState<FeedUsage[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [feeds, setFeeds] = useState<FishFeed[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterMode, setFilterMode] = useState<'all' | 'year' | 'date_range'>('year');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [selectedPondId, setSelectedPondId] = useState<number | 'all'>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        pond_id: '' as string | number,
        feed_id: '' as string | number,
        date: new Date().toISOString().slice(0, 10),
        quantity: '',
        unit_id: '' as string | number,
        price_per_unit: '',
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [pondsRes, feedsRes, unitsRes] = await Promise.all([
                    api.get('/ponds'),
                    api.get('/fish-feeds'),
                    api.get('/units')
                ]);
                setPonds(pondsRes.data);
                setFeeds(feedsRes.data);
                setUnits(unitsRes.data);
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchUsages();
    }, [filterMode, selectedYear, startDate, endDate, selectedPondId]);

    const fetchUsages = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedPondId !== 'all') params.pond_id = selectedPondId;

            if (filterMode === 'year') {
                params.start_date = `${selectedYear}-01-01T00:00:00`;
                params.end_date = `${selectedYear}-12-31T23:59:59`;
            } else if (filterMode === 'date_range') {
                params.start_date = `${startDate}T00:00:00`;
                params.end_date = `${endDate}T23:59:59`;
            }

            const res = await api.get('/feed-usage', { params });
            setUsages(res.data);
        } catch (error) {
            console.error("Failed to fetch feed usage", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                pond_id: Number(formData.pond_id),
                feed_id: Number(formData.feed_id),
                date: new Date(formData.date).toISOString(),
                quantity: Number(formData.quantity),
                unit_id: Number(formData.unit_id),
                price_per_unit: Number(formData.price_per_unit),
            };

            if (editingId) {
                await api.put(`/feed-usage/${editingId}`, payload);
            } else {
                await api.post('/feed-usage', payload);
            }

            setIsModalOpen(false);
            setEditingId(null);
            fetchUsages();

            // Reset somewhat
            setFormData(prev => ({
                ...prev,
                quantity: '',
                price_per_unit: '',
            }));
        } catch (error) {
            console.error("Failed to record usage", error);
            alert("Failed to record usage.");
        }
    };

    const handleEdit = (usage: FeedUsage) => {
        setEditingId(usage.id);
        setFormData({
            pond_id: usage.pond_id,
            feed_id: usage.feed_id,
            date: new Date(usage.date).toISOString().slice(0, 10),
            quantity: String(usage.quantity),
            unit_id: usage.unit_id,
            price_per_unit: String(usage.price_per_unit),
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await api.delete(`/feed-usage/${id}`);
            setUsages(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            console.error("Failed to delete usage", error);
        }
    };

    // Stats
    const totalCost = usages.reduce((sum, u) => sum + u.total_cost, 0);
    const totalQuantity = usages.reduce((sum, u) => sum + u.quantity, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Daily Feed Consumption (খাবারের ব্যবহার)</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData(prev => ({ ...prev, quantity: '', price_per_unit: '' }));
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Daily Usage
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 flex-wrap items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    <select
                        value={selectedPondId}
                        onChange={(e) => setSelectedPondId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="all">All Ponds</option>
                        {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value as any)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value="year">Current Year</option>
                        <option value="all">All Time</option>
                        <option value="date_range">Date Range</option>
                    </select>

                    {filterMode === 'date_range' && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded-md p-2 text-sm" />
                            <span>to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded-md p-2 text-sm" />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Total Usage Cost</p>
                    <p className="text-2xl font-bold text-red-600">৳{totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Total Quantity Used</p>
                    <p className="text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString()} units</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Records</p>
                    <p className="text-2xl font-bold text-gray-900">{usages.length}</p>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="bg-white p-12 text-center border rounded-xl"><LoadingSpinner /></div>
            ) : usages.length === 0 ? (
                <div className="bg-white p-12 text-center border rounded-xl text-gray-500">No usage records found.</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pond</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {usages.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(u.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.pond_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {u.feed_name} <span className="text-gray-500 text-xs">{u.feed_brand}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {u.quantity} {u.unit_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium text-right">
                                            ৳{u.total_cost.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} title={editingId ? "Edit Daily Feed Usage" : "Record Daily Feed Usage"}>
                <form onSubmit={handleCreateUsage} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pond</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.pond_id}
                            onChange={(e) => setFormData({ ...formData, pond_id: e.target.value })}
                        >
                            <option value="">Select Pond</option>
                            {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Feed Type</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.feed_id}
                            onChange={(e) => setFormData({ ...formData, feed_id: e.target.value })}
                        >
                            <option value="">Select Feed</option>
                            {feeds.map(f => <option key={f.id} value={f.id}>{f.name} {f.brand ? `(${f.brand})` : ''}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                required
                                step="any"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                value={formData.unit_id}
                                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                            >
                                <option value="">Select Unit</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price Per Unit (Average Rate)</label>
                        <input
                            type="number"
                            required
                            step="any"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.price_per_unit}
                            onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Estimated cost based on purchase history.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Record</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
