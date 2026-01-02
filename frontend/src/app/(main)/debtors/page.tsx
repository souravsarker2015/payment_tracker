'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface DebtorTransaction {
    id: number;
    debtor_id: number;
    amount: number;
    type: 'LEND' | 'RECEIVE';
}

interface Debtor {
    id: number;
    name: string;
    phone?: string;
    debtor_type?: string;
    is_active: boolean;
}

interface DebtorWithStats extends Debtor {
    totalLent: number;
    totalReceived: number;
    balance: number;
}

export default function DebtorsPage() {
    const [debtors, setDebtors] = useState<DebtorWithStats[]>([]);
    const [summary, setSummary] = useState({
        totalRemaining: 0,
        totalReceived: 0
    });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        debtor_type: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [debtorsRes, transactionsRes] = await Promise.all([
                api.get('/debtors'),
                api.get('/debtor-transactions')
            ]);

            const allDebtors: Debtor[] = debtorsRes.data;
            const allTransactions: DebtorTransaction[] = transactionsRes.data;

            let globalRemaining = 0;
            let globalReceived = 0;

            const debtorsWithStats = allDebtors.map(debtor => {
                const debtorTransactions = allTransactions.filter(t => t.debtor_id === debtor.id);
                const totalLent = debtorTransactions
                    .filter(t => t.type === 'LEND')
                    .reduce((acc, t) => acc + t.amount, 0);
                const totalReceived = debtorTransactions
                    .filter(t => t.type === 'RECEIVE')
                    .reduce((acc, t) => acc + t.amount, 0);
                const balance = totalLent - totalReceived;

                globalRemaining += Math.max(0, balance);
                globalReceived += totalReceived;

                return {
                    ...debtor,
                    totalLent,
                    totalReceived,
                    balance
                };
            });

            setDebtors(debtorsWithStats);
            setSummary({
                totalRemaining: globalRemaining,
                totalReceived: globalReceived
            });
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this debtor?')) return;
        try {
            await api.delete(`/debtors/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete debtor', error);
        }
    };

    const openAddModal = () => {
        setEditingDebtor(null);
        setFormData({ name: '', phone: '', debtor_type: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (debtor: Debtor) => {
        setEditingDebtor(debtor);
        setFormData({
            name: debtor.name,
            phone: debtor.phone || '',
            debtor_type: debtor.debtor_type || '',
            is_active: debtor.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone || null,
                debtor_type: formData.debtor_type || null,
                is_active: formData.is_active
            };

            if (editingDebtor) {
                await api.put(`/debtors/${editingDebtor.id}`, payload);
            } else {
                await api.post('/debtors', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save debtor', error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Debtors</h1>
                <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={openAddModal}
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Debtor
                </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining to Receive</p>
                                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{summary.totalRemaining.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{summary.totalReceived.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDebtor ? 'Edit Debtor' : 'Add Debtor'}
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="debtor_type" className="block text-sm font-medium text-gray-700">
                            Debtor Type <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="debtor_type"
                            value={formData.debtor_type}
                            onChange={(e) => setFormData({ ...formData, debtor_type: e.target.value })}
                            placeholder="e.g., Friend, Family, Business"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-black"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            Active
                        </label>
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                        >
                            {editingDebtor ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {loading ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">Loading debtors...</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm overflow-hidden sm:rounded-xl border border-gray-200">
                    <ul className="divide-y divide-gray-100">
                        {debtors.map((debtor) => {
                            const isPaid = debtor.balance <= 0;
                            return (
                                <li key={debtor.id} className="px-4 py-3 sm:px-6 hover:bg-gray-50 flex items-center justify-between transition-all duration-200">
                                    <Link href={`/debtors/${debtor.id}`} className="flex-1 block overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <p className={`text-sm font-bold truncate ${isPaid ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                                                        {debtor.name}
                                                    </p>
                                                    {isPaid && (
                                                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-tight">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Paid
                                                        </span>
                                                    )}
                                                    <span className={`flex-shrink-0 px-1.5 py-0.5 inline-flex text-[10px] leading-3 font-bold rounded-full uppercase tracking-tight ${debtor.is_active
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {debtor.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                {(debtor.phone || debtor.debtor_type) && (
                                                    <div className="mt-0.5 flex items-center space-x-3 text-[11px] text-gray-500">
                                                        {debtor.phone && <span className="flex items-center">📞 {debtor.phone}</span>}
                                                        {debtor.debtor_type && <span className="flex items-center font-medium">🏷️ {debtor.debtor_type}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-4 sm:space-x-8 sm:ml-auto">
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Lent</p>
                                                    <p className="text-xs font-semibold text-gray-700">{debtor.totalLent.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Received</p>
                                                    <p className="text-xs font-semibold text-green-600">{debtor.totalReceived.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Remaining</p>
                                                    <p className={`text-xs font-bold ${isPaid ? 'text-gray-400' : 'text-red-600'}`}>
                                                        {debtor.balance > 0 ? debtor.balance.toLocaleString() : 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                                        <button
                                            onClick={() => openEditModal(debtor)}
                                            className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                                            title="Edit Debtor"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(debtor.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Debtor"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                        {debtors.length === 0 && (
                            <li className="px-4 py-10 sm:px-6 text-center text-gray-400 italic">
                                No debtors found. Add one to get started.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
