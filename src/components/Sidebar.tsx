'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserProfileButton from './UserProfileButton';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: '🏠' },
    { name: 'Tasks', path: '/tasks', icon: '✅' },
    { name: 'Habits', path: '/habits', icon: '🔄' },
    { name: 'Today', path: '/today', icon: '📅' },
    { name: 'Projects', path: '/projects', icon: '📁' },
    { name: 'Review', path: '/review', icon: '📊' },
    { name: 'Offers', path: '/offers', icon: '🎯' },
  ];

  return (
    <div className="w-64 min-h-screen bg-[#1a1d21] text-white p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">AI Coach</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
              pathname === item.path ? 'bg-[#1d2024] text-white' : 'text-gray-300 hover:bg-[#1d2024] hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile Section at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <UserProfileButton />
      </div>
    </div>
  );
}
