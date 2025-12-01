'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut, Menu, X, BarChart3, CreditCard, Wallet, Receipt, PieChart } from 'lucide-react';
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
        <div className="flex flex-col h-full bg-slate-800">
            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-slate-700">
                    <h1 className="text-white text-xl font-bold">Tracker SaaS</h1>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link
                        href="/dashboard"
                        className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <LayoutDashboard className="mr-3 h-5 w-5" />
                        Dashboard
                    </Link>
                    <div className="pl-6 space-y-1">
                        <Link
                            href="/dashboard/creditors"
                            className="group flex items-center px-3 py-2 text-xs font-medium rounded-lg text-gray-400 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <CreditCard className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                            Creditors Overview
                        </Link>
                        <Link
                            href="/dashboard/debtors"
                            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                            <Wallet className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                            Debtors Overview
                        </Link>
                        <Link
                            href="/dashboard/expenses"
                            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        >
                            <PieChart className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                            Expenses Overview
                        </Link>
                    </div>
                    <Link
                        href="/creditors"
                        className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <CreditCard className="mr-3 h-5 w-5" />
                        Creditors
                    </Link>
                    <Link
                        href="/debtors"
                        className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Wallet className="mr-3 h-5 w-5" />
                        Debtors
                    </Link>
                    <Link
                        href="/expenses"
                        className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Receipt className="mr-3 h-5 w-5" />
                        Expenses
                    </Link>

                    {/* Gher Section */}
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                            Gher (মাছের ঘের)
                        </div>
                        <Link
                            href="/gher"
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <BarChart3 className="mr-3 h-4 w-4" />
                            Dashboard (ড্যাশবোর্ড)
                        </Link>
                        <Link
                            href="/gher/ponds"
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Ponds (পুকুর)
                        </Link>
                        <Link
                            href="/gher/suppliers"
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Suppliers (দোকান)
                        </Link>
                        <Link
                            href="/gher/labor"
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Labor (শ্রমিক)
                        </Link>
                        <Link
                            href="/gher/sales"
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Sales (বিক্রি)
                        </Link>
                    </div>
                </nav>
            </div>
            <div className="flex-shrink-0 border-t border-slate-700">
                <button onClick={handleLogout} className="w-full px-4 py-4 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center">
                        <LogOut className="h-5 w-5 text-gray-300" />
                        <span className="ml-3 text-sm font-medium text-gray-300">Logout</span>
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
