'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, Building2 } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Organization {
    id: number;
    name: string;
    address?: string;
    contact_person?: string;
    phone?: string;
    is_active: boolean;
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact_person: '',
        phone: '',
        is_active: true
    });

    useEffect(() => {
        fetchOrganizations();
    }, []);

    const fetchOrganizations = async () => {
        try {
            const response = await api.get('/organizations');
            setOrganizations(response.data);
        } catch (error) {
            console.error('Failed to fetch organizations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this organization?')) return;
        try {
            await api.delete(`/organizations/${id}`);
            fetchOrganizations();
        } catch (error) {
            console.error('Failed to delete organization', error);
        }
    };

    const openAddModal = () => {
        setEditingOrg(null);
        setFormData({ name: '', address: '', contact_person: '', phone: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (org: Organization) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            address: org.address || '',
            contact_person: org.contact_person || '',
            phone: org.phone || '',
            is_active: org.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                address: formData.address || null,
                contact_person: formData.contact_person || null,
                phone: formData.phone || null,
                is_active: formData.is_active
            };

            if (editingOrg) {
                await api.put(`/organizations/${editingOrg.id}`, payload);
            } else {
                await api.post('/organizations', payload);
            }
            setIsModalOpen(false);
            fetchOrganizations();
        } catch (error) {
            console.error('Failed to save organization', error);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading organizations..." />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Income Sources (Organizations)</h1>
                <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    onClick={openAddModal}
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Organization
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingOrg ? 'Edit Organization' : 'Add Organization'}
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                        />
                    </div>

                    <div>
                        <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
                            Contact Person <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="contact_person"
                            value={formData.contact_person}
                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-black"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            Active
                        </label>
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:text-sm"
                        >
                            {editingOrg ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {organizations.map((org) => (
                        <li key={org.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                            <div className="flex-1 block">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-orange-50 rounded-full mr-3">
                                            <Building2 className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <p className="text-sm font-medium text-orange-600 truncate">{org.name}</p>
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {org.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex flex-col space-y-1 ml-12">
                                        {org.address && (
                                            <p className="flex items-center text-sm text-gray-500">
                                                📍 {org.address}
                                            </p>
                                        )}
                                        {(org.contact_person || org.phone) && (
                                            <p className="flex items-center text-sm text-gray-500">
                                                👤 {org.contact_person} {org.phone && `• 📞 ${org.phone}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                                <button
                                    onClick={() => openEditModal(org)}
                                    className="p-2 text-gray-400 hover:text-orange-600"
                                >
                                    <Edit2 className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(org.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {organizations.length === 0 && (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No organizations found. Add one to get started.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
