'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Creditor {
    id: number;
    name: string;
    is_active: boolean;
}

interface Debtor {
    id: number;
    name: string;
    is_active: boolean;
}

interface Transaction {
    id: number;
    creditor_id: number;
    amount: number;
    type: 'BORROW' | 'REPAY';
}

interface DebtorTransaction {
    id: number;
    debtor_id: number;
    amount: number;
    type: 'LEND' | 'RECEIVE';
}

interface CreditorWithBalance {
    id: number;
    name: string;
    balance: number;
}

interface DebtorWithBalance {
    id: number;
    name: string;
    balance: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export default function DashboardPage() {
    const router = useRouter();
    const [creditorStats, setCreditorStats] = useState({
        totalCreditors: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        netBalance: 0
    });
    const [debtorStats, setDebtorStats] = useState({
        totalDebtors: 0,
        totalLent: 0,
        totalReceived: 0,
        netBalance: 0
    });
    const [creditorsWithBalance, setCreditorsWithBalance] = useState<CreditorWithBalance[]>([]);
    const [debtorsWithBalance, setDebtorsWithBalance] = useState<DebtorWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [creditorsRes, transactionsRes, debtorsRes, debtorTransactionsRes] = await Promise.all([
                api.get('/creditors'),
                api.get('/transactions'),
                api.get('/debtors'),
                api.get('/debtor-transactions')
            ]);

            const allCreditors: Creditor[] = creditorsRes.data;
            const transactions: Transaction[] = transactionsRes.data;
            const allDebtors: Debtor[] = debtorsRes.data;
            const debtorTransactions: DebtorTransaction[] = debtorTransactionsRes.data;

            // Process Creditor Stats
            const activeCreditors = allCreditors.filter(c => c.is_active);
            const activeCreditorIds = new Set(activeCreditors.map(c => c.id));
            const activeTransactions = transactions.filter(t => activeCreditorIds.has(t.creditor_id));

            const totalBorrowed = activeTransactions
                .filter((t) => t.type === 'BORROW')
                .reduce((acc, t) => acc + t.amount, 0);

            const totalRepaid = activeTransactions
                .filter((t) => t.type === 'REPAY')
                .reduce((acc, t) => acc + t.amount, 0);

            const creditorBalances = activeCreditors.map(creditor => {
                const creditorTransactions = activeTransactions.filter(t => t.creditor_id === creditor.id);
                const balance = creditorTransactions.reduce((acc, t) => {
                    if (t.type === 'BORROW') return acc + t.amount;
                    if (t.type === 'REPAY') return acc - t.amount;
                    return acc;
                }, 0);
                return { id: creditor.id, name: creditor.name, balance };
            }).filter(c => c.balance !== 0);

            setCreditorStats({
                totalCreditors: activeCreditors.length,
                totalBorrowed,
                totalRepaid,
                netBalance: totalBorrowed - totalRepaid
            });
            setCreditorsWithBalance(creditorBalances);

            // Process Debtor Stats
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

            setDebtorStats({
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

    const handleCreditorClick = (creditorId: number) => {
        router.push(`/creditors/${creditorId}`);
    };

    const handleDebtorClick = (debtorId: number) => {
        router.push(`/debtors/${debtorId}`);
    };

    if (loading) return <div>Loading...</div>;

    const creditorChartData = creditorsWithBalance.map(c => ({
        name: c.name,
        value: Math.abs(c.balance),
        id: c.id,
        balance: c.balance
    }));

    const debtorChartData = debtorsWithBalance.map(d => ({
        name: d.name,
        value: Math.abs(d.balance),
        id: d.id,
        balance: d.balance
    }));

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            {/* CREDITORS SECTION */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-indigo-900">Creditors (Money You Owe)</h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Active Creditors */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Creditors</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{creditorStats.totalCreditors}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Net Balance (Owed)</p>
                                    <p className={`text-3xl font-bold mt-2 ${creditorStats.netBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {creditorStats.netBalance}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${creditorStats.netBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                    <div className={`h-6 w-6 rounded-full ${creditorStats.netBalance > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Borrowed */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{creditorStats.totalBorrowed}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <ArrowDownLeft className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Repaid */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Repaid</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{creditorStats.totalRepaid}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <ArrowUpRight className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Creditor Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Creditors by Balance</h3>
                        {creditorChartData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={creditorChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={isMobile ? 40 : 60}
                                            outerRadius={isMobile ? 70 : 100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={!isMobile ? (entry: any) => `${entry.name}: ${entry.payload.balance}` : undefined}
                                            onClick={(data) => handleCreditorClick(data.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {creditorChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string, props: any) => [props.payload.balance, 'Balance']} />
                                        <Legend
                                            layout="horizontal"
                                            verticalAlign="bottom"
                                            align="center"
                                            wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                                            formatter={(value: string, entry: any) => `${value}: ${entry.payload.balance}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No active creditors with outstanding balances</p>
                        )}
                    </div>

                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Creditor Details</h3>
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
                                <p className="text-gray-500 text-center py-4">No active creditors with outstanding balances</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DEBTORS SECTION */}
            <div className="space-y-6 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-green-900">Debtors (Money Owed to You)</h2>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Active Debtors */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Debtors</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{debtorStats.totalDebtors}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <Users className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Net Balance (Owed to You)</p>
                                    <p className={`text-3xl font-bold mt-2 ${debtorStats.netBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {debtorStats.netBalance}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-lg ${debtorStats.netBalance > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className={`h-6 w-6 rounded-full ${debtorStats.netBalance > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Lent */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Lent</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{debtorStats.totalLent}</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <ArrowUpRight className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Received */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Received</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">{debtorStats.totalReceived}</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <ArrowDownLeft className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Debtor Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Debtors by Balance</h3>
                        {debtorChartData.length > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={debtorChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={isMobile ? 40 : 60}
                                            outerRadius={isMobile ? 70 : 100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={!isMobile ? (entry: any) => `${entry.name}: ${entry.payload.balance}` : undefined}
                                            onClick={(data) => handleDebtorClick(data.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {debtorChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string, props: any) => [props.payload.balance, 'Balance']} />
                                        <Legend
                                            layout="horizontal"
                                            verticalAlign="bottom"
                                            align="center"
                                            wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                                            formatter={(value: string, entry: any) => `${value}: ${entry.payload.balance}`}
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
        </div>
    );
}
