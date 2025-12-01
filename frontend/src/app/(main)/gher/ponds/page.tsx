'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Plus, Trash2, MapPin, Eye } from 'lucide-react';
import Modal from '@/components/Modal';

interface Pond {
    id: number;
    name: string;
    location: string;
    size?: string;
}

export default function PondsPage() {
    const router = useRouter();
    const [ponds, setPonds] = useState<Pond[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        size: ''
    });

    useEffect(() => {
        fetchPonds();
    }, []);

    const fetchPonds = async () => {
        try {
            const res = await api.get('/ponds');
            setPonds(res.data);
        } catch (error) {
            console.error('Failed to fetch ponds', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPond = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/ponds', formData);
            setIsAddModalOpen(false);
            setFormData({ name: '', location: '', size: '' });
            fetchPonds();
        } catch (error) {
            console.error('Failed to add pond', error);
        }
    };

    const handleDeletePond = async (id: number) => {
        if (!confirm('Are you sure you want to delete this pond?')) return;
        try {
            await api.delete(`/ponds/${id}`);
            fetchPonds();
        } catch (error) {
            console.error('Failed to delete pond', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Ponds (পুকুর)</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pond
                </button>
            </div>

            {/* Ponds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                ) : ponds.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">No ponds yet. Add your first pond!</div>
                ) : (
                    ponds.map((pond) => (
                        <div key={pond.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">{pond.name}</h3>
                                <button
                                    onClick={() => handleDeletePond(pond.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-600">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    {pond.location}
                                </div>
                                {pond.size && (
                                    <div className="text-sm text-gray-600">
                                        Size: {pond.size}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => router.push(`/gher/ponds/${pond.id}`)}
                                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-indigo-600 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Pond Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Pond"
            >
                <form onSubmit={handleAddPond} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pond Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Size (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g., 1 acre, 50 decimal"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        />
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            Add Pond
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
