'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, ShoppingBag, Calendar, Filter, X, Tag, Settings } from 'lucide-react';
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

interface FishFeed {
    id: number;
    name: string;
    brand?: string;
    description?: string;
}

interface PondFeedPurchase {
    id: number;
    pond_id: number | null;
    supplier_id: number;
    feed_id?: number | null;
    date: string;
    quantity: number;
    unit_id: number;
    price_per_unit: number;
    total_amount: number;
    description: string | null;
    // Expanded fields from API
    pond_name?: string;
    supplier_name?: string;
    unit_name?: string;
    feed_name?: string;
    feed_brand?: string;
}

export default function FeedPurchasesPage() {
    const [purchases, setPurchases] = useState<PondFeedPurchase[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [feedCatalog, setFeedCatalog] = useState<FishFeed[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterMode, setFilterMode] = useState<'all' | 'year' | 'year_range' | 'date_range'>('year');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
    const [endYear, setEndYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [selectedPondId, setSelectedPondId] = useState<number | 'all'>('all');
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Modals
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Forms
    const [purchaseForm, setPurchaseForm] = useState({
        pond_id: '' as string | number,
        supplier_id: '' as string | number,
        feed_id: '' as string | number,
        date: new Date().toISOString().slice(0, 10),
        quantity: '',
        unit_id: '' as string | number,
        price_per_unit: '',
        description: ''
    });

    const [catalogForm, setCatalogForm] = useState({
        name: '',
        brand: '',
        description: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pondsRes, suppliersRes, unitsRes, feedsRes] = await Promise.all([
                    api.get('/ponds'),
                    api.get('/suppliers'),
                    api.get('/units'),
                    api.get('/fish-feeds')
                ]);
                setPonds(pondsRes.data);
                setSuppliers(suppliersRes.data);
                setUnits(unitsRes.data);
                setFeedCatalog(feedsRes.data);

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
        fetchPurchases();
    }, [filterMode, selectedYear, startYear, endYear, startDate, endDate, selectedPondId]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            let params: any = {};

            // Date filtering
            if (filterMode === 'all') {
                // No date params needed for all time
            } else if (filterMode === 'year') {
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
            setPurchases(res.data);
        } catch (error) {
            console.error('Failed to fetch feed purchases', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                pond_id: purchaseForm.pond_id === '' ? null : Number(purchaseForm.pond_id),
                supplier_id: Number(purchaseForm.supplier_id),
                feed_id: purchaseForm.feed_id === '' ? null : Number(purchaseForm.feed_id),
                date: new Date(purchaseForm.date).toISOString(),
                quantity: Number(purchaseForm.quantity),
                unit_id: Number(purchaseForm.unit_id),
                price_per_unit: Number(purchaseForm.price_per_unit),
                total_amount: Number(purchaseForm.quantity) * Number(purchaseForm.price_per_unit),
                description: purchaseForm.description
            };

            if (editingId) {
                await api.put(`/pond-feeds/${editingId}`, payload);
            } else {
                await api.post('/pond-feeds', payload);
            }

            setIsPurchaseModalOpen(false);
            setEditingId(null);
            fetchPurchases();

            // Reset form but keep some defaults
            setPurchaseForm(prev => ({
                ...prev,
                feed_id: '',
                quantity: '',
                price_per_unit: '',
                description: ''
            }));
        } catch (error) {
            console.error('Failed to save purchase', error);
            alert('Failed to save purchase.');
        }
    };

    const handleEdit = (purchase: PondFeedPurchase) => {
        setEditingId(purchase.id);
        setPurchaseForm({
            pond_id: purchase.pond_id || '',
            supplier_id: purchase.supplier_id,
            feed_id: purchase.feed_id || '',
            date: new Date(purchase.date).toISOString().slice(0, 10),
            quantity: String(purchase.quantity),
            unit_id: purchase.unit_id,
            price_per_unit: String(purchase.price_per_unit),
            description: purchase.description || ''
        });
        setIsPurchaseModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this purchase?")) return;
        try {
            await api.delete(`/pond-feeds/${id}`);
            fetchPurchases();
        } catch (error) {
            console.error("Failed to delete purchase", error);
        }
    };

    const handleCreateCatalogItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/fish-feeds', catalogForm);
            setFeedCatalog([...feedCatalog, res.data]);
            setCatalogForm({ name: '', brand: '', description: '' });
            setIsCatalogModalOpen(false);
            // Optionally auto-select in purchase form if it's open
        } catch (error) {
            console.error('Failed to create catalog item', error);
            alert('Failed to create feed item.');
        }
    };

    const totalAmount = purchases.reduce((sum, p) => sum + p.total_amount, 0);
    const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Feed Purchases (খাবার ক্রয়)</h1>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsCatalogModalOpen(true)}
                        className="flex-1 sm:flex-none inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors justify-center"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Feeds
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setPurchaseForm(prev => ({ ...prev, feed_id: '', quantity: '', price_per_unit: '', description: '' }));
                            setIsPurchaseModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors justify-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Purchase
                    </button>
                </div>
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
                            <option value="all">All Time</option>
                            <option value="year_range">Year Range</option>
                            <option value="date_range">Custom Date Range</option>
                        </select>
                    </div>

                    {/* Date/Year Inputs */}
                    {filterMode === 'year' && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    )}

                    {filterMode === 'year_range' && (
                        <div className="flex items-center gap-2">
                            <select
                                value={startYear}
                                onChange={(e) => setStartYear(parseInt(e.target.value))}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            >
                                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                            </select>
                            <span className="text-gray-500">to</span>
                            <select
                                value={endYear}
                                onChange={(e) => setEndYear(parseInt(e.target.value))}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            >
                                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                    )}

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
                    <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                    <LoadingSpinner message="Loading feed purchases..." />
                </div>
            ) : purchases.length === 0 ? (
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feed Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pond & Supplier</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {purchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(purchase.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="font-medium text-indigo-600">
                                                {purchase.feed_name || 'Unknown Feed'}
                                            </div>
                                            {(purchase.feed_brand || purchase.description) && (
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {purchase.feed_brand && <span className="mr-2 px-1.5 py-0.5 bg-gray-100 rounded">{purchase.feed_brand}</span>}
                                                    {purchase.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="font-medium">{purchase.supplier_name || 'Unknown Supplier'}</div>
                                            <div className="text-xs text-gray-500">{purchase.pond_name || 'General Stock'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {purchase.quantity} {purchase.unit_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            ৳{purchase.price_per_unit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                                            ৳{purchase.total_amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(purchase)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(purchase.id)} className="text-red-600 hover:text-red-900">
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

            {/* Purchase Modal */}
            <Modal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                title={editingId ? "Edit Feed Purchase" : "Record Feed Purchase"}
            >
                <form onSubmit={handleCreatePurchase} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={purchaseForm.date}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Feed Type (Name/Brand)</label>
                        <div className="flex gap-2">
                            <select
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={purchaseForm.feed_id}
                                onChange={(e) => setPurchaseForm({ ...purchaseForm, feed_id: e.target.value })}
                            >
                                <option value="">Select Feed...</option>
                                {feedCatalog.map(feed => (
                                    <option key={feed.id} value={feed.id}>{feed.name} {feed.brand ? `(${feed.brand})` : ''}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => { setIsPurchaseModalOpen(false); setIsCatalogModalOpen(true); }}
                                className="mt-1 p-2.5 bg-gray-100 rounded-lg text-indigo-600 hover:bg-gray-200"
                                title="Manage Catalog"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pond</label>
                            <select
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={purchaseForm.pond_id}
                                onChange={(e) => setPurchaseForm({ ...purchaseForm, pond_id: e.target.value })}
                            >
                                <option value="">General Stock</option>
                                {ponds.map(pond => (
                                    <option key={pond.id} value={pond.id}>{pond.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Supplier</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={purchaseForm.supplier_id}
                                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_id: e.target.value })}
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={purchaseForm.quantity}
                                onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                                value={purchaseForm.unit_id}
                                onChange={(e) => setPurchaseForm({ ...purchaseForm, unit_id: e.target.value })}
                            >
                                <option value="">Unit</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price per Unit (Taka)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={purchaseForm.price_per_unit}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, price_per_unit: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total:</span>
                        <span className="text-lg font-bold text-indigo-600">
                            ৳{((Number(purchaseForm.quantity) || 0) * (Number(purchaseForm.price_per_unit) || 0)).toLocaleString()}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Note (Optional)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={purchaseForm.description}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                            placeholder="Details..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsPurchaseModalOpen(false)}
                            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            {editingId ? "Update Purchase" : "Record Purchase"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Catalog Modal */}
            <Modal
                isOpen={isCatalogModalOpen}
                onClose={() => setIsCatalogModalOpen(false)}
                title="Manage Feed Catalog (খাবারের তালিকা)"
            >
                <div className="space-y-6">
                    <form onSubmit={handleCreateCatalogItem} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add New Feed Type
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                required
                                placeholder="Feed Name (e.g. Floating)"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border text-gray-900"
                                value={catalogForm.name}
                                onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Brand (e.g. ACI)"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border text-gray-900"
                                value={catalogForm.brand}
                                onChange={(e) => setCatalogForm({ ...catalogForm, brand: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Add to Catalog
                        </button>
                    </form>

                    <div className="max-h-60 overflow-y-auto">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Existing Feeds</h4>
                        {feedCatalog.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No feeds in catalog yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200 border border-gray-100 rounded-md">
                                {feedCatalog.map(item => (
                                    <li key={item.id} className="p-3 bg-white flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-900">{item.name} <span className="text-gray-500 font-normal">{item.brand ? `(${item.brand})` : ''}</span></span>
                                        <Tag className="h-4 w-4 text-gray-300" />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
