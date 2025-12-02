'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DollarSign, Users, Building2, TrendingUp, PieChart as PieChartIcon, BarChart3, Filter, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface DashboardStats {
    summary: {
        total_income: number;
        month_income: number;
        last_month_income: number;
    };
    trends: Array<{ month: string; amount: number }>;
    charts: {
        by_type: Array<{ name: string; value: number }>;
        by_organization: Array<{ name: string; value: number }>;
        by_person: Array<{ name: string; value: number }>;
    };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type FilterMode = 'all' | 'this_year' | 'select_month' | 'select_year' | 'custom';

export default function IncomeDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Filter states
    const [filterMode, setFilterMode] = useState<FilterMode>('this_year');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

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

            const response = await api.get('/income-dashboard/stats', { params });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (!stats && loading) {
        return <LoadingSpinner message="Loading income dashboard..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Income Dashboard</h1>

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
            </div>

            {loading && !stats ? (
                <LoadingSpinner message="Updating data..." />
            ) : stats ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {filterMode === 'all' ? 'Total Income (All Time)' : 'Total Income (Selected Period)'}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">৳{stats.summary.total_income.toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">This Month</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">৳{stats.summary.month_income.toLocaleString()}</p>
                                        <p className={`text-sm mt-2 ${stats.summary.month_income >= stats.summary.last_month_income ? 'text-green-600' : 'text-red-600'}`}>
                                            {stats.summary.month_income >= stats.summary.last_month_income ? '↑' : '↓'} vs last month
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <TrendingUp className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Quick Actions</p>
                                        <div className="flex space-x-2 mt-2">
                                            <Link href="/income/records" className="text-sm text-blue-600 hover:underline">View Records</Link>
                                            <span className="text-gray-300">|</span>
                                            <Link href="/income/persons" className="text-sm text-blue-600 hover:underline">Manage Persons</Link>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <BarChart3 className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Trend */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Trend</h3>
                            <div className="h-[300px] w-full overflow-x-auto">
                                <div style={{ minWidth: isMobile ? 500 : '100%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats.trends}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `৳${Number(value).toLocaleString()}`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="amount" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Income by Type */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income by Type</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.charts.by_type}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={isMobile ? 40 : 60}
                                            outerRadius={isMobile ? 70 : 80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.charts.by_type.map((entry, index) => (
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

                        {/* Income by Organization */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Organizations</h3>
                            <div className="h-[300px] w-full overflow-x-auto">
                                <div style={{ minWidth: isMobile ? 400 : '100%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.charts.by_organization} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={100} />
                                            <Tooltip formatter={(value) => `৳${Number(value).toLocaleString()}`} />
                                            <Bar dataKey="value" name="Income" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Income by Person */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Earners</h3>
                            <div className="h-[300px] w-full overflow-x-auto">
                                <div style={{ minWidth: isMobile ? 500 : '100%', height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.charts.by_person}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `৳${Number(value).toLocaleString()}`} />
                                            <Bar dataKey="value" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
