'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                    <h1 className="text-white text-xl font-bold">Tracker SaaS</h1>
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                    <Link
                        href="/dashboard"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <LayoutDashboard className="mr-3 h-6 w-6 text-gray-300" />
                        Dashboard
                    </Link>
                    <Link
                        href="/dashboard/creditors"
                        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Users className="mr-3 h-6 w-6 text-gray-300" />
                        Creditors
                    </Link>
                </nav>
            </div>
            <div className="flex-shrink-0 flex bg-gray-700 p-4">
                <button onClick={handleLogout} className="flex-shrink-0 w-full group block">
                    <div className="flex items-center">
                        <LogOut className="inline-block h-9 w-9 rounded-full text-gray-300 p-1" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">Logout</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        <SidebarContent />
                    </div>
                    <div className="flex-shrink-0 w-14"></div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <SidebarContent />
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
