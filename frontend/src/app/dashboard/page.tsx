'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Creditor {
    id: number;
    name: string;
}

interface Transaction {
    id: number;
    creditor_id: number;
    amount: number;
    type: 'BORROW' | 'REPAY';
}

interface CreditorWithBalance {
    id: number;
    name: string;
    balance: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalCreditors: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        netBalance: 0
    });
    const [creditorsWithBalance, setCreditorsWithBalance] = useState<CreditorWithBalance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [creditorsRes, transactionsRes] = await Promise.all([
                api.get('/creditors'),
                api.get('/transactions')
            ]);

            const creditors: Creditor[] = creditorsRes.data;
            const transactions: Transaction[] = transactionsRes.data;

            const totalBorrowed = transactions
                .filter((t) => t.type === 'BORROW')
                .reduce((acc, t) => acc + t.amount, 0);

            const totalRepaid = transactions
                .filter((t) => t.type === 'REPAY')
                .reduce((acc, t) => acc + t.amount, 0);

            // Calculate balance per creditor
            const creditorBalances = creditors.map(creditor => {
                const creditorTransactions = transactions.filter(t => t.creditor_id === creditor.id);
                const balance = creditorTransactions.reduce((acc, t) => {
                    if (t.type === 'BORROW') return acc + t.amount;
                    if (t.type === 'REPAY') return acc - t.amount;
                    return acc;
                }, 0);
                return { id: creditor.id, name: creditor.name, balance };
            }).filter(c => c.balance !== 0); // Only show creditors with non-zero balance

            setStats({
                totalCreditors: creditors.length,
                totalBorrowed,
                totalRepaid,
                netBalance: totalBorrowed - totalRepaid
            });
            setCreditorsWithBalance(creditorBalances);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreditorClick = (creditorId: number) => {
        router.push(`/dashboard/creditors/${creditorId}`);
    };

    if (loading) return <div>Loading...</div>;

    const chartData = creditorsWithBalance.map(c => ({
        name: c.name,
        value: Math.abs(c.balance),
        id: c.id,
        balance: c.balance
    }));

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {/* Total Creditors */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Creditors</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{stats.totalCreditors}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Net Balance */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className={`h-6 w-6 rounded-full ${stats.netBalance > 0 ? 'bg-red-100' : 'bg-green-100'}`} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Net Balance (Owed)</dt>
                                    <dd>
                                        <div className={`text-lg font-medium ${stats.netBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {stats.netBalance}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Borrowed */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ArrowDownLeft className="h-6 w-6 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Borrowed</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{stats.totalBorrowed}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Repaid */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ArrowUpRight className="h-6 w-6 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Repaid</dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900">{stats.totalRepaid}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doughnut Chart and Creditor List */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Doughnut Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Creditors by Balance</h2>
                    {chartData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={(entry: any) => `${entry.name}: ${entry.payload.balance}`}
                                        onClick={(data) => handleCreditorClick(data.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number, name: string, props: any) => [props.payload.balance, 'Balance']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No creditors with outstanding balances</p>
                    )}
                </div>

                {/* Creditor List */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Creditor Details</h2>
                    <div className="space-y-3">
                        {creditorsWithBalance.map((creditor, index) => (
                            <div
                                key={creditor.id}
                                onClick={() => handleCreditorClick(creditor.id)}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium text-gray-900">{creditor.name}</span>
                                </div>
                                <span className={`font-semibold ${creditor.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {creditor.balance}
                                </span>
                            </div>
                        ))}
                        {creditorsWithBalance.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No creditors with outstanding balances</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
