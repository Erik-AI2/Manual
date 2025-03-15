'use client';

import { useState } from 'react';
import OfferQuestionnaire from '@/components/OfferQuestionnaire';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ListFilter } from 'lucide-react';

export default function OffersPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grand Slam Offer Creator</h1>
          <p className="mt-2 text-gray-600">
            Create an irresistible offer using Alex Hormozi's proven framework
          </p>
        </div>
        
        {user && (
          <Link 
            href="/offers/list" 
            className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            <ListFilter size={18} className="mr-2" />
            View My Offers
          </Link>
        )}
      </div>

      <OfferQuestionnaire />
    </div>
  );
} 