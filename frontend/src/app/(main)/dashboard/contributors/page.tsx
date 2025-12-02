'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Contributor {
    id: number;
    name: string;
    is_active: boolean;
}

interface ContributorTransaction {
    id: number;
    contributor_id: number;
    amount: number;
    type: 'CONTRIBUTE' | 'RETURN';
}

interface ContributorWithBalance {
    id: number;
    name: string;
    balance: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export default function ContributorsOverviewPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalContributors: 0,
        totalLent: 0,
        totalReceived: 0,
        netBalance: 0
    });
    const [contributorsWithBalance, setContributorsWithBalance] = useState<ContributorWithBalance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [contributorsRes, contributorTransactionsRes] = await Promise.all([
                api.get('/contributors'),
                api.get('/contributor-transactions')
            ]);

            const allContributors: Contributor[] = contributorsRes.data;
            const contributorTransactions: ContributorTransaction[] = contributorTransactionsRes.data;

            const activeContributors = allContributors.filter(d => d.is_active);
            const activeContributorIds = new Set(activeContributors.map(d => d.id));
            const activeContributorTransactions = contributorTransactions.filter(t => activeContributorIds.has(t.contributor_id));

            const totalLent = activeContributorTransactions
                .filter((t) => t.type === 'CONTRIBUTE')
                .reduce((acc, t) => acc + t.amount, 0);

            const totalReceived = activeContributorTransactions
                .filter((t) => t.type === 'RETURN')
                .reduce((acc, t) => acc + t.amount, 0);

            const contributorBalances = activeContributors.map(contributor => {
                const contributorTxns = activeContributorTransactions.filter(t => t.contributor_id === contributor.id);
                const balance = contributorTxns.reduce((acc, t) => {
                    if (t.type === 'CONTRIBUTE') return acc + t.amount;
                    if (t.type === 'RETURN') return acc - t.amount;
                    return acc;
                }, 0);
                return { id: contributor.id, name: contributor.name, balance };
            }).filter(d => d.balance !== 0);

            setStats({
                totalContributors: activeContributors.length,
                totalLent,
                totalReceived,
                netBalance: totalLent - totalReceived
            });
            setContributorsWithBalance(contributorBalances);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContributorClick = (contributorId: number) => {
        router.push(`/contributors/${contributorId}`);
    };

    if (loading) return <div>Loading...</div>;

    const chartData = contributorsWithBalance.map(d => ({
        name: d.name,
        value: Math.abs(d.balance),
        id: d.id,
        balance: d.balance
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-green-900">Contributors Dashboard</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Contributors</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalContributors}</p>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Contributors by Balance</h3>
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
                                        onClick={(data) => handleContributorClick(data.id)}
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
                        <p className="text-gray-500 text-center py-8">No active contributors with outstanding balances</p>
                    )}
                </div>

                <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Contributor Details</h3>
                    <div className="space-y-3">
                        {contributorsWithBalance.map((contributor, index) => (
                            <div
                                key={contributor.id}
                                onClick={() => handleContributorClick(contributor.id)}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-200"
                            >
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="font-medium text-gray-900">{contributor.name}</span>
                                </div>
                                <span className={`font-semibold ${contributor.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {contributor.balance}
                                </span>
                            </div>
                        ))}
                        {contributorsWithBalance.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No active contributors with outstanding balances</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
