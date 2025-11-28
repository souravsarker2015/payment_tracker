'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <div className="flex flex-col w-64">
                    <div className="flex flex-col h-0 flex-1 bg-gray-800">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center flex-shrink-0 px-4">
                                <h1 className="text-white text-xl font-bold">Tracker SaaS</h1>
                            </div>
                            <nav className="mt-5 flex-1 px-2 space-y-1">
                                <Link href="/dashboard" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700">
                                    <LayoutDashboard className="mr-3 h-6 w-6 text-gray-300" />
                                    Dashboard
                                </Link>
                                <Link href="/dashboard/creditors" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-gray-700">
                                    <Users className="mr-3 h-6 w-6 text-gray-300" />
                                    Creditors
                                </Link>
                                {/* Add more links here */}
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
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
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
