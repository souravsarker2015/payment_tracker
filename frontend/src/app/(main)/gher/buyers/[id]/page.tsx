'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Wallet, ShoppingCart, Calendar, Plus, Phone, MapPin, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';

interface Transaction {
    id: number;
    amount: number;
    date: string;
    transaction_type: 'payment' | 'due';
    note?: string;
}

interface Sale {
    id: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    date: string;
    payment_status: string;
}

interface FishBuyerDetails {
    buyer: {
        id: number;
        name: string;
        phone: string | null;
        address: string | null;
    };
    stats: {
        total_bought: number;
        total_paid: number;
        balance: number;
    };
    sales: Sale[];
    transactions: Transaction[];
}

export default function BuyerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<FishBuyerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Forms
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: new Date().toISOString().slice(0, 16),
        note: ''
    });

    useEffect(() => {
        fetchDetails();
    }, [params.id]);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/fish-buyers/${params.id}`);
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch buyer details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                amount: parseFloat(paymentForm.amount),
                date: new Date(paymentForm.date).toISOString(),
                transaction_type: 'payment',
                note: paymentForm.note
            };
            await api.post(`/fish-buyers/${params.id}/transactions`, payload);
            setIsPaymentModalOpen(false);
            setPaymentForm({
                amount: '',
                date: new Date().toISOString().slice(0, 16),
                note: ''
            });
            fetchDetails();
        } catch (error) {
            console.error('Failed to add payment', error);
            alert('Failed to record payment');
        }
    };

    if (loading) return <LoadingSpinner message="Loading buyer ledger..." />;
    if (!data) return <div className="text-center py-12">Buyer not found</div>;

    const combinedHistory = [
        ...data.sales.map(s => ({
            ...s,
            type: 'sale',
            sortDate: new Date(s.date)
        })),
        ...data.transactions.map(t => ({
            ...t,
            type: 'transaction',
            sortDate: new Date(t.date)
        }))
    ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{data.buyer.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {data.buyer.phone && (
                            <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {data.buyer.phone}
                            </div>
                        )}
                        {data.buyer.address && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {data.buyer.address}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Bought</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">৳{data.stats.total_bought.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <ShoppingCart className="h-6 w-6 text-gray-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Paid</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">৳{data.stats.total_paid.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <Wallet className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Current Due</p>
                            <p className={`text-2xl font-bold mt-1 ${data.stats.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                ৳{data.stats.balance.toLocaleString()}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Add Payment
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit (Bought)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit (Paid)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {combinedHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                                        No history found for this buyer.
                                    </td>
                                </tr>
                            ) : (
                                combinedHistory.map((item: any, idx) => {
                                    const isSale = item.type === 'sale';
                                    return (
                                        <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(item.date).toLocaleDateString()}
                                                <div className="text-xs text-gray-400">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isSale ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                    {isSale ? 'Fish Sale' : 'Payment Received'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {isSale ? (
                                                    <span>Sale #{item.id} - Status: {item.payment_status}</span>
                                                ) : (
                                                    <span>{item.note || 'Manual Payment'}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                {isSale ? `৳${item.total_amount.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-emerald-600">
                                                {isSale ? (item.paid_amount > 0 ? `৳${item.paid_amount.toLocaleString()}` : '-') : `৳${item.amount.toLocaleString()}`}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Record Payment (Taka Joma)"
            >
                <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={paymentForm.date}
                            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount (Taka)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            placeholder="e.g. 5000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Note (Optional)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={paymentForm.note}
                            onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                            placeholder="e.g. Bkash payment"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Record Payment
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
