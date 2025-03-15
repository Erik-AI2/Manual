'use client';

import { ReactNode } from 'react';
import AIOfferChat from '@/components/AIOfferChat';

export default function OffersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <AIOfferChat />
    </div>
  );
} 