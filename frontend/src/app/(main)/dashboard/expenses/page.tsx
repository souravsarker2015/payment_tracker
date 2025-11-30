'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface DashboardStats {
    total_spent_year: number;
    avg_monthly_spend: number;
    max_monthly_spend: number;
    pie_chart_data: { name: string; value: number }[];
    bar_chart_data: { name: string; amount: number }[];
}

interface Expense {
    id: number;
    amount: number;
    description: string;
    date: string;
    expense_type_id: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ExpensesDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, expensesRes] = await Promise.all([
                    api.get('/expenses/stats/overview', { params: { year: selectedYear } }),
                    api.get('/expenses', { params: { limit: 5 } })
                ]);
                setStats(statsRes.data);
                setRecentExpenses(expensesRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Expenses Overview</h1>
                <select
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Spent ({selectedYear})</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.total_spent_year.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg. Monthly Spend</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.avg_monthly_spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Max Monthly Spend</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {stats.max_monthly_spend.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend Bar Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trend</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.bar_chart_data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pie_chart_data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.pie_chart_data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                    {recentExpenses.map((expense) => (
                        <li key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{expense.description || 'Expense'}</p>
                                    <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleString()}</p>
                                </div>
                                <span className="text-sm font-bold text-gray-900">
                                    {expense.amount.toLocaleString()}
                                </span>
                            </div>
                        </li>
                    ))}
                    {recentExpenses.length === 0 && (
                        <li className="px-6 py-8 text-center text-gray-500 text-sm">No recent expenses</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
