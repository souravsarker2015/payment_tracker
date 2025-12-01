'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, X } from 'lucide-react';
import Modal from '@/components/Modal';

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
    quantity: number;
    unit_id: number;
    rate_per_unit: number;
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

type FilterMode = 'all' | 'today' | 'week' | 'month' | 'year' | 'select_month' | 'select_year' | 'custom';

export default function SalesPage() {
    const [sales, setSales] = useState<FishSale[]>([]);
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Filter States
    const [filterMode, setFilterMode] = useState<FilterMode>('month'); // Default to this month
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

    const [formData, setFormData] = useState({
        date: new Date().toISOString().slice(0, 16),
        buyer_name: ''
    });

    const [entryMode, setEntryMode] = useState<'simple' | 'detailed'>('detailed');
    const [simpleFormData, setSimpleFormData] = useState({
        total_amount: ''
    });

    const [saleItems, setSaleItems] = useState<SaleItem[]>([{
        pond_id: 0,
        quantity: 0,
        unit_id: 0,
        rate_per_unit: 0,
        amount: 0
    }]);

    useEffect(() => {
        fetchData();
    }, [filterMode, customStartDate, customEndDate, selectedYear, selectedMonth]);

    const getDateRange = () => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (filterMode) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(now);
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
                if (customStartDate) start = new Date(customStartDate);
                if (customEndDate) {
                    end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                }
                break;
            case 'all':
            default:
                break;
        }
        return { start, end };
    };

    const fetchData = async () => {
        try {
            const [salesRes, pondsRes, unitsRes] = await Promise.all([
                api.get('/fish-sales'),
                api.get('/ponds'),
                api.get('/units')
            ]);

            // Apply client-side filtering
            const { start, end } = getDateRange();
            let filteredSales = salesRes.data;

            if (start && end) {
                filteredSales = salesRes.data.filter((sale: FishSale) => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= start && saleDate <= end;
                });
            }

            setSales(filteredSales);
            setPonds(pondsRes.data);
            setUnits(unitsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const addSaleItem = () => {
        setSaleItems([...saleItems, {
            pond_id: 0,
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
                buyer_name: formData.buyer_name,
                total_amount: totalAmount,
                total_weight: totalWeight,
                items: saleItems
            };
        }

        try {
            await api.post('/fish-sales', requestData);

            setIsAddModalOpen(false);
            setFormData({
                date: new Date().toISOString().slice(0, 16),
                buyer_name: ''
            });
            setSimpleFormData({
                total_amount: ''
            });
            setSaleItems([{
                pond_id: 0,
                quantity: 0,
                unit_id: 0,
                rate_per_unit: 0,
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Buyer Name (Optional)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.buyer_name}
                            onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                        />
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
                        Add Sale
                    </button>
                </form>
            </Modal>
        </div >
    );
}
