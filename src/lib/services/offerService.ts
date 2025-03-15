import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Offer } from '@/types/offer';

const COLLECTION = 'offers';

export const offerService = {
  async createOffer(userId: string, answers: Record<string, string>): Promise<string> {
    const offer: Omit<Offer, 'id'> = {
      userId,
      answers,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const docRef = await addDoc(collection(db, COLLECTION), offer);
    return docRef.id;
  },

  async updateOffer(offerId: string, updates: Partial<Offer>): Promise<void> {
    const docRef = doc(db, COLLECTION, offerId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now()
    });
  },

  async getUserOffers(userId: string): Promise<Offer[]> {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Offer));
  },

  async deleteOffer(offerId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, offerId);
    await deleteDoc(docRef);
  }
}; 