'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface Debtor {
    id: number;
    name: string;
    phone?: string;
    debtor_type?: string;
    is_active: boolean;
}

export default function DebtorsPage() {
    const [debtors, setDebtors] = useState<Debtor[]>([]);
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
        fetchDebtors();
    }, []);

    const fetchDebtors = async () => {
        try {
            const response = await api.get('/debtors');
            setDebtors(response.data);
        } catch (error) {
            console.error('Failed to fetch debtors', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this debtor?')) return;
        try {
            await api.delete(`/debtors/${id}`);
            fetchDebtors();
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
            fetchDebtors();
        } catch (error) {
            console.error('Failed to save debtor', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Debtors</h1>
                <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={openAddModal}
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Debtor
                </button>
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
                <p>Loading...</p>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {debtors.map((debtor) => (
                            <li key={debtor.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                <Link href={`/debtors/${debtor.id}`} className="flex-1 block">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-green-600 truncate">{debtor.name}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${debtor.is_active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {debtor.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex space-x-4">
                                            {debtor.phone && (
                                                <p className="flex items-center text-sm text-gray-500">
                                                    📞 {debtor.phone}
                                                </p>
                                            )}
                                            {debtor.debtor_type && (
                                                <p className="flex items-center text-sm text-gray-500">
                                                    🏷️ {debtor.debtor_type}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={() => openEditModal(debtor)}
                                        className="p-2 text-gray-400 hover:text-green-600"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(debtor.id)}
                                        className="p-2 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                        {debtors.length === 0 && (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No debtors found. Add one to get started.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
