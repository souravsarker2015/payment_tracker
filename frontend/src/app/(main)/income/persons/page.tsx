'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, User, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Person {
    id: number;
    name: string;
    phone?: string;
    designation?: string;
    is_active: boolean;
}

export default function PersonsPage() {
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        designation: '',
        is_active: true
    });

    useEffect(() => {
        fetchPersons();
    }, []);

    const fetchPersons = async () => {
        try {
            const response = await api.get('/persons');
            setPersons(response.data);
        } catch (error) {
            console.error('Failed to fetch persons', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this person?')) return;
        try {
            await api.delete(`/persons/${id}`);
            fetchPersons();
        } catch (error) {
            console.error('Failed to delete person', error);
        }
    };

    const openAddModal = () => {
        setEditingPerson(null);
        setFormData({ name: '', phone: '', designation: '', is_active: true });
        setIsModalOpen(true);
    };

    const openEditModal = (person: Person) => {
        setEditingPerson(person);
        setFormData({
            name: person.name,
            phone: person.phone || '',
            designation: person.designation || '',
            is_active: person.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                phone: formData.phone || null,
                designation: formData.designation || null,
                is_active: formData.is_active
            };

            if (editingPerson) {
                await api.put(`/persons/${editingPerson.id}`, payload);
            } else {
                await api.post('/persons', payload);
            }
            setIsModalOpen(false);
            fetchPersons();
        } catch (error) {
            console.error('Failed to save person', error);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading persons..." />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Income Earners</h1>
                <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={openAddModal}
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Add Person
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPerson ? 'Edit Person' : 'Add Person'}
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
                        <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                            Designation <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="designation"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            placeholder="e.g., Manager, Developer"
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
                            {editingPerson ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {persons.map((person) => (
                        <li key={person.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <Link href={`/income/persons/${person.id}`} className="flex-1 block">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-indigo-50 rounded-full mr-3">
                                                <User className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-indigo-600 truncate hover:underline">{person.name}</p>
                                                <div className="mt-1 flex items-center space-x-3">
                                                    {person.phone && (
                                                        <p className="flex items-center text-sm text-gray-500">
                                                            📞 {person.phone}
                                                        </p>
                                                    )}
                                                    {person.designation && (
                                                        <p className="flex items-center text-sm text-gray-500">
                                                            🏷️ {person.designation}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-2 flex items-center space-x-2">
                                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${person.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {person.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={() => openEditModal(person)}
                                        className="p-2 text-gray-400 hover:text-indigo-600"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(person.id)}
                                        className="p-2 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {persons.length === 0 && (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No persons found. Add one to get started.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
