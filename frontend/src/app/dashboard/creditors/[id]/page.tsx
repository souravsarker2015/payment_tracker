'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowDownLeft, ArrowUpRight, Edit2, Trash2, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import Modal from '@/components/Modal';

interface Transaction {
    id: number;
    amount: number;
    type: 'BORROW' | 'REPAY';
    date: string;
    note?: string;
}

interface Creditor {
    id: number;
    name: string;
    phone: string;
    transactions: Transaction[];
}

export default function CreditorDetailsPage() {
    const params = useParams();
    const id = params.id;
    const [creditor, setCreditor] = useState<Creditor | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'BORROW' | 'REPAY'>('BORROW');
    const [note, setNote] = useState('');

    // Add Transaction Modal State
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

    // Transaction Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [modalAmount, setModalAmount] = useState('');
    const [modalType, setModalType] = useState<'BORROW' | 'REPAY'>('BORROW');
    const [modalNote, setModalNote] = useState('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [creditorRes, transactionsRes] = await Promise.all([
                api.get(`/creditors/${id}`),
                api.get('/transactions')
            ]);

            setCreditor(creditorRes.data);
            const allTransactions = transactionsRes.data;
            const creditorTransactions = allTransactions.filter((t: any) => t.creditor_id === Number(id));
            // Sort by date ascending for chart
            creditorTransactions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setTransactions(creditorTransactions);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !id) return;

        try {
            await api.post('/transactions', {
                creditor_id: Number(id),
                amount: Number(amount),
                type,
                note
            });
            setAmount('');
            setNote('');
            setIsAddTransactionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to add transaction', error);
        }
    };

    const handleDeleteTransaction = async (transactionId: number) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await api.delete(`/transactions/${transactionId}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete transaction', error);
        }
    };

    const openEditTransactionModal = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setModalAmount(transaction.amount.toString());
        setModalType(transaction.type);
        setModalNote(transaction.note || '');
        setIsTransactionModalOpen(true);
    };

    const handleUpdateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        try {
            await api.put(`/transactions/${editingTransaction.id}`, {
                creditor_id: Number(id),
                amount: Number(modalAmount),
                type: modalType,
                note: modalNote
            });
            setIsTransactionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to update transaction', error);
        }
    };

    const calculateBalance = () => {
        return transactions.reduce((acc, t) => {
            if (t.type === 'BORROW') return acc + t.amount;
            if (t.type === 'REPAY') return acc - t.amount;
            return acc;
        }, 0);
    };

    const getChartData = () => {
        let balance = 0;
        return transactions.map(t => {
            if (t.type === 'BORROW') balance += t.amount;
            if (t.type === 'REPAY') balance -= t.amount;
            return {
                date: new Date(t.date).toLocaleDateString(),
                balance: balance,
                amount: t.amount,
                type: t.type
            };
        });
    };

    if (loading) return <div>Loading...</div>;
    if (!creditor) return <div>Creditor not found</div>;

    const balance = calculateBalance();
    const chartData = getChartData();

    return (
        <div className="space-y-6">
            {/* Creditor Header with Add Transaction Button */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            {creditor.name}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">{creditor.phone}</p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <div className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Balance: {balance}
                        </div>
                        <button
                            onClick={() => setIsAddTransactionModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Add Transaction
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History - Full Width */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Transaction History</h3>
                    <div className="flow-root">
                        <ul className="-my-5 divide-y divide-gray-200">
                            {transactions.slice().reverse().map((transaction) => (
                                <li key={transaction.id} className="py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {transaction.type === 'BORROW' ? (
                                                <ArrowDownLeft className="h-6 w-6 text-red-500" />
                                            ) : (
                                                <ArrowUpRight className="h-6 w-6 text-green-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {transaction.type}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </p>
                                            {transaction.note && <p className="text-xs text-gray-400">{transaction.note}</p>}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'BORROW' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {transaction.amount}
                                            </span>
                                            <button
                                                onClick={() => openEditTransactionModal(transaction)}
                                                className="text-gray-400 hover:text-indigo-600"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTransaction(transaction.id)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {transactions.length === 0 && <li className="py-4 text-gray-500 text-sm">No transactions yet.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Charts - Side by Side */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Balance History Chart */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Balance History</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="balance" stroke="#4f46e5" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Borrow vs Repay */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Transaction Breakdown</h3>
                    {transactions.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            {
                                                name: 'Borrowed',
                                                value: transactions.filter(t => t.type === 'BORROW').reduce((acc, t) => acc + t.amount, 0),
                                                fill: '#ef4444'
                                            },
                                            {
                                                name: 'Repaid',
                                                value: transactions.filter(t => t.type === 'REPAY').reduce((acc, t) => acc + t.amount, 0),
                                                fill: '#22c55e'
                                            }
                                        ].filter(d => d.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No transactions yet</p>
                    )}
                </div>
            </div>

            {/* Add Transaction Modal */}
            <Modal
                isOpen={isAddTransactionModalOpen}
                onClose={() => setIsAddTransactionModalOpen(false)}
                title="Add Transaction"
            >
                <form onSubmit={handleAddTransaction} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            id="amount"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'BORROW' | 'REPAY')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        >
                            <option value="BORROW">Borrow (Take Money)</option>
                            <option value="REPAY">Repay (Give Money)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note</label>
                        <input
                            type="text"
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            Add Transaction
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Transaction Modal */}
            <Modal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                title="Edit Transaction"
            >
                <form onSubmit={handleUpdateTransaction} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="modalAmount" className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            id="modalAmount"
                            required
                            value={modalAmount}
                            onChange={(e) => setModalAmount(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="modalType" className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            id="modalType"
                            value={modalType}
                            onChange={(e) => setModalType(e.target.value as 'BORROW' | 'REPAY')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        >
                            <option value="BORROW">Borrow (Take Money)</option>
                            <option value="REPAY">Repay (Give Money)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="modalNote" className="block text-sm font-medium text-gray-700">Note</label>
                        <input
                            type="text"
                            id="modalNote"
                            value={modalNote}
                            onChange={(e) => setModalNote(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            Update Transaction
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
