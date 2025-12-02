'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Contributor {
    id: number;
    name: string;
    phone?: string;
    contributor_type?: string;
    is_active: boolean;
}

interface ContributorTransaction {
    id: number;
    contributor_id: number;
    amount: number;
    type: 'CONTRIBUTE' | 'RETURN';
    date: string;
    note?: string;
}

const COLORS = ['#10b981', '#ef4444']; // Green for CONTRIBUTE, Red for RETURN

export default function ContributorDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    
    const [contributor, setContributor] = useState<Contributor | null>(null);
    const [transactions, setTransactions] = useState<ContributorTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'CONTRIBUTE' | 'RETURN'>('CONTRIBUTE');
    const [note, setNote] = useState('');
    const [transactionDate, setTransactionDate] = useState('');

    // Add Transaction Modal State
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

    // Transaction Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<ContributorTransaction | null>(null);
    const [modalAmount, setModalAmount] = useState('');
    const [modalType, setModalType] = useState<'CONTRIBUTE' | 'RETURN'>('CONTRIBUTE');
    const [modalNote, setModalNote] = useState('');
    const [modalTransactionDate, setModalTransactionDate] = useState('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [contributorRes, transactionsRes] = await Promise.all([
                api.get(`/contributors/${id}`),
                api.get('/contributor-transactions')
            ]);
            setContributor(contributorRes.data);
            const contributorTransactions = transactionsRes.data.filter((t: ContributorTransaction) => t.contributor_id === Number(id));
            setTransactions(contributorTransactions);
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
            const payload: any = {
                contributor_id: Number(id),
                amount: Number(amount),
                type,
                note
            };
            
            if (transactionDate) {
                payload.date = new Date(transactionDate).toISOString();
            }
            
            await api.post('/contributor-transactions', payload);
            setAmount('');
            setNote('');
            setTransactionDate('');
            setIsAddTransactionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to add transaction', error);
        }
    };

    const handleDeleteTransaction = async (transactionId: number) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await api.delete(`/contributor-transactions/${transactionId}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete transaction', error);
        }
    };

    const openEditTransactionModal = (transaction: ContributorTransaction) => {
        setEditingTransaction(transaction);
        setModalAmount(transaction.amount.toString());
        setModalType(transaction.type);
        setModalNote(transaction.note || '');
        const date = new Date(transaction.date);
        const formattedDate = date.toISOString().slice(0, 16);
        setModalTransactionDate(formattedDate);
        setIsTransactionModalOpen(true);
    };

    const handleUpdateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        try {
            const payload: any = {
                contributor_id: Number(id),
                amount: Number(modalAmount),
                type: modalType,
                note: modalNote
            };
            
            if (modalTransactionDate) {
                payload.date = new Date(modalTransactionDate).toISOString();
            }
            
            await api.put(`/contributor-transactions/${editingTransaction.id}`, payload);
            setIsTransactionModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to update transaction', error);
        }
    };

    const calculateBalance = () => {
        return transactions.reduce((acc, t) => {
            if (t.type === 'CONTRIBUTE') return acc + t.amount;
            if (t.type === 'RETURN') return acc - t.amount;
            return acc;
        }, 0);
    };

    const getBalanceHistory = () => {
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        let balance = 0;
        return sortedTransactions.map(t => {
            if (t.type === 'CONTRIBUTE') balance += t.amount;
            if (t.type === 'RETURN') balance -= t.amount;
            return {
                date: new Date(t.date).toLocaleDateString(),
                balance: balance
            };
        });
    };

    const getTransactionBreakdown = () => {
        const lent = transactions
            .filter(t => t.type === 'CONTRIBUTE')
            .reduce((acc, t) => acc + t.amount, 0);
        const received = transactions
            .filter(t => t.type === 'RETURN')
            .reduce((acc, t) => acc + t.amount, 0);
        
        const data = [];
        if (lent > 0) data.push({ name: 'Lent', value: lent });
        if (received > 0) data.push({ name: 'Received', value: received });
        return data;
    };

    if (loading) return <div>Loading...</div>;
    if (!contributor) return <div>Contributor not found</div>;

    const balance = calculateBalance();
    const balanceHistory = getBalanceHistory();
    const transactionBreakdown = getTransactionBreakdown();

    return (
        <div>
            {/* Contributor Header Card */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{contributor.name}</h1>
                        {contributor.phone && <p className="text-gray-500 mt-1">📞 {contributor.phone}</p>}
                        {contributor.contributor_type && <p className="text-gray-500 mt-1">🏷️ {contributor.contributor_type}</p>}
                        <div className="mt-4">
                            <p className="text-sm text-gray-500">Current Balance (They Owe You)</p>
                            <p className={`text-3xl font-bold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {balance}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddTransactionModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Add Transaction
                    </button>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
                <div className="space-y-3">
                    {transactions.slice().reverse().map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        transaction.type === 'CONTRIBUTE' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {transaction.type}
                                    </span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {transaction.amount}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </span>
                                </div>
                                {transaction.note && (
                                    <p className="text-sm text-gray-600 mt-1">{transaction.note}</p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => openEditTransactionModal(transaction)}
                                    className="p-2 text-gray-400 hover:text-green-600"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No transactions yet</p>
                    )}
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
                {/* Balance History Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Balance History</h2>
                    {balanceHistory.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={balanceHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No transaction history yet</p>
                    )}
                </div>

                {/* Transaction Breakdown Pie Chart */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Breakdown</h2>
                    {transactionBreakdown.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={transactionBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {transactionBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'CONTRIBUTE' | 'RETURN')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        >
                            <option value="CONTRIBUTE">CONTRIBUTE (You give money)</option>
                            <option value="RETURN">RETURN (They pay you back)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700">Note</label>
                        <input
                            type="text"
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
                            Date & Time <span className="text-gray-400">(optional, defaults to now)</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="transactionDate"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="modalType" className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            id="modalType"
                            value={modalType}
                            onChange={(e) => setModalType(e.target.value as 'CONTRIBUTE' | 'RETURN')}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        >
                            <option value="CONTRIBUTE">CONTRIBUTE (You give money)</option>
                            <option value="RETURN">RETURN (They pay you back)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="modalNote" className="block text-sm font-medium text-gray-700">Note</label>
                        <input
                            type="text"
                            id="modalNote"
                            value={modalNote}
                            onChange={(e) => setModalNote(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="modalTransactionDate" className="block text-sm font-medium text-gray-700">
                            Date & Time
                        </label>
                        <input
                            type="datetime-local"
                            id="modalTransactionDate"
                            value={modalTransactionDate}
                            onChange={(e) => setModalTransactionDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                        >
                            Update Transaction
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
