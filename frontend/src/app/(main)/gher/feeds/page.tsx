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

interface Supplier {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
}

interface PondFeed {
    id: number;
    pond_id: number | null;
    supplier_id: number;
    date: string;
    quantity: number;
    unit_id: number;
    price_per_unit: number;
    total_amount: number;
    description: string | null;
}

export default function FeedPurchasesPage() {
    const [feeds, setFeeds] = useState<PondFeed[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterMode, setFilterMode] = useState<'year' | 'year_range' | 'date_range'>('year');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
    const [endYear, setEndYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [selectedPondId, setSelectedPondId] = useState<number | 'all'>('all');
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        pond_id: '' as string | number,
        supplier_id: '' as string | number,
        date: new Date().toISOString().slice(0, 10),
        quantity: '',
        unit_id: '' as string | number,
        price_per_unit: '',
        description: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pondsRes, suppliersRes, unitsRes] = await Promise.all([
                    api.get('/ponds'),
                    api.get('/suppliers'),
                    api.get('/units')
                ]);
                setPonds(pondsRes.data);
                setSuppliers(suppliersRes.data);
                setUnits(unitsRes.data);

                // Generate available years
                const currentYear = new Date().getFullYear();
                const years = Array.from({ length: 11 }, (_, i) => currentYear - i);
                setAvailableYears(years);
            } catch (error) {
                console.error('Failed to fetch initial data', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        fetchFeeds();
    }, [filterMode, selectedYear, startYear, endYear, startDate, endDate, selectedPondId]);

    const handleCreateFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                pond_id: formData.pond_id === '' ? null : Number(formData.pond_id),
                supplier_id: Number(formData.supplier_id),
                date: new Date(formData.date).toISOString(),
                quantity: Number(formData.quantity),
                unit_id: Number(formData.unit_id),
                price_per_unit: Number(formData.price_per_unit),
                total_amount: Number(formData.quantity) * Number(formData.price_per_unit),
                description: formData.description
            };

            await api.post('/pond-feeds', payload);
            setIsModalOpen(false);
            fetchFeeds();

            // Reset form but keep some defaults
            setFormData({
                pond_id: '',
                supplier_id: suppliers[0]?.id || '',
                date: new Date().toISOString().slice(0, 10),
                quantity: '',
                unit_id: units[0]?.id || '',
                price_per_unit: '',
                description: ''
            });
        } catch (error) {
            console.error('Failed to create feed purchase', error);
            alert('Failed to create purchase. Please check your inputs.');
        }
    };

    const fetchFeeds = async () => {
        setLoading(true);
        try {
            let params: any = {};

            // Date filtering
            if (filterMode === 'year') {
                params.start_date = `${selectedYear}-01-01T00:00:00`;
                params.end_date = `${selectedYear}-12-31T23:59:59`;
            } else if (filterMode === 'year_range') {
                params.start_date = `${startYear}-01-01T00:00:00`;
                params.end_date = `${endYear}-12-31T23:59:59`;
            } else if (filterMode === 'date_range') {
                params.start_date = `${startDate}T00:00:00`;
                params.end_date = `${endDate}T23:59:59`;
            }

            // Pond filtering
            if (selectedPondId !== 'all') {
                params.pond_id = selectedPondId;
            }

            const res = await api.get('/pond-feeds', { params });
            setFeeds(res.data);
        } catch (error) {
            console.error('Failed to fetch feed purchases', error);
        } finally {
            setLoading(false);
        }
    };

    const getPondName = (id: number | null) => {
        if (id === null) return 'General Stock (No Pond)';
        return ponds.find(p => p.id === id)?.name || 'Unknown Pond';
    };

    const getSupplierName = (id: number) => {
        return suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';
    };

    const getUnitName = (id: number) => {
        return units.find(u => u.id === id)?.name || 'Unknown Unit';
    };

    const totalAmount = feeds.reduce((sum, feed) => sum + feed.total_amount, 0);
    const totalQuantity = feeds.reduce((sum, feed) => sum + feed.quantity, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Feed Purchases (খাবার ক্রয়)</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Purchase
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filters</span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                    {/* Pond Filter */}
                    <div className="w-full md:w-auto">
                        <select
                            value={selectedPondId}
                            onChange={(e) => setSelectedPondId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="w-full md:w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        >
                            <option value="all">All Ponds</option>
                            {ponds.map(pond => (
                                <option key={pond.id} value={pond.id}>{pond.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Mode Selector */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <select
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value as any)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        >
                            <option value="year">Single Year</option>
                            <option value="year_range">Year Range</option>
                            <option value="date_range">Custom Date Range</option>
                        </select>
                    </div>

                    {/* Year Filter */}
                    {filterMode === 'year' && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Year Range Filter */}
                    {filterMode === 'year_range' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={startYear}
                                onChange={(e) => setStartYear(parseInt(e.target.value))}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                            <span className="text-gray-500">to</span>
                            <select
                                value={endYear}
                                onChange={(e) => setEndYear(parseInt(e.target.value))}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            >
                                {availableYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Custom Date Range Filter */}
                    {filterMode === 'date_range' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-red-600">৳{totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Total Quantity</p>
                    <p className="text-2xl font-bold text-blue-600">{totalQuantity.toLocaleString()} units</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500">Purchases Count</p>
                    <p className="text-2xl font-bold text-gray-900">{feeds.length}</p>
                </div>
            </div>

            {/* Feed List */}
            {loading ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                    <LoadingSpinner message="Loading feed purchases..." />
                </div>
            ) : feeds.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No feed purchases found matching your filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pond</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {feeds.map((feed) => (
                                    <tr key={feed.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(feed.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {getPondName(feed.pond_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {getSupplierName(feed.supplier_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {feed.quantity} {getUnitName(feed.unit_id)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            ৳{feed.price_per_unit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                                            ৳{feed.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {feed.description || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Create Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record Feed Purchase"
            >
                <form onSubmit={handleCreateFeed} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pond (For which pond?)</label>
                        <select
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={formData.pond_id}
                            onChange={(e) => setFormData({ ...formData, pond_id: e.target.value })}
                        >
                            <option value="">General Stock (No Pond Assigned)</option>
                            {ponds.map(pond => (
                                <option key={pond.id} value={pond.id}>{pond.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Leave empty if purchasing for stock or undecided.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={formData.supplier_id}
                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map(supplier => (
                                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="block w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={formData.unit_id}
                                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                            >
                                <option value="">Select Unit</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price per Unit (Rate)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">৳</span>
                            </div>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="block w-full pl-7 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={formData.price_per_unit}
                                onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                        <span className="text-lg font-bold text-indigo-600">
                            ৳{((Number(formData.quantity) || 0) * (Number(formData.price_per_unit) || 0)).toLocaleString()}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g., Feed brand, special notes"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Record Purchase
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
