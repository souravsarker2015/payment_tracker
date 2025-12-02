'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Plus, Edit2, Trash2, DollarSign, Filter, TrendingUp } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Organization {
    id: number;
    name: string;
    address?: string;
    contact_person?: string;
    phone?: string;
    is_active: boolean;
}

interface Person {
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
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

type FilterMode = 'all' | 'this_year' | 'select_month' | 'select_year' | 'custom';

export default function OrganizationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const organizationId = parseInt(params.id as string);

    const [organization, setOrganization] = useState<Organization | null>(null);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Filter states
    const [filterMode, setFilterMode] = useState<FilterMode>('this_year');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [formData, setFormData] = useState({
        person_id: '',
        amount: '',
        date: new Date().toISOString().slice(0, 16),
        income_type: 'SALARY',
        note: ''
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchData();
    }, [organizationId, filterMode, customStartDate, customEndDate, selectedYear, selectedMonth]);

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
            const params: any = { organization_id: organizationId };
            if (start_date) params.start_date = start_date;
            if (end_date) params.end_date = end_date;

            const [orgRes, incomesRes, personsRes] = await Promise.all([
                api.get(`/organizations/${organizationId}`),
                api.get('/incomes', { params }),
                api.get('/persons')
            ]);

            setOrganization(orgRes.data);
            setIncomes(incomesRes.data);
            setPersons(personsRes.data);
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
                organization_id: organizationId,
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

    if (loading && !organization) {
        return <LoadingSpinner message="Loading organization details..." />;
    }

    if (!organization) {
        return <div className="text-center py-8">Organization not found</div>;
    }

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    // Chart data
    const incomeByType = INCOME_TYPES.map(type => ({
        name: type,
        value: incomes.filter(inc => inc.income_type === type).reduce((sum, inc) => sum + inc.amount, 0)
    })).filter(item => item.value > 0);

    const incomeByPerson = persons.map(person => ({
        name: person.name,
        value: incomes.filter(inc => inc.person_id === person.id).reduce((sum, inc) => sum + inc.amount, 0)
    })).filter(item => item.value > 0).slice(0, 5);

    // Monthly trend
    const monthlyData: { [key: string]: number } = {};
    incomes.forEach(inc => {
        const month = new Date(inc.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyData[month] = (monthlyData[month] || 0) + inc.amount;
    });
    const monthlyTrend = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            {organization.address && <span>📍 {organization.address}</span>}
                            {organization.contact_person && <span>👤 {organization.contact_person}</span>}
                            {organization.phone && <span>📞 {organization.phone}</span>}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${organization.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {organization.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
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
                            className="text-sm border-gray-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-black"
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
                            className="text-sm border-gray-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-black"
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
                        className="text-sm border-gray-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-black"
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
                            className="text-sm border-gray-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-black"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="text-sm border-gray-200 rounded-md focus:ring-orange-500 focus:border-orange-500 text-black"
                        />
                    </div>
                )}

                <button
                    onClick={openAddModal}
                    className="ml-auto inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700"
                    disabled={persons.length === 0}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-orange-100 text-sm font-medium">Total Income (Selected Period)</p>
                        <p className="text-4xl font-bold mt-2">৳{totalIncome.toLocaleString()}</p>
                        <p className="text-orange-100 text-sm mt-2">{incomes.length} transactions</p>
                    </div>
                    <div className="p-4 bg-white bg-opacity-20 rounded-lg">
                        <TrendingUp className="h-12 w-12" />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income by Type */}
                {incomeByType.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Type</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={incomeByType}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={isMobile ? 40 : 60}
                                        outerRadius={isMobile ? 70 : 80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {incomeByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `৳${Number(value).toLocaleString()}`} />
                                    <Legend
                                        layout={isMobile ? "horizontal" : "vertical"}
                                        verticalAlign={isMobile ? "bottom" : "middle"}
                                        align={isMobile ? "center" : "right"}
                                        wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Income by Person */}
                {incomeByPerson.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Person</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={incomeByPerson} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip formatter={(value) => `৳${Number(value).toLocaleString()}`} />
                                    <Bar dataKey="value" name="Income" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Monthly Trend */}
                {monthlyTrend.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Trend</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `৳${Number(value).toLocaleString()}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="amount" name="Income" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Income Records */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income History</h3>
                <div className="space-y-3">
                    {incomes.map((income) => {
                        const person = persons.find(p => p.id === income.person_id);
                        return (
                            <div key={income.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-orange-50 rounded-full">
                                            <DollarSign className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">৳{income.amount.toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">
                                                {person?.name || 'Unknown'} • {income.income_type}
                                            </p>
                                            <p className="text-xs text-gray-400">{new Date(income.date).toLocaleString()}</p>
                                            {income.note && <p className="text-xs text-gray-500 italic mt-1">📝 {income.note}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => openEditModal(income)}
                                        className="p-2 text-gray-400 hover:text-orange-600"
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
                            </div>
                        );
                    })}
                    {incomes.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No income records for this period. Click "Add Income" to get started!</p>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                        >
                            {persons.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                        />
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:text-sm"
                        >
                            {editingIncome ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
