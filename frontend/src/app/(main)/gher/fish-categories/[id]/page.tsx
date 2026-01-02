'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, TrendingUp, DollarSign, Package, BarChart3, Calendar, Fish as FishIcon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CategoryStats {
    category: {
        id: number;
        name: string;
    };
    total_sales: number;
    total_quantity_sold: number;
    sales_count: number;
    fish_count: number;
    sales_by_date: Record<string, { amount: number; quantity: number }>;
    sales_by_fish: Record<string, { amount: number; quantity: number; sales_count: number }>;
}

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const categoryId = params.id;

    const [stats, setStats] = useState<CategoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterMode, setFilterMode] = useState<'year' | 'year_range' | 'date_range'>('year');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
    const [endYear, setEndYear] = useState<number>(new Date().getFullYear());
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    useEffect(() => {
        if (categoryId) {
            fetchStats();
        }
    }, [categoryId, filterMode, selectedYear, startYear, endYear, startDate, endDate]);

    const fetchStats = async () => {
        try {
            let params: any = {};

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

            const res = await api.get(`/fish-categories/${categoryId}/stats`, { params });
            setStats(res.data);

            // Generate available years (current year and past 10 years)
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 11 }, (_, i) => currentYear - i);
            setAvailableYears(years);
        } catch (error) {
            console.error('Failed to fetch category stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading category details..." />;
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Category not found</div>
            </div>
        );
    }

    // Convert sales_by_date to array and sort by date
    const salesTrend = Object.entries(stats.sales_by_date)
        .map(([date, data]) => ({
            date,
            ...data
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Convert sales_by_fish to array and sort by amount
    const fishBreakdown = Object.entries(stats.sales_by_fish)
        .map(([name, data]) => ({
            name,
            ...data
        }))
        .sort((a, b) => b.amount - a.amount);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{stats.category.name}</h1>
                        <p className="text-sm text-gray-500">
                            Fish Category • {stats.fish_count} fish varieties
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Sales</p>
                            <p className="text-2xl font-bold text-green-600">৳{stats.total_sales.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.sales_count} transactions</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Quantity Sold</p>
                            <p className="text-2xl font-bold text-indigo-600">{stats.total_quantity_sold.toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">units</p>
                        </div>
                        <Package className="h-8 w-8 text-indigo-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Fish Varieties</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.fish_count}</p>
                            <p className="text-xs text-gray-400 mt-1">in this category</p>
                        </div>
                        <FishIcon className="h-8 w-8 text-blue-600 opacity-20" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Average per Sale</p>
                            <p className="text-2xl font-bold text-purple-600">
                                ৳{stats.sales_count > 0 ? (stats.total_sales / stats.sales_count).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">per transaction</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Sales by Fish Breakdown */}
            {fishBreakdown.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Fish Variety</h3>
                    <div className="space-y-3">
                        {fishBreakdown.map((fish, idx) => {
                            const percentage = (fish.amount / stats.total_sales) * 100;
                            const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-green-500'];
                            return (
                                <div key={fish.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 font-medium">{fish.name}</span>
                                        <span className="font-semibold">৳{fish.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`${colors[idx % colors.length]} h-3 rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {fish.quantity.toLocaleString()} units • {fish.sales_count} sales
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sales History */}
            {salesTrend.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">Sales History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {salesTrend.map((sale) => (
                                    <tr key={sale.date} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(sale.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {sale.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                                            ৳{sale.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        Total
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        {stats.total_quantity_sold.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">
                                        ৳{stats.total_sales.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* No sales message */}
            {salesTrend.length === 0 && (
                <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No sales recorded for this category yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Sales will appear here once you record them in the Fish Sales section.</p>
                </div>
            )}
        </div>
    );
}
