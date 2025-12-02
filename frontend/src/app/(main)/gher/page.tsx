'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { TrendingUp, TrendingDown, DollarSign, Fish, Activity, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DashboardStats {
    summary: {
        total_ponds: number;
        total_revenue: number;
        total_expenses: number;
        profit: number;
        month_sales: number;
        month_expenses: number;
        month_profit: number;
    };
    trends: {
        monthly_sales: Array<{ month: string; amount: number }>;
        monthly_expenses: Array<{ month: string; amount: number }>;
    };
    top_ponds: Array<{ name: string; sales: number }>;
    unit_wise_sales: Array<{
        unit_name: string;
        quantity: number;
        amount: number;
    }>;
    pond_unit_breakdown: Array<{
        pond_name: string;
        unit_name: string;
        quantity: number;
        amount: number;
    }>;
    recent_activities: Array<{
        id: number;
        type: string;
        description: string;
        amount: number;
        date: string;
    }>;
}

type FilterMode = 'all' | 'today' | 'week' | 'month' | 'year' | 'select_month' | 'select_year' | 'custom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterMode, setFilterMode] = useState<FilterMode>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    useEffect(() => {
        fetchDashboardStats();
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
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date();
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
            default:
                return null;
        }

        return {
            start_date: start.toISOString(),
            end_date: end.toISOString()
        };
    };

    const fetchDashboardStats = async () => {
        try {
            const dateRange = getDateRange();
            const params = new URLSearchParams();

            if (dateRange) {
                params.append('start_date', dateRange.start_date);
                params.append('end_date', dateRange.end_date);
            }

            const response = await api.get(`/gher/dashboard/stats?${params.toString()}`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading dashboard..." />;
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Failed to load dashboard data</div>
            </div>
        );
    }

    // Combine sales and expenses for trend chart
    const combinedTrends = stats.trends.monthly_sales.map((sale, index) => ({
        month: sale.month,
        sales: sale.amount,
        expenses: stats.trends.monthly_expenses[index]?.amount || 0,
        profit: sale.amount - (stats.trends.monthly_expenses[index]?.amount || 0)
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gher Dashboard (ঘের ড্যাশবোর্ড)</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                                ৳{stats.summary.total_revenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-green-600 mt-2">
                                This month: ৳{stats.summary.month_sales.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-green-200 p-3 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-green-700" />
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">
                                ৳{stats.summary.total_expenses.toLocaleString()}
                            </p>
                            <p className="text-xs text-red-600 mt-2">
                                This month: ৳{stats.summary.month_expenses.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-red-200 p-3 rounded-lg">
                            <TrendingDown className="h-6 w-6 text-red-700" />
                        </div>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Net Profit</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">
                                ৳{stats.summary.profit.toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                                This month: ৳{stats.summary.month_profit.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-blue-200 p-3 rounded-lg">
                            <DollarSign className="h-6 w-6 text-blue-700" />
                        </div>
                    </div>
                </div>

                {/* Total Ponds */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Total Ponds</p>
                            <p className="text-2xl font-bold text-purple-700 mt-1">
                                {stats.summary.total_ponds}
                            </p>
                            <p className="text-xs text-purple-600 mt-2">Active ponds</p>
                        </div>
                        <div className="bg-purple-200 p-3 rounded-lg">
                            <Fish className="h-6 w-6 text-purple-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales & Expenses Trend */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Expenses Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={combinedTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales" />
                            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Performing Ponds */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Ponds</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.top_ponds}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip />
                            <Bar dataKey="sales" fill="#10b981" name="Sales (৳)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Unit-wise Sales Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Unit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.unit_wise_sales.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4 col-span-full">No sales data</p>
                    ) : (
                        stats.unit_wise_sales.map((unit, index) => (
                            <div key={index} className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-indigo-700">{unit.unit_name}</span>
                                    <span className="text-xs text-indigo-600 bg-indigo-200 px-2 py-1 rounded">
                                        {unit.quantity.toFixed(2)}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-indigo-900">
                                    ৳{unit.amount.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pond-Unit Breakdown Table */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pond-wise Sales by Unit</h3>
                {stats.pond_unit_breakdown.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No sales data</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pond</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats.pond_unit_breakdown.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.pond_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.unit_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">৳{item.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                    {stats.recent_activities.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
                    ) : (
                        stats.recent_activities.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <Activity className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(activity.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600">
                                        ৳{activity.amount.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
