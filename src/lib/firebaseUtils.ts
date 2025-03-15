import { doc, setDoc, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/firebase';

// Add these utility functions for user-specific data management
export const createUserDocument = async (userId: string, userData: any) => {
  try {
    console.log('Starting user document creation for:', userId);
    
    // First, check if user document exists
    const userRef = doc(db, 'users', userId);
    
    // Create or update the user document
    await setDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    // Check if collections exist before creating them
    const collections = ['tasks', 'projects', 'habits'];
    for (const collectionName of collections) {
      const subcollectionRef = collection(userRef, collectionName);
      
      // Check if collection has any documents
      const snapshot = await getDocs(subcollectionRef);
      if (snapshot.empty) {
        console.log(`Creating initial ${collectionName} collection for user:`, userId);
        await addDoc(subcollectionRef, {
          _dummy: true,
          createdAt: serverTimestamp(),
          _description: `Initial ${collectionName} collection creation`
        });
      } else {
        console.log(`${collectionName} collection already exists for user:`, userId);
      }
    }
    
    console.log('User document and collections setup completed');
    return true;
  } catch (error) {
    console.error('Error in createUserDocument:', error);
    throw error;
  }
};

export const getUserData = async (userId: string, collectionName: string) => {
  try {
    console.log(`Fetching ${collectionName} for user:`, userId); // Debug log
    // Create reference to the subcollection using the correct path
    const userDocRef = doc(db, 'users', userId);
    const subcollectionRef = collection(userDocRef, collectionName);
    
    const querySnapshot = await getDocs(subcollectionRef);
    const data = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(doc => !doc._dummy); // Filter out dummy documents
      
    console.log(`Fetched ${data.length} ${collectionName}`); // Debug log
    return data;
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error; // Rethrow to handle in the component
  }
};

export const addUserDocument = async (userId: string, collectionName: string, data: any) => {
  try {
    console.log(`Adding document to ${collectionName} for user:`, userId); // Debug log
    // Create reference to the subcollection using the correct path
    const userDocRef = doc(db, 'users', userId);
    const subcollectionRef = collection(userDocRef, collectionName);
    
    const docRef = await addDoc(subcollectionRef, {
      ...data,
      userId, // Add userId to the document
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Document added successfully with ID: ${docRef.id}`); // Debug log
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error; // Rethrow to handle in the component
  }
}; 