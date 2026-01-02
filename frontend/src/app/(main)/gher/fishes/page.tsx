'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, Fish as FishIcon, Layers, Check, X } from 'lucide-react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface FishCategory {
    id: number;
    name: string;
}

interface Fish {
    id: number;
    name: string;
    category_id?: number;
}

export default function FishesPage() {
    const [fishes, setFishes] = useState<Fish[]>([]);
    const [categories, setCategories] = useState<FishCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFish, setEditingFish] = useState<Fish | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '' as string | number
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [quickCategoryName, setQuickCategoryName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [fishesRes, categoriesRes] = await Promise.all([
                api.get('/fishes'),
                api.get('/fish-categories')
            ]);
            setFishes(fishesRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (fish: Fish | null = null) => {
        setEditingFish(fish);
        setFormData({
            name: fish ? fish.name : '',
            category_id: fish?.category_id || ''
        });
        setIsAddingCategory(false);
        setQuickCategoryName('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                category_id: formData.category_id || null
            };

            if (editingFish) {
                await api.put(`/fishes/${editingFish.id}`, payload);
            } else {
                await api.post('/fishes', payload);
            }
            setIsModalOpen(false);
            setFormData({ name: '', category_id: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to save fish', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this fish?')) return;
        try {
            await api.delete(`/fishes/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete fish', error);
        }
    };

    const handleQuickAddCategory = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!quickCategoryName.trim()) return;
        try {
            const res = await api.post('/fish-categories', { name: quickCategoryName });
            setQuickCategoryName('');
            setIsAddingCategory(false);

            const categoriesRes = await api.get('/fish-categories');
            setCategories(categoriesRes.data);

            if (res.data && res.data.id) {
                setFormData(prev => ({ ...prev, category_id: res.data.id.toString() }));
            }
        } catch (error) {
            console.error('Failed to add category', error);
        }
    };

    const getCategoryName = (categoryId?: number) => {
        if (!categoryId) return 'No Category';
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown';
    };

    if (loading) {
        return <LoadingSpinner message="Loading fishes..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Fishes (মাছ)</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fish
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fishes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No fishes yet. Add your first fish!
                    </div>
                ) : (
                    fishes.map((fish) => (
                        <div key={fish.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <FishIcon className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">{fish.name}</h3>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleOpenModal(fish)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Edit Fish"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(fish.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete Fish"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                                <Layers className="h-4 w-4 mr-2" />
                                Category: <span className="ml-1 font-medium text-gray-700">{getCategoryName(fish.category_id)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingFish ? 'Edit Fish' : 'Add New Fish'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fish Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Tilapia, Rui, Pangas"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category (Optional)</label>
                        {isAddingCategory ? (
                            <div className="mt-1 flex gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="New category name"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                    value={quickCategoryName}
                                    onChange={(e) => setQuickCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleQuickAddCategory(e as any);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleQuickAddCategory}
                                    className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(false)}
                                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="mt-1 flex gap-2">
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-gray-900"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                    title="Add new category"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                            {editingFish ? 'Update Fish' : 'Add Fish'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
