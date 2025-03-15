"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import Image from 'next/image';

export default function UserProfileButton() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#1d2024] transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Profile"
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white">
              {user.displayName?.[0] || user.email?.[0] || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white truncate">
            {user.displayName || 'User'}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1d2024] rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2d3035] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 