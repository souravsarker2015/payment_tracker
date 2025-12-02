'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, DollarSign, Filter } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Person {
    id: number;
    name: string;
}

interface Organization {
    id: number;
    name: string;
}

interface Income {
    id: number;
    person_id: number;
    organization_id: number;
    amount: number;
    date: string;
    income_type: string;
    note?: string;
}

const INCOME_TYPES = ['SALARY', 'BONUS', 'COMMISSION', 'ALLOWANCE', 'OTHER'];

type FilterMode = 'all' | 'this_year' | 'select_month' | 'select_year' | 'custom';

export default function IncomeRecordsPage() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterMode, setFilterMode] = useState<FilterMode>('this_year');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [formData, setFormData] = useState({
        person_id: '',
        organization_id: '',
        amount: '',
        date: new Date().toISOString().slice(0, 16),
        income_type: 'SALARY',
        note: ''
    });

    useEffect(() => {
        fetchData();
    }, [filterMode, customStartDate, customEndDate, selectedYear, selectedMonth]);

    const getDateRange = () => {
        const now = new Date();
        let start = null;
        let end = null;

        switch (filterMode) {
            case 'this_year':
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
                    start = new Date(customStartDate);
                    end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                }
                break;
            case 'all':
            default:
                break;
        }

        return {
            start_date: start ? start.toISOString() : undefined,
            end_date: end ? end.toISOString() : undefined
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { start_date, end_date } = getDateRange();
            const params: any = {};
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const [incomesRes, personsRes, orgsRes] = await Promise.all([
                api.get('/incomes', { params }),
                api.get('/persons'),
                api.get('/organizations')
            ]);
            setIncomes(incomesRes.data);
            setPersons(personsRes.data);
            setOrganizations(orgsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this income record?')) return;
        try {
            await api.delete(`/incomes/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete income', error);
        }
    };

    const openAddModal = () => {
        setEditingIncome(null);
        setFormData({
            person_id: persons.length > 0 ? persons[0].id.toString() : '',
            organization_id: organizations.length > 0 ? organizations[0].id.toString() : '',
            amount: '',
            date: new Date().toISOString().slice(0, 16),
            income_type: 'SALARY',
            note: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (income: Income) => {
        setEditingIncome(income);
        setFormData({
            person_id: income.person_id.toString(),
            organization_id: income.organization_id.toString(),
            amount: income.amount.toString(),
            date: new Date(income.date).toISOString().slice(0, 16),
            income_type: income.income_type,
            note: income.note || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                person_id: parseInt(formData.person_id),
                organization_id: parseInt(formData.organization_id),
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString(),
                income_type: formData.income_type,
                note: formData.note || null
            };

            if (editingIncome) {
                await api.put(`/incomes/${editingIncome.id}`, payload);
            } else {
                await api.post('/incomes', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save income', error);
        }
    };

    if (loading && incomes.length === 0) {
        return <LoadingSpinner message="Loading income records..." />;
    }

    const totalAmount = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Income Records</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Total: ৳{totalAmount.toLocaleString()} ({incomes.length} records)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <select
                            value={filterMode}
                            onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                            className="text-sm border-none focus:ring-0 text-gray-700 bg-transparent font-medium"
                        >
                            <option value="this_year">This Year</option>
                            <option value="select_month">Select Month</option>
                            <option value="select_year">Select Year</option>
                            <option value="custom">Custom Range</option>
                            <option value="all">All Time</option>
                        </select>

                        {filterMode === 'select_month' && (
                            <>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="text-sm border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500 text-black"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="text-sm border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500 text-black"
                                >
                                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterMode === 'select_year' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="text-sm border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500 text-black"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        )}

                        {filterMode === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="text-sm border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500 text-black"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="text-sm border-gray-200 rounded-md focus:ring-green-500 focus:border-green-500 text-black"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        onClick={openAddModal}
                        disabled={persons.length === 0 || organizations.length === 0}
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Income
                    </button>
                </div>
            </div>

            {(persons.length === 0 || organizations.length === 0) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                You need to add at least one person and one organization before adding income records.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingIncome ? 'Edit Income' : 'Add Income'}
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="person_id" className="block text-sm font-medium text-gray-700">
                            Person <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="person_id"
                            required
                            value={formData.person_id}
                            onChange={(e) => setFormData({ ...formData, person_id: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        >
                            {persons.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700">
                            Organization <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="organization_id"
                            required
                            value={formData.organization_id}
                            onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        >
                            {organizations.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                            Amount (৳) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="amount"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="income_type" className="block text-sm font-medium text-gray-700">
                            Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="income_type"
                            required
                            value={formData.income_type}
                            onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        >
                            {INCOME_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                            Note <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            id="note"
                            rows={3}
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                        >
                            {editingIncome ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {incomes.map((income) => {
                        const person = persons.find(p => p.id === income.person_id);
                        const org = organizations.find(o => o.id === income.organization_id);
                        return (
                            <li key={income.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex-1 block">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-green-50 rounded-full mr-3">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                            </div>
                                            <p className="text-sm font-medium text-green-600 truncate">৳{income.amount.toLocaleString()}</p>
                                        </div>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {income.income_type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex flex-col space-y-1 ml-12">
                                            <p className="flex items-center text-sm text-gray-500">
                                                👤 {person?.name || 'Unknown'} • 🏢 {org?.name || 'Unknown'}
                                            </p>
                                            <p className="flex items-center text-sm text-gray-500">
                                                📅 {new Date(income.date).toLocaleString()}
                                            </p>
                                            {income.note && (
                                                <p className="flex items-center text-sm text-gray-500 italic">
                                                    📝 {income.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={() => openEditModal(income)}
                                        className="p-2 text-gray-400 hover:text-green-600"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(income.id)}
                                        className="p-2 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                    {incomes.length === 0 && (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                            {loading ? 'Loading...' : 'No income records found for the selected period.'}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
