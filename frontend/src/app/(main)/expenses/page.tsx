'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Settings, Calendar, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal';

interface ExpenseType {
    id: number;
    name: string;
    is_active: boolean;
}

interface Expense {
    id: number;
    amount: number;
    description: string;
    date: string;
    expense_type_id: number;
    expense_type?: ExpenseType;
}

type FilterMode = 'all' | 'today' | 'week' | 'month' | 'year' | 'select_month' | 'custom';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [filterMode, setFilterMode] = useState<FilterMode>('month'); // Default to this month
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

    // Modal States
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
        expense_type_id: ''
    });
    const [newTypeName, setNewTypeName] = useState('');

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
                const day = now.getDay(); // 0 (Sun) - 6 (Sat)
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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
        setLoading(true);
        try {
            const { start, end } = getDateRange();

            const params: any = {};
            if (start) params.start_date = start.toISOString();
            if (end) params.end_date = end.toISOString();

            const [expensesRes, typesRes] = await Promise.all([
                api.get('/expenses', { params }),
                api.get('/expense-types')
            ]);
            setExpenses(expensesRes.data);
            setExpenseTypes(typesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                amount: parseFloat(formData.amount),
                description: formData.description,
                date: new Date(formData.date).toISOString(),
                expense_type_id: formData.expense_type_id ? parseInt(formData.expense_type_id) : null
            };

            await api.post('/expenses', payload);
            setIsAddExpenseOpen(false);
            setFormData({
                amount: '',
                description: '',
                date: new Date().toISOString().slice(0, 16),
                expense_type_id: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to add expense', error);
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete expense', error);
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/expense-types', { name: newTypeName });
            setNewTypeName('');
            const typesRes = await api.get('/expense-types');
            setExpenseTypes(typesRes.data);
        } catch (error) {
            console.error('Failed to add expense type', error);
        }
    };

    const handleDeleteType = async (id: number) => {
        if (!confirm('Are you sure? This might affect existing expenses.')) return;
        try {
            await api.delete(`/expense-types/${id}`);
            const typesRes = await api.get('/expense-types');
            setExpenseTypes(typesRes.data);
        } catch (error) {
            console.error('Failed to delete expense type', error);
        }
    };

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Family Expenses</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsManageTypesOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Types
                    </button>
                    <button
                        onClick={() => setIsAddExpenseOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                </div>

                <select
                    className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="select_month">Select Month</option>
                    <option value="custom">Custom Range</option>
                </select>

                {filterMode === 'select_month' && (
                    <div className="flex space-x-2">
                        <select
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                )}

                {filterMode === 'custom' && (
                    <div className="flex space-x-2 items-center">
                        <input
                            type="date"
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                    </div>
                )}

                <div className="flex-1 text-right">
                    <span className="text-sm text-gray-500">Total: </span>
                    <span className="text-lg font-bold text-gray-900">{totalAmount.toLocaleString()}</span>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        Loading expenses...
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No expenses found for the selected period.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => {
                                    const type = expenseTypes.find(t => t.id === expense.expense_type_id);
                                    return (
                                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(expense.date).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                {expense.description || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {type?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                                                {expense.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
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

            {/* Add Expense Modal */}
            <Modal
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                title="Add New Expense"
            >
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
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
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
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
                        <label className="block text-sm font-medium text-gray-700">Expense Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.expense_type_id}
                            onChange={(e) => setFormData({ ...formData, expense_type_id: e.target.value })}
                        >
                            <option value="">Select a type</option>
                            {expenseTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            Add Expense
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Manage Types Modal */}
            <Modal
                isOpen={isManageTypesOpen}
                onClose={() => setIsManageTypesOpen(false)}
                title="Manage Expense Types"
            >
                <div className="space-y-6">
                    <form onSubmit={handleAddType} className="flex gap-2">
                        <input
                            type="text"
                            required
                            placeholder="New type name (e.g. Grocery)"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Add
                        </button>
                    </form>

                    <ul className="divide-y divide-gray-200">
                        {expenseTypes.map((type) => (
                            <li key={type.id} className="py-3 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">{type.name}</span>
                                <button
                                    onClick={() => handleDeleteType(type.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))}
                        {expenseTypes.length === 0 && (
                            <li className="text-sm text-gray-500 text-center py-2">
                                No expense types yet.
                            </li>
                        )}
                    </ul>
                </div>
            </Modal>
        </div>
    );
}
