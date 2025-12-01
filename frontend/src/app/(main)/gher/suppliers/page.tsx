'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Phone, MapPin, ArrowLeft } from 'lucide-react';
import Modal from '@/components/Modal';

interface Supplier {
    id: number;
    name: string;
    phone?: string;
    address?: string;
}

interface Transaction {
    id: number;
    supplier_id: number;
    date: string;
    transaction_type: 'purchase_cash' | 'purchase_credit' | 'payment';
    amount: number;
    description?: string;
}

export default function SuppliersPage() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

    const [supplierForm, setSupplierForm] = useState({
        name: '',
        phone: '',
        address: ''
    });

    const [transactionForm, setTransactionForm] = useState({
        transaction_type: 'purchase_credit' as const,
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (supplierId: number) => {
        try {
            const res = await api.get(`/supplier-transactions/${supplierId}`);
            setTransactions(res.data);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        }
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/suppliers', supplierForm);
            setIsAddSupplierOpen(false);
            setSupplierForm({ name: '', phone: '', address: '' });
            fetchSuppliers();
        } catch (error) {
            console.error('Failed to add supplier', error);
        }
    };

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier) return;

        try {
            await api.post('/supplier-transactions', {
                supplier_id: selectedSupplier.id,
                transaction_type: transactionForm.transaction_type,
                amount: parseFloat(transactionForm.amount),
                description: transactionForm.description,
                date: new Date(transactionForm.date).toISOString()
            });
            setIsAddTransactionOpen(false);
            setTransactionForm({
                transaction_type: 'purchase_credit',
                amount: '',
                description: '',
                date: new Date().toISOString().slice(0, 16)
            });
            fetchTransactions(selectedSupplier.id);
        } catch (error) {
            console.error('Failed to add transaction', error);
        }
    };

    const handleDeleteSupplier = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch (error) {
            console.error('Failed to delete supplier', error);
        }
    };

    const calculateBalance = () => {
        let balance = 0;
        transactions.forEach(t => {
            if (t.transaction_type === 'purchase_credit') {
                balance += t.amount;
            } else if (t.transaction_type === 'payment') {
                balance -= t.amount;
            }
        });
        return balance;
    };

    if (selectedSupplier) {
        const balance = calculateBalance();

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedSupplier(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{selectedSupplier.name}</h1>
                        {selectedSupplier.phone && (
                            <p className="text-sm text-gray-600">{selectedSupplier.phone}</p>
                        )}
                    </div>
                    <button
                        onClick={() => setIsAddTransactionOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Transaction
                    </button>
                </div>

                {/* Balance Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-500">Current Balance (বাকি)</div>
                    <div className={`text-3xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ৳{balance.toLocaleString()}
                    </div>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((t) => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(t.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.transaction_type === 'purchase_cash' ? 'bg-blue-100 text-blue-800' :
                                                    t.transaction_type === 'purchase_credit' ? 'bg-red-100 text-red-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {t.transaction_type === 'purchase_cash' ? 'Cash Purchase' :
                                                    t.transaction_type === 'purchase_credit' ? 'Credit Purchase' :
                                                        'Payment'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{t.description || '-'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${t.transaction_type === 'payment' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {t.transaction_type === 'payment' ? '-' : '+'}৳{t.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Transaction Modal */}
                <Modal
                    isOpen={isAddTransactionOpen}
                    onClose={() => setIsAddTransactionOpen(false)}
                    title="Add Transaction"
                >
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={transactionForm.transaction_type}
                                onChange={(e) => setTransactionForm({ ...transactionForm, transaction_type: e.target.value as any })}
                            >
                                <option value="purchase_cash">Cash Purchase (নগদ কেনা)</option>
                                <option value="purchase_credit">Credit Purchase (বাকিতে কেনা)</option>
                                <option value="payment">Payment (পরিশোধ)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={transactionForm.amount}
                                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={transactionForm.description}
                                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                            <input
                                type="datetime-local"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={transactionForm.date}
                                onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                        >
                            Add Transaction
                        </button>
                    </form>
                </Modal>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Suppliers (দোকান)</h1>
                <button
                    onClick={() => setIsAddSupplierOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                ) : suppliers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">No suppliers yet.</div>
                ) : (
                    suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            onClick={() => {
                                setSelectedSupplier(supplier);
                                fetchTransactions(supplier.id);
                            }}
                            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSupplier(supplier.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {supplier.phone && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-2" />
                                        {supplier.phone}
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        {supplier.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isAddSupplierOpen}
                onClose={() => setIsAddSupplierOpen(false)}
                title="Add New Supplier"
            >
                <form onSubmit={handleAddSupplier} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={supplierForm.name}
                            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={supplierForm.phone}
                            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={supplierForm.address}
                            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                    >
                        Add Supplier
                    </button>
                </form>
            </Modal>
        </div>
    );
}
