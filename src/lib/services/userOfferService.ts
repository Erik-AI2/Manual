import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { Offer } from '@/types/offer';

/**
 * Service for managing user offers in Firestore
 * Stores offers in the path: users/{userId}/offers/{offerId}
 */
export const userOfferService = {
  /**
   * Creates a new offer under the user's collection
   */
  async createOffer(userId: string, answers: Record<string, string>, title?: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required to create an offer');
    }

    const offer: Omit<Offer, 'id'> = {
      userId,
      answers,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: title || 'Untitled Offer'
    };

    try {
      // Create reference to the user's offers subcollection
      const offersRef = collection(db, 'users', userId, 'offers');
      const docRef = await addDoc(offersRef, offer);
      return docRef.id;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  },

  /**
   * Updates an existing offer
   */
  async updateOffer(userId: string, offerId: string, updates: Partial<Offer>): Promise<void> {
    if (!userId || !offerId) {
      throw new Error('User ID and Offer ID are required to update an offer');
    }

    try {
      const docRef = doc(db, 'users', userId, 'offers', offerId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  },

  /**
   * Gets all offers for a specific user
   */
  async getUserOffers(userId: string): Promise<Offer[]> {
    if (!userId) {
      throw new Error('User ID is required to get offers');
    }

    try {
      const offersRef = collection(db, 'users', userId, 'offers');
      const snapshot = await getDocs(offersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Offer));
    } catch (error) {
      console.error('Error getting user offers:', error);
      throw error;
    }
  },

  /**
   * Deletes an offer
   */
  async deleteOffer(userId: string, offerId: string): Promise<void> {
    if (!userId || !offerId) {
      throw new Error('User ID and Offer ID are required to delete an offer');
    }

    try {
      const docRef = doc(db, 'users', userId, 'offers', offerId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  }
}; 