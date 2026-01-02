'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FishCategory {
    id: number;
    name: string;
}

export default function FishCategoriesPage() {
    const [categories, setCategories] = useState<FishCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FishCategory | null>(null);
    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/fish-categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category: FishCategory | null = null) => {
        setEditingCategory(category);
        setFormData({
            name: category ? category.name : ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/fish-categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/fish-categories', formData);
            }
            setIsModalOpen(false);
            setFormData({ name: '' });
            fetchCategories();
        } catch (error) {
            console.error('Failed to save category', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/fish-categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category', error);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading categories..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Fish Categories (মাছের ধরন)</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No categories yet. Add your first category!
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Tag className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleOpenModal(category)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="Edit Category"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete Category"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCategory ? 'Edit Fish Category' : 'Add New Fish Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., White Fish, Catfish"
                        />
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            {editingCategory ? 'Update Category' : 'Add Category'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
