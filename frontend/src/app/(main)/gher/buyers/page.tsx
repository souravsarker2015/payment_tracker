'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, Users, Search, MapPin, Phone, ArrowDownLeft, ArrowUpRight, Eye, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';

interface FishBuyer {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    total_bought?: number;
    total_paid?: number;
    balance?: number;
}

export default function FishBuyersPage() {
    const router = useRouter();
    const [buyers, setBuyers] = useState<FishBuyer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBuyer, setEditingBuyer] = useState<FishBuyer | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchBuyers();
    }, []);

    const fetchBuyers = async () => {
        try {
            const res = await api.get('/fish-buyers');
            setBuyers(res.data);
        } catch (error) {
            console.error('Failed to fetch fish buyers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone || null,
                address: formData.address || null
            };

            if (editingBuyer) {
                await api.put(`/fish-buyers/${editingBuyer.id}`, payload);
            } else {
                await api.post('/fish-buyers', payload);
            }

            setIsModalOpen(false);
            setEditingBuyer(null);
            setFormData({ name: '', phone: '', address: '' });
            fetchBuyers();
        } catch (error) {
            console.error('Failed to save fish buyer', error);
            alert('Failed to save buyer. Please try again.');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this buyer?')) return;
        try {
            await api.delete(`/fish-buyers/${id}`);
            fetchBuyers();
        } catch (error) {
            console.error('Failed to delete fish buyer', error);
            alert('Failed to delete buyer.');
        }
    };

    const openEditModal = (e: React.MouseEvent, buyer: FishBuyer) => {
        e.stopPropagation();
        setEditingBuyer(buyer);
        setFormData({
            name: buyer.name,
            phone: buyer.phone || '',
            address: buyer.address || ''
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingBuyer(null);
        setFormData({ name: '', phone: '', address: '' });
        setIsModalOpen(true);
    };

    const filteredBuyers = buyers.filter(buyer =>
        buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (buyer.phone && buyer.phone.includes(searchTerm))
    );

    const totalReceivable = buyers.reduce((sum, buyer) => sum + (buyer.balance || 0), 0);
    const totalReceived = buyers.reduce((sum, buyer) => sum + (buyer.total_paid || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Fish Buyers & Ledger (আড়ৎ/ক্রেতা)</h1>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Buyer
                </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Receivable (পাওনা)</p>
                                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1">৳{totalReceivable.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received (আদায়)</p>
                                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">৳{totalReceived.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search buyers by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <LoadingSpinner message="Loading buyers..." />
                    </div>
                ) : filteredBuyers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p>No buyers found</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredBuyers.map((buyer) => {
                            const isFullyPaid = (buyer.balance || 0) <= 0;
                            return (
                                <li
                                    key={buyer.id}
                                    className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/gher/buyers/${buyer.id}`)}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isFullyPaid ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                                                {isFullyPaid ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Users className="h-5 w-5 text-indigo-600" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`text-sm font-bold truncate ${isFullyPaid ? 'text-gray-500' : 'text-gray-900'}`}>
                                                        {buyer.name}
                                                    </h3>
                                                    {isFullyPaid && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                            Paid
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs text-gray-500">
                                                    {buyer.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {buyer.phone}
                                                        </div>
                                                    )}
                                                    {buyer.address && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {buyer.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 w-full sm:w-auto mt-2 sm:mt-0">
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Spent</p>
                                                <p className="text-xs font-semibold text-gray-700">৳{(buyer.total_bought || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Paid</p>
                                                <p className="text-xs font-semibold text-emerald-600">৳{(buyer.total_paid || 0).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Due</p>
                                                <p className={`text-sm font-bold ${(buyer.balance || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    ৳{(buyer.balance || 0).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 pl-4 border-l border-gray-100 hidden sm:flex">
                                                <button
                                                    onClick={(e) => openEditModal(e, buyer)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="Edit Buyer"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, buyer.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete Buyer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingBuyer ? 'Edit Buyer' : 'Add New Buyer'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Buyer or Arot Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="01..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
                        <textarea
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border text-gray-900"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Address details"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {editingBuyer ? 'Update Buyer' : 'Add Buyer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
