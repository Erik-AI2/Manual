'use client';

import { useState, useEffect } from 'react';
import { userOfferService } from '@/lib/services/userOfferService';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { Offer } from '@/types/offer';
import { ArrowRight, Trash } from 'lucide-react';

export default function OffersList() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedOffers = await userOfferService.getUserOffers(user.uid);
      setOffers(fetchedOffers);
      setError(null);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Failed to load your offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [user]);

  const handleDeleteOffer = async (offerId: string) => {
    if (!user) return;
    
    if (confirm('Are you sure you want to delete this offer?')) {
      try {
        await userOfferService.deleteOffer(user.uid, offerId);
        setOffers(offers.filter(offer => offer.id !== offerId));
      } catch (err) {
        console.error('Error deleting offer:', err);
        setError('Failed to delete offer');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!offers.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-600">No offers yet</h3>
        <p className="mt-2 text-gray-500">Create your first offer to get started</p>
        <Link 
          href="/offers" 
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New Offer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Saved Offers</h2>
        <Link
          href="/offers"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New Offer
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <div 
            key={offer.id} 
            className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg">
                {offer.title || 'Untitled Offer'} 
              </h3>
              <button
                onClick={() => handleDeleteOffer(offer.id)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete offer"
              >
                <Trash size={16} />
              </button>
            </div>
            
            <p className="text-gray-500 text-sm mt-1">
              {new Date(offer.createdAt).toLocaleDateString()}
            </p>
            
            <div className="mt-4 space-y-2">
              {offer.answers.niche && (
                <p className="text-sm"><span className="font-medium">Niche:</span> {offer.answers.niche}</p>
              )}
              {offer.answers.big_result && (
                <p className="text-sm"><span className="font-medium">Promise:</span> {offer.answers.big_result}</p>
              )}
            </div>
            
            <Link
              href={`/offers/view/${offer.id}`}
              className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
            >
              View details <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 