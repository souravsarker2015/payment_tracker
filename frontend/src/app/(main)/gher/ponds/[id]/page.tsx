'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Package, Users, Plus, Trash2, Edit } from 'lucide-react';
import Modal from '@/components/Modal';

interface PondStats {
    pond: {
        id: number;
        name: string;
        location: string;
        size?: string;
    };
    total_sales: number;
    total_quantity_sold: number;
    total_feed_expense: number;
    total_labor: number;
    total_expenses: number;
    profit_loss: number;
    feed_by_supplier: Array<{
        supplier_id: number;
        supplier_name: string;
        total_amount: number;
        total_quantity: number;
    }>;
    feed_quantity_by_unit: Record<string, number>;
    sales_count: number;
    feed_purchases_count: number;
    labor_entries_count: number;
}

export default function PondDetailPage() {
    const params = useParams();
    const router = useRouter();
    const pondId = params.id;

    const [stats, setStats] = useState<PondStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [feeds, setFeeds] = useState<any[]>([]);
    const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
    const [editingFeed, setEditingFeed] = useState<any>(null);
    const [feedFormData, setFeedFormData] = useState({
        supplier_id: '',
        date: new Date().toISOString().slice(0, 16),
        quantity: '',
        unit_id: '',
        price_per_unit: '',
        description: ''
    });

    useEffect(() => {
        if (pondId) {
            fetchStats();
            fetchSuppliers();
            fetchUnits();
            fetchFeeds();
        }
    }, [pondId]);

    const fetchStats = async () => {
        try {
            const res = await api.get(`/ponds/${pondId}/stats`);
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch pond stats', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const res = await api.get('/units');
            setUnits(res.data);
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    };

    const fetchFeeds = async () => {
        try {
            const res = await api.get(`/pond-feeds?pond_id=${pondId}`);
            setFeeds(res.data);
        } catch (error) {
            console.error('Failed to fetch feeds', error);
        }
    };

    const handleAddFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        const totalAmount = parseFloat(feedFormData.quantity) * parseFloat(feedFormData.price_per_unit);

        try {
            if (editingFeed) {
                // Update existing feed
                await api.put(`/pond-feeds/${editingFeed.id}`, {
                    pond_id: parseInt(pondId as string),
                    supplier_id: parseInt(feedFormData.supplier_id),
                    date: new Date(feedFormData.date).toISOString(),
                    quantity: parseFloat(feedFormData.quantity),
                    unit_id: parseInt(feedFormData.unit_id),
                    price_per_unit: parseFloat(feedFormData.price_per_unit),
                    total_amount: totalAmount,
                    description: feedFormData.description
                });
            } else {
                // Create new feed
                await api.post('/pond-feeds', {
                    pond_id: parseInt(pondId as string),
                    supplier_id: parseInt(feedFormData.supplier_id),
                    date: new Date(feedFormData.date).toISOString(),
                    quantity: parseFloat(feedFormData.quantity),
                    unit_id: parseInt(feedFormData.unit_id),
                    price_per_unit: parseFloat(feedFormData.price_per_unit),
                    total_amount: totalAmount,
                    description: feedFormData.description
                });
            }

            setIsAddFeedOpen(false);
            setEditingFeed(null);
            setFeedFormData({
                supplier_id: '',
                date: new Date().toISOString().slice(0, 16),
                quantity: '',
                unit_id: '',
                price_per_unit: '',
                description: ''
            });
            fetchStats();
            fetchFeeds();
        } catch (error) {
            console.error('Failed to save feed', error);
        }
    };

    const handleEditFeed = (feed: any) => {
        setEditingFeed(feed);
        setFeedFormData({
            supplier_id: feed.supplier_id.toString(),
            date: new Date(feed.date).toISOString().slice(0, 16),
            quantity: feed.quantity.toString(),
            unit_id: feed.unit_id.toString(),
            price_per_unit: feed.price_per_unit.toString(),
            description: feed.description || ''
        });
        setIsAddFeedOpen(true);
    };

    const handleDeleteFeed = async (feedId: number) => {
        if (!confirm('Are you sure you want to delete this feed record?')) return;
        try {
            await api.delete(`/pond-feeds/${feedId}`);
            fetchStats();
            fetchFeeds();
        } catch (error) {
            console.error('Failed to delete feed', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Pond not found</div>
            </div>
        );
    }

    const isProfitable = stats.profit_loss >= 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{stats.pond.name}</h1>
                    <p className="text-sm text-gray-500">{stats.pond.location} {stats.pond.size && `• ${stats.pond.size}`}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Sales</p>
                            <p className="text-2xl font-bold text-green-600">৳{stats.total_sales.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.sales_count} sales</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Feed Expenses</p>
                            <p className="text-2xl font-bold text-orange-600">৳{stats.total_feed_expense.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.feed_purchases_count} purchases</p>
                        </div>
                        <Package className="h-8 w-8 text-orange-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Labor Costs</p>
                            <p className="text-2xl font-bold text-blue-600">৳{stats.total_labor.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.labor_entries_count} entries</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm ${isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Profit/Loss</p>
                            <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                                ৳{Math.abs(stats.profit_loss).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {isProfitable ? 'Profit' : 'Loss'}
                            </p>
                        </div>
                        {isProfitable ? (
                            <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
                        ) : (
                            <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales vs Expenses Bar Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales vs Expenses</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Sales</span>
                                <span className="font-semibold text-green-600">৳{stats.total_sales.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-green-600 h-4 rounded-full transition-all"
                                    style={{ width: `${Math.min((stats.total_sales / (stats.total_sales + stats.total_expenses)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Expenses</span>
                                <span className="font-semibold text-orange-600">৳{stats.total_expenses.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-orange-600 h-4 rounded-full transition-all"
                                    style={{ width: `${Math.min((stats.total_expenses / (stats.total_sales + stats.total_expenses)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed by Supplier */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feed by Supplier</h3>
                    {stats.feed_by_supplier.length > 0 ? (
                        <div className="space-y-3">
                            {stats.feed_by_supplier.map((supplier, idx) => {
                                const percentage = (supplier.total_amount / stats.total_feed_expense) * 100;
                                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'];
                                return (
                                    <div key={supplier.supplier_id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">{supplier.supplier_name}</span>
                                            <span className="font-semibold">৳{supplier.total_amount.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`${colors[idx % colors.length]} h-3 rounded-full transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">No feed purchases yet</p>
                    )}
                </div>
            </div>

            {/* Feed Quantity by Unit */}
            {Object.keys(stats.feed_quantity_by_unit).length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feed Quantity by Unit</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(stats.feed_quantity_by_unit).map(([unit, quantity]) => (
                            <div key={unit} className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-900">{quantity.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">{unit}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feed Purchase Management */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Feed Purchase History (খাবার ক্রয়)</h3>
                    <button
                        onClick={() => setIsAddFeedOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Feed Purchase
                    </button>
                </div>

                {feeds.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Unit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {feeds.map((feed: any) => (
                                    <tr key={feed.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(feed.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {feed.supplier?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {feed.quantity} {feed.unit?.name || ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ৳{feed.price_per_unit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            ৳{feed.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {feed.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditFeed(feed)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFeed(feed.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No feed purchases yet. Add your first purchase!</p>
                )}
            </div>

            {/* Add/Edit Feed Purchase Modal */}
            <Modal
                isOpen={isAddFeedOpen}
                onClose={() => {
                    setIsAddFeedOpen(false);
                    setEditingFeed(null);
                    setFeedFormData({
                        supplier_id: '',
                        date: new Date().toISOString().slice(0, 16),
                        quantity: '',
                        unit_id: '',
                        price_per_unit: '',
                        description: ''
                    });
                }}
                title={editingFeed ? "Edit Feed Purchase" : "Add Feed Purchase"}
            >
                <form onSubmit={handleAddFeed} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={feedFormData.date}
                            onChange={(e) => setFeedFormData({ ...feedFormData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={feedFormData.supplier_id}
                            onChange={(e) => setFeedFormData({ ...feedFormData, supplier_id: e.target.value })}
                        >
                            <option value="">Select supplier</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={feedFormData.quantity}
                                onChange={(e) => setFeedFormData({ ...feedFormData, quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={feedFormData.unit_id}
                                onChange={(e) => setFeedFormData({ ...feedFormData, unit_id: e.target.value })}
                            >
                                <option value="">Select unit</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>{unit.name} {unit.name_bn && `(${unit.name_bn})`}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price per Unit</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={feedFormData.price_per_unit}
                            onChange={(e) => setFeedFormData({ ...feedFormData, price_per_unit: e.target.value })}
                        />
                    </div>
                    {feedFormData.quantity && feedFormData.price_per_unit && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">Total Amount:</p>
                            <p className="text-2xl font-bold text-green-600">
                                ৳{(parseFloat(feedFormData.quantity) * parseFloat(feedFormData.price_per_unit)).toLocaleString()}
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea
                            rows={2}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={feedFormData.description}
                            onChange={(e) => setFeedFormData({ ...feedFormData, description: e.target.value })}
                            placeholder="e.g., Premium fish feed"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                    >
                        {editingFeed ? 'Update Feed Purchase' : 'Add Feed Purchase'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
