'use client';

import OfferDetails from '@/components/OfferDetails';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OfferDetailsPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const offerId = params.id;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // This will redirect in the useEffect
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <OfferDetails offerId={offerId} />
    </div>
  );
} 