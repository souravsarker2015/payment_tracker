'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, RefreshCw, Check, X } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FishBuyer {
    id: number;
    name: string;
}

interface Pond {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
    name_bn?: string;
}

interface SaleItem {
    pond_id: number;
    fish_id?: number | null;
    quantity: number;
    unit_id: number;
    rate_per_unit: number;
    amount: number;
}

interface FishSale {
    id: number;
    date: string;
    buyer_name?: string;
    buyer_id?: number | null;
    payment_status: 'paid' | 'due' | 'partial';
    paid_amount: number;
    due_amount: number;
    sale_type: 'simple' | 'detailed';
    total_amount: number;
    total_weight?: number;
    items: Array<{
        pond_id: number;
        fish_id?: number | null;
        quantity: number;
        unit_id: number;
        rate_per_unit: number;
        amount: number;
    }>;
}

interface Unit {
    id: number;
    name: string;
    name_bn?: string;
}

type FilterMode = 'all' | 'today' | 'week' | 'month' | 'year' | 'select_month' | 'select_year' | 'custom';

export default function SalesPage() {
    const [sales, setSales] = useState<FishSale[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [buyers, setBuyers] = useState<FishBuyer[]>([]);
    const [fishes, setFishes] = useState<any[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<FishSale | null>(null);

    // Filter States
    const [filterMode, setFilterMode] = useState<FilterMode>('month'); // Default to this month
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [isMobile, setIsMobile] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 16),
        buyer_name: '',
        buyer_id: '',
        payment_status: 'cash', // 'cash' (Nagad) or 'credit' (Baki)
        paid_amount: ''
    });

    const [entryMode, setEntryMode] = useState<'simple' | 'detailed'>('detailed');
    const [simpleFormData, setSimpleFormData] = useState({
        total_amount: ''
    });

    const [saleItems, setSaleItems] = useState<SaleItem[]>([{
        pond_id: 0,
        fish_id: null,
        quantity: 0,
        unit_id: 0,
        rate_per_unit: 0,
        amount: 0
    }]);

    const [filterLoading, setFilterLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState<any>(null);

    const [isAddingBuyer, setIsAddingBuyer] = useState(false);
    const [quickBuyerName, setQuickBuyerName] = useState('');

    useEffect(() => {
        fetchPonds();
        fetchBuyers();
        fetchFishes();
        fetchUnits();

        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        fetchData();
    }, [filterMode, customStartDate, customEndDate, selectedYear, selectedMonth]);

    const getDateRange = () => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (filterMode) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                // Calculate start of the current week (Monday)
                const day = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday being 0
                start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(); // End of today
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'select_month':
                start = new Date(selectedYear, selectedMonth, 1);
                end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
                break;
            case 'select_year':
                start = new Date(selectedYear, 0, 1);
                end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    const customStart = new Date(customStartDate);
                    const customEnd = new Date(customEndDate);
                    customEnd.setHours(23, 59, 59, 999);
                    return {
                        start_date: customStart.toISOString(),
                        end_date: customEnd.toISOString()
                    };
                }
                return null;
            case 'all':
            default: // 'all'
                return null;
        }

        return {
            start_date: start.toISOString(),
            end_date: end.toISOString()
        };
    };

    const fetchData = async () => {
        try {
            setFilterLoading(true);
            const dateRange = getDateRange();
            const params = new URLSearchParams();

            if (dateRange) {
                params.append('start_date', dateRange.start_date);
                params.append('end_date', dateRange.end_date);
            }

            const response = await api.get(`/fish-sales?${params.toString()}`);
            console.log('Sales fetched:', response.data);
            setSales(response.data);
        } catch (error) {
            console.error('Failed to fetch sales', error);
            setFeedbackMessage({ type: 'error', text: 'Failed to fetch sales' });
        } finally {
            setLoading(false);
            setFilterLoading(false);
        }
    };

    const fetchPonds = async () => {
        try {
            const response = await api.get('/ponds');
            setPonds(response.data);
        } catch (error) {
            console.error('Failed to fetch ponds', error);
        }
    };

    const fetchBuyers = async () => {
        try {
            const response = await api.get('/fish-buyers');
            setBuyers(response.data);
        } catch (error) {
            console.error('Failed to fetch buyers', error);
        }
    };

    const fetchFishes = async () => {
        try {
            const response = await api.get('/fishes');
            setFishes(response.data);
        } catch (error) {
            console.error('Failed to fetch fishes', error);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await api.get('/units');
            setUnits(response.data);
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    };

    const addSaleItem = () => {
        setSaleItems([...saleItems, {
            pond_id: 0,
            fish_id: null,
            quantity: 0,
            unit_id: 0,
            rate_per_unit: 0,
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
        if (field === 'quantity' || field === 'rate_per_unit') {
            updated[index].amount = updated[index].quantity * updated[index].rate_per_unit;
        }

        setSaleItems(updated);
    };

    const handleAddSale = async (e: React.FormEvent) => {
        e.preventDefault();

        let requestData;

        if (entryMode === 'simple') {
            // Simple mode: just total amount
            requestData = {
                date: new Date(formData.date).toISOString(),
                buyer_name: formData.buyer_name || undefined,
                buyer_id: formData.buyer_id ? parseInt(formData.buyer_id) : null,
                payment_status: formData.payment_status,
                paid_amount: formData.payment_status === 'cash' ? 0 : parseFloat(formData.paid_amount || '0'),
                sale_type: 'simple',
                total_amount: parseFloat(simpleFormData.total_amount),
                items: []
            };
        } else {
            // Detailed mode: validate and use pond items
            const invalidItems = saleItems.filter(item => item.pond_id === 0 || item.unit_id === 0);
            if (invalidItems.length > 0) {
                alert('Please select pond and unit for all items');
                return;
            }

            const totalAmount = saleItems.reduce((sum, item) => sum + item.amount, 0);
            const totalWeight = saleItems.reduce((sum, item) => sum + item.quantity, 0);

            requestData = {
                date: new Date(formData.date).toISOString(),
                buyer_name: formData.buyer_name || undefined, // Keep for legacy or if buyer_id not used? Or just use buyer_id logic
                buyer_id: formData.buyer_id ? parseInt(formData.buyer_id) : null,
                payment_status: formData.payment_status,
                paid_amount: formData.payment_status === 'cash' ? 0 : parseFloat(formData.paid_amount || '0'), // Backend handles cash=total logic if 0, but safe to send 0
                sale_type: 'detailed',
                total_amount: totalAmount,
                total_weight: totalWeight,
                items: saleItems
            };
        }

        // Safety check: Warn if converting detailed to simple
        if (entryMode === 'simple' && editingSale?.sale_type === 'detailed') {
            setPendingSubmit(requestData);
            setShowConfirmModal(true);
            return;
        }

        try {
            console.log('Current Entry Mode:', entryMode);
            console.log('Sending request data:', requestData);
            console.log('Items count:', requestData.items ? requestData.items.length : 0);

            if (editingSale) {
                // Update existing sale
                await api.put(`/fish-sales/${editingSale.id}`, requestData);
                setFeedbackMessage({ type: 'success', text: 'Sale updated successfully' });
            } else {
                // Create new sale
                await api.post('/fish-sales', requestData);
                setFeedbackMessage({ type: 'success', text: 'Sale created successfully' });
            }

            setIsAddModalOpen(false);
            setEditingSale(null);
            setFormData({
                date: new Date().toISOString().slice(0, 16),
                buyer_name: '',
                buyer_id: '',
                payment_status: 'cash',
                paid_amount: ''
            });
            setSimpleFormData({
                total_amount: ''
            });
            setSaleItems([{
                pond_id: 0,
                fish_id: null,
                quantity: 0,
                unit_id: 0,
                rate_per_unit: 0,
                amount: 0
            }]);
            setEntryMode('detailed');
            fetchData();

            setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (error: any) {
            console.error('Failed to save sale', error);
            const errorMsg = error.response?.data?.detail || 'Failed to save sale';
            setFeedbackMessage({ type: 'error', text: errorMsg });
            setTimeout(() => setFeedbackMessage(null), 5000);
        }
    };

    const handleConfirmConversion = async () => {
        if (!pendingSubmit) return;

        try {
            if (editingSale) {
                await api.put(`/fish-sales/${editingSale.id}`, pendingSubmit);
                setFeedbackMessage({ type: 'success', text: 'Sale updated successfully' });
            }

            setIsAddModalOpen(false);
            setEditingSale(null);
            setFormData({
                date: new Date().toISOString().slice(0, 16),
                buyer_name: '',
                buyer_id: '',
                payment_status: 'cash',
                paid_amount: ''
            });
            setSimpleFormData({
                total_amount: ''
            });
            setSaleItems([{
                pond_id: 0,
                fish_id: null,
                quantity: 0,
                unit_id: 0,
                rate_per_unit: 0,
                amount: 0
            }]);
            setEntryMode('detailed');
            fetchData();
            setPendingSubmit(null);

            setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (error: any) {
            console.error('Failed to save sale', error);
            const errorMsg = error.response?.data?.detail || 'Failed to save sale';
            setFeedbackMessage({ type: 'error', text: errorMsg });
            setTimeout(() => setFeedbackMessage(null), 5000);
        }
    };

    const handleEditSale = async (sale: FishSale) => {
        console.log('Editing sale:', sale);
        console.log('Sale items:', sale.items);

        setEditingSale(sale);
        setFormData({
            date: new Date(sale.date).toISOString().slice(0, 16),
            buyer_name: sale.buyer_name || '',
            buyer_id: sale.buyer_id ? sale.buyer_id.toString() : '',
            payment_status: sale.payment_status === 'paid' ? 'cash' : 'credit', // Map backend status back to form mode
            paid_amount: sale.paid_amount ? sale.paid_amount.toString() : ''
        });

        // Determine entry mode based on sale_type
        if (sale.sale_type === 'detailed') {
            console.log('Setting to detailed mode based on sale_type');
            setEntryMode('detailed');
            if (sale.items && sale.items.length > 0) {
                setSaleItems(sale.items.map(item => ({
                    pond_id: item.pond_id,
                    fish_id: item.fish_id || null,
                    quantity: item.quantity,
                    unit_id: item.unit_id,
                    rate_per_unit: item.rate_per_unit,
                    amount: item.amount
                })));
            } else {
                // Should not happen for detailed entry, but handle gracefully
                setSaleItems([{
                    pond_id: 0,
                    fish_id: null,
                    quantity: 0,
                    unit_id: 0,
                    rate_per_unit: 0,
                    amount: 0
                }]);
            }
        } else {
            console.log('Setting to simple mode based on sale_type');
            setEntryMode('simple');
            setSimpleFormData({
                total_amount: sale.total_amount.toString()
            });
        }

        setIsAddModalOpen(true);
    };

    const handleQuickAddBuyer = async () => {
        if (!quickBuyerName.trim()) return;
        try {
            const res = await api.post('/fish-buyers', { name: quickBuyerName });
            setQuickBuyerName('');
            setIsAddingBuyer(false);

            const buyersRes = await api.get('/fish-buyers');
            setBuyers(buyersRes.data);

            if (res.data && res.data.id) {
                setFormData(prev => ({ ...prev, buyer_id: res.data.id.toString() }));
            }
        } catch (error) {
            console.error('Failed to add buyer', error);
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
            {/* Feedback Message */}
            {feedbackMessage && (
                <div className={`p-4 rounded-md ${feedbackMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {feedbackMessage.text}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Fish Sales (মাছ বিক্রি)</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sale
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Filter:</label>
                    <select
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="select_month">Select Month</option>
                        <option value="select_year">Select Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {filterMode === 'select_year' && (
                        <div className="flex space-x-2">
                            <select
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {filterMode === 'select_month' && (
                        <div className="flex space-x-2">
                            <select
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            >
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                    <option key={idx} value={idx}>{month}</option>
                                ))}
                            </select>
                            <select
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {filterMode === 'custom' && (
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                placeholder="End Date"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Sold */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500">Total Sold</div>
                    <div className="text-3xl font-bold text-green-600">৳{totalRevenue.toLocaleString()}</div>
                </div>

                {/* Unit-wise Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500 mb-3">Sales by Unit</div>
                    <div className="space-y-2">
                        {(() => {
                            // Calculate unit-wise totals
                            const unitTotals: Record<number, { name: string; quantity: number; amount: number }> = {};

                            sales.forEach(sale => {
                                if (sale.items && sale.items.length > 0) {
                                    sale.items.forEach(item => {
                                        if (!unitTotals[item.unit_id]) {
                                            const unit = units.find(u => u.id === item.unit_id);
                                            unitTotals[item.unit_id] = {
                                                name: unit?.name || 'Unknown',
                                                quantity: 0,
                                                amount: 0
                                            };
                                        }
                                        unitTotals[item.unit_id].quantity += item.quantity;
                                        unitTotals[item.unit_id].amount += item.amount;
                                    });
                                }
                            });

                            const unitData = Object.values(unitTotals);

                            if (unitData.length === 0) {
                                return <div className="text-sm text-gray-400">No sales data</div>;
                            }

                            return unitData.map((unit, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">{unit.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">({unit.quantity.toFixed(2)})</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">৳{unit.amount.toLocaleString()}</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Pond-wise Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500 mb-3">Sales by Pond</div>
                    <div className="space-y-2">
                        {(() => {
                            // Calculate pond-wise totals
                            const pondTotals: Record<number, { name: string; quantity: number; amount: number }> = {};

                            sales.forEach(sale => {
                                if (sale.items && sale.items.length > 0) {
                                    sale.items.forEach(item => {
                                        if (!pondTotals[item.pond_id]) {
                                            const pond = ponds.find(p => p.id === item.pond_id);
                                            pondTotals[item.pond_id] = {
                                                name: pond?.name || 'Unknown',
                                                quantity: 0,
                                                amount: 0
                                            };
                                        }
                                        pondTotals[item.pond_id].quantity += item.quantity;
                                        pondTotals[item.pond_id].amount += item.amount;
                                    });
                                }
                            });

                            const pondData = Object.values(pondTotals);

                            if (pondData.length === 0) {
                                return <div className="text-sm text-gray-400">No sales data</div>;
                            }

                            return pondData.map((pond, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">{pond.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">({pond.quantity.toFixed(2)})</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">৳{pond.amount.toLocaleString()}</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unit-wise Distribution Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Distribution by Unit</h3>
                    {(() => {
                        const unitTotals: Record<number, { name: string; amount: number }> = {};

                        sales.forEach(sale => {
                            if (sale.items && sale.items.length > 0) {
                                sale.items.forEach(item => {
                                    if (!unitTotals[item.unit_id]) {
                                        const unit = units.find(u => u.id === item.unit_id);
                                        unitTotals[item.unit_id] = {
                                            name: unit?.name || 'Unknown',
                                            amount: 0
                                        };
                                    }
                                    unitTotals[item.unit_id].amount += item.amount;
                                });
                            }
                        });

                        const chartData = Object.values(unitTotals);
                        const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

                        if (chartData.length === 0) {
                            return <div className="text-sm text-gray-400 text-center py-8">No data available</div>;
                        }

                        return (
                            <ResponsiveContainer width="100%" height={300} minWidth={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={isMobile ? 60 : 80}
                                        fill="#8884d8"
                                        dataKey="amount"
                                        label={!isMobile ? ({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)` : false}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
                                    <Legend
                                        wrapperStyle={{ fontSize: '11px' }}
                                        formatter={(value, entry: any) => `${entry.payload.name}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        );
                    })()}
                </div>

                {/* Pond-wise Distribution Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Distribution by Pond</h3>
                    {(() => {
                        const pondTotals: Record<number, { name: string; amount: number }> = {};

                        sales.forEach(sale => {
                            if (sale.items && sale.items.length > 0) {
                                sale.items.forEach(item => {
                                    if (!pondTotals[item.pond_id]) {
                                        const pond = ponds.find(p => p.id === item.pond_id);
                                        pondTotals[item.pond_id] = {
                                            name: pond?.name || 'Unknown',
                                            amount: 0
                                        };
                                    }
                                    pondTotals[item.pond_id].amount += item.amount;
                                });
                            }
                        });

                        const chartData = Object.values(pondTotals);
                        const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

                        if (chartData.length === 0) {
                            return <div className="text-sm text-gray-400 text-center py-8">No data available</div>;
                        }

                        return (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                                    <YAxis style={{ fontSize: '12px' }} />
                                    <Tooltip formatter={(value: number) => `৳${value.toLocaleString()}`} />
                                    <Bar dataKey="amount" fill="#10b981" name="Sales (৳)" />
                                </BarChart>
                            </ResponsiveContainer>
                        );
                    })()}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid / Due</th>
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
                                sales.map((sale) => {
                                    // Get unit name for the sale
                                    const getWeightDisplay = () => {
                                        if (!sale.items || sale.items.length === 0 || !sale.total_weight) {
                                            return '-';
                                        }
                                        // Get the first item's unit (assuming all items use same unit for weight)
                                        const firstItem = sale.items[0];
                                        const unit = units.find(u => u.id === firstItem.unit_id);
                                        const unitName = unit?.name || 'kg';
                                        return `${sale.total_weight.toFixed(2)} ${unitName}`;
                                    };

                                    return (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(sale.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {sale.buyer_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {getWeightDisplay()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                                ৳{sale.total_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                                        sale.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {sale.payment_status === 'paid' ? 'Paid' : sale.payment_status === 'partial' ? 'Partial' : 'Due'}
                                                    </span>
                                                    {sale.due_amount > 0 && <span className="text-red-500 text-xs font-medium">Due: ৳{sale.due_amount.toLocaleString()}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditSale(sale)}
                                                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sale.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Sale Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingSale(null);
                    setFormData({
                        date: new Date().toISOString().slice(0, 16),
                        buyer_name: '',
                        buyer_id: '',
                        payment_status: 'cash',
                        paid_amount: ''
                    });
                    setSimpleFormData({ total_amount: '' });
                    setSaleItems([{
                        pond_id: 0,
                        fish_id: null,
                        quantity: 0,
                        unit_id: 0,
                        rate_per_unit: 0,
                        amount: 0
                    }]);
                    setEntryMode('detailed');
                    setIsAddingBuyer(false);
                    setQuickBuyerName('');
                }}
                title={editingSale ? "Edit Fish Sale" : "Add Fish Sale"}
            >
                <form onSubmit={handleAddSale} className="space-y-4">
                    {/* Entry Mode Toggle */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setEntryMode('simple')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${entryMode === 'simple'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Simple Entry
                        </button>
                        <button
                            type="button"
                            onClick={() => setEntryMode('detailed')}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${entryMode === 'detailed'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Detailed Entry
                        </button>
                    </div>

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
                    {/* Buyer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Buyer (আড়ৎ/ক্রেতা)</label>
                        {isAddingBuyer ? (
                            <div className="mt-1 flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="New buyer name"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                    value={quickBuyerName}
                                    onChange={(e) => setQuickBuyerName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleQuickAddBuyer();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleQuickAddBuyer}
                                    className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingBuyer(false)}
                                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="mt-1 flex gap-2">
                                <div className="relative flex-grow">
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                        value={formData.buyer_id}
                                        onChange={(e) => setFormData({ ...formData, buyer_id: e.target.value })}
                                    >
                                        <option value="">Select Buyer (Required for Credit)</option>
                                        {buyers.map((buyer) => (
                                            <option key={buyer.id} value={buyer.id}>
                                                {buyer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingBuyer(true)}
                                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                    title="Add new buyer"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {!isAddingBuyer && (
                            <p className="mt-1 text-xs text-gray-500">
                                Or leave empty for generic cash sale (legacy: {formData.buyer_name || 'None'})
                            </p>
                        )}
                    </div>

                    {/* Payment Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                            <div className="mt-2 flex gap-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-indigo-600"
                                        name="payment_status"
                                        value="cash"
                                        checked={formData.payment_status === 'cash'}
                                        onChange={() => setFormData({ ...formData, payment_status: 'cash' })}
                                    />
                                    <span className="ml-2">Cash (নগদ)</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-indigo-600"
                                        name="payment_status"
                                        value="credit"
                                        checked={formData.payment_status === 'credit'}
                                        onChange={() => setFormData({ ...formData, payment_status: 'credit' })}
                                    />
                                    <span className="ml-2">Credit (বাকি)</span>
                                </label>
                            </div>
                        </div>

                        {formData.payment_status === 'credit' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Paid Amount (জমা)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                    value={formData.paid_amount}
                                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                                    placeholder="Amount paid now"
                                />
                            </div>
                        )}
                    </div>

                    {entryMode === 'simple' ? (
                        /* Simple Entry Mode */
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Sale Amount</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={simpleFormData.total_amount}
                                onChange={(e) => setSimpleFormData({ total_amount: e.target.value })}
                                placeholder="Enter total amount"
                            />
                        </div>
                    ) : (
                        /* Detailed Entry Mode */
                        <div>
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
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700">Fish</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                                value={item.fish_id || ''}
                                                onChange={(e) => updateSaleItem(index, 'fish_id', e.target.value ? parseInt(e.target.value) : null)}
                                            >
                                                <option value="">Select fish</option>
                                                {fishes.map((fish) => (
                                                    <option key={fish.id} value={fish.id}>
                                                        {fish.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
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
                                            <label className="block text-xs font-medium text-gray-700">Quantity</label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateSaleItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Unit</label>
                                            <select
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                                value={item.unit_id}
                                                onChange={(e) => updateSaleItem(index, 'unit_id', parseInt(e.target.value))}
                                            >
                                                <option value={0}>Select unit</option>
                                                {units.map((unit) => (
                                                    <option key={unit.id} value={unit.id}>
                                                        {unit.name} {unit.name_bn && `(${unit.name_bn})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700">Rate per unit</label>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border text-gray-900"
                                                value={item.rate_per_unit || ''}
                                                onChange={(e) => updateSaleItem(index, 'rate_per_unit', parseFloat(e.target.value) || 0)}
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

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        ৳{saleItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                    >
                        {editingSale ? 'Update Sale' : 'Add Sale'}
                    </button>
                </form>
            </Modal>

            {/* Confirmation Modal for Detailed to Simple Conversion */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setPendingSubmit(null);
                }}
                onConfirm={handleConfirmConversion}
                title="Warning: Data Loss"
                message="You are updating a Detailed Entry as a Simple Entry. All detailed items will be permanently deleted. This action cannot be undone. Do you want to continue?"
                confirmText="Yes, Convert to Simple"
                cancelText="Cancel"
                type="warning"
            />
        </div >
    );
}
