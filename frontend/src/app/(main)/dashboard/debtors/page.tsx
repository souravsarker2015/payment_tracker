'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Debtor {
    id: number;
    name: string;
    is_active: boolean;
}

interface DebtorTransaction {
    id: number;
    debtor_id: number;
    amount: number;
    type: 'LEND' | 'RECEIVE';
}

interface DebtorWithBalance {
    id: number;
    name: string;
    balance: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export default function DebtorsOverviewPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalDebtors: 0,
        totalLent: 0,
        totalReceived: 0,
        netBalance: 0
    });
    const [debtorsWithBalance, setDebtorsWithBalance] = useState<DebtorWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        fetchStats();

        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchStats = async () => {
        try {
            const [debtorsRes, debtorTransactionsRes] = await Promise.all([
                api.get('/debtors'),
                api.get('/debtor-transactions')
            ]);

            const allDebtors: Debtor[] = debtorsRes.data;
            const debtorTransactions: DebtorTransaction[] = debtorTransactionsRes.data;

            const activeDebtors = allDebtors.filter(d => d.is_active);
            const activeDebtorIds = new Set(activeDebtors.map(d => d.id));
            const activeDebtorTransactions = debtorTransactions.filter(t => activeDebtorIds.has(t.debtor_id));

            const totalLent = activeDebtorTransactions
                .filter((t) => t.type === 'LEND')
                .reduce((acc, t) => acc + t.amount, 0);

            const totalReceived = activeDebtorTransactions
                .filter((t) => t.type === 'RECEIVE')
                .reduce((acc, t) => acc + t.amount, 0);

            const debtorBalances = activeDebtors.map(debtor => {
                const debtorTxns = activeDebtorTransactions.filter(t => t.debtor_id === debtor.id);
                const balance = debtorTxns.reduce((acc, t) => {
                    if (t.type === 'LEND') return acc + t.amount;
                    if (t.type === 'RECEIVE') return acc - t.amount;
                    return acc;
                }, 0);
                return { id: debtor.id, name: debtor.name, balance };
            }).filter(d => d.balance !== 0);

            setStats({
                totalDebtors: activeDebtors.length,
                totalLent,
                totalReceived,
                netBalance: totalLent - totalReceived
            });
            setDebtorsWithBalance(debtorBalances);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDebtorClick = (debtorId: number) => {
        router.push(`/debtors/${debtorId}`);
    };

    if (loading) return <div>Loading...</div>;

    const chartData = debtorsWithBalance.map(d => ({
        name: d.name,
        value: Math.abs(d.balance),
        id: d.id,
        balance: d.balance
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-900">Debtors Dashboard</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Debtors</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDebtors}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net Balance (Owed to You)</p>
                                <p className={`text-3xl font-bold mt-2 ${stats.netBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.netBalance}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${stats.netBalance > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className={`h-6 w-6 rounded-full ${stats.netBalance > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Lent</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLent}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <ArrowUpRight className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Received</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReceived}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <ArrowDownLeft className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Debtors by Balance</h3>
                    {chartData.length > 0 ? (
                        <div className="h-80 overflow-x-auto">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={isMobile ? 40 : 50}
                                        outerRadius={isMobile ? 70 : 80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={!isMobile ? (entry: any) => `${entry.name}: ${entry.payload.balance}` : false} onClick={(data) => handleDebtorClick(data.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number, name: string, props: any) => [props.payload.balance, props.payload.name]} />
                                    <Legend
                                        wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                                        formatter={(value, entry: any) => `${entry.payload.name}: ${entry.payload.balance}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No active debtors with outstanding balances</p>
                    )}
                </div>

                <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Debtor Details</h3>
                    <div className="space-y-3">
                        {debtorsWithBalance.map((debtor, index) => (
                            <div
                                key={debtor.id}
                                onClick={() => handleDebtorClick(debtor.id)}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium text-gray-900">{debtor.name}</span>
                                </div>
                                <span className={`font-semibold ${debtor.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {debtor.balance}
                                </span>
                            </div>
                        ))}
                        {debtorsWithBalance.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No active debtors with outstanding balances</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
