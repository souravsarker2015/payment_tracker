'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface Transaction {
    id: number;
    creditor_id: number;
    amount: number;
    type: 'BORROW' | 'REPAY';
}

interface Creditor {
    id: number;
    name: string;
    phone?: string;
    creditor_type?: string;
    is_active: boolean;
}

interface CreditorWithStats extends Creditor {
    totalBorrowed: number;
    totalRepaid: number;
    balance: number;
}

export default function CreditorsPage() {
    const [creditors, setCreditors] = useState<CreditorWithStats[]>([]);
    const [summary, setSummary] = useState({
        totalRemaining: 0,
        totalPaid: 0
    });
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCreditor, setEditingCreditor] = useState<Creditor | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        creditor_type: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [creditorsRes, transactionsRes] = await Promise.all([
                api.get('/creditors'),
                api.get('/transactions')
            ]);

            const allCreditors: Creditor[] = creditorsRes.data;
            const allTransactions: Transaction[] = transactionsRes.data;

            let globalRemaining = 0;
            let globalPaid = 0;

            const creditorsWithStats = allCreditors.map(creditor => {
                const creditorTransactions = allTransactions.filter(t => t.creditor_id === creditor.id);
                const totalBorrowed = creditorTransactions
                    .filter(t => t.type === 'BORROW')
                    .reduce((acc, t) => acc + t.amount, 0);
                const totalRepaid = creditorTransactions
                    .filter(t => t.type === 'REPAY')
                    .reduce((acc, t) => acc + t.amount, 0);
                const balance = totalBorrowed - totalRepaid;

                globalRemaining += Math.max(0, balance);
                globalPaid += totalRepaid;

                return {
                    ...creditor,
                    totalBorrowed,
                    totalRepaid,
                    balance
                };
            });

            setCreditors(creditorsWithStats);
            setSummary({
                totalRemaining: globalRemaining,
                totalPaid: globalPaid
            });
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this creditor?')) return;
        try {
            await api.delete(`/creditors/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete creditor', error);
        }
    };

    const openAddModal = () => {
        setEditingCreditor(null);
        setFormData({ name: '', phone: '', creditor_type: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (creditor: Creditor) => {
        setEditingCreditor(creditor);
        setFormData({
            name: creditor.name,
            phone: creditor.phone || '',
            creditor_type: creditor.creditor_type || '',
            is_active: creditor.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone || null,
                creditor_type: formData.creditor_type || null,
                is_active: formData.is_active
            };

            if (editingCreditor) {
                await api.put(`/creditors/${editingCreditor.id}`, payload);
            } else {
                await api.post('/creditors', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to save creditor', error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Creditors</h1>
                <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={openAddModal}
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Creditor
                </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining to Pay</p>
                                <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{summary.totalRemaining}</p>
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
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{summary.totalPaid}</p>
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
                title={editingCreditor ? 'Edit Creditor' : 'Add Creditor'}
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="creditor_type" className="block text-sm font-medium text-gray-700">
                            Creditor Type <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="creditor_type"
                            value={formData.creditor_type}
                            onChange={(e) => setFormData({ ...formData, creditor_type: e.target.value })}
                            placeholder="e.g., Supplier, Friend, Family"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            Active
                        </label>
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            {editingCreditor ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            {loading ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">Loading creditors...</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm overflow-hidden sm:rounded-xl border border-gray-200">
                    <ul className="divide-y divide-gray-100">
                        {creditors.map((creditor) => {
                            const isPaid = creditor.balance <= 0;
                            return (
                                <li key={creditor.id} className="px-4 py-3 sm:px-6 hover:bg-gray-50 flex items-center justify-between transition-all duration-200">
                                    <Link href={`/creditors/${creditor.id}`} className="flex-1 block overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <p className={`text-sm font-bold truncate ${isPaid ? 'text-gray-400 line-through' : 'text-indigo-600'}`}>
                                                        {creditor.name}
                                                    </p>
                                                    {isPaid && (
                                                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-tight">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Paid
                                                        </span>
                                                    )}
                                                    <span className={`flex-shrink-0 px-1.5 py-0.5 inline-flex text-[10px] leading-3 font-bold rounded-full uppercase tracking-tight ${creditor.is_active
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {creditor.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                {(creditor.phone || creditor.creditor_type) && (
                                                    <div className="mt-0.5 flex items-center space-x-3 text-[11px] text-gray-500">
                                                        {creditor.phone && <span className="flex items-center">📞 {creditor.phone}</span>}
                                                        {creditor.creditor_type && <span className="flex items-center font-medium">🏷️ {creditor.creditor_type}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-4 sm:space-x-8 sm:ml-auto">
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Borrowed</p>
                                                    <p className="text-xs font-semibold text-gray-700">{creditor.totalBorrowed}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Paid</p>
                                                    <p className="text-xs font-semibold text-green-600">{creditor.totalRepaid}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Remaining</p>
                                                    <p className={`text-xs font-bold ${isPaid ? 'text-gray-400' : 'text-red-600'}`}>
                                                        {creditor.balance > 0 ? creditor.balance : 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                                        <button
                                            onClick={() => openEditModal(creditor)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="Edit Creditor"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(creditor.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Creditor"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                        {creditors.length === 0 && (
                            <li className="px-4 py-10 sm:px-6 text-center text-gray-400 italic">
                                No creditors found. Add one to get started.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

