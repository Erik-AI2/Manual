import { Timestamp } from 'firebase/firestore';

export type FirestoreData = {
  [key: string]: any;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  dueDate?: Timestamp;
};

export type TimestampFields = 'createdAt' | 'updatedAt' | 'dueDate';

export const convertTimestamps = <T extends FirestoreData>(
  data: T, 
  fields: TimestampFields[] = ['createdAt', 'updatedAt', 'dueDate']
): Omit<T, TimestampFields> & Record<TimestampFields, Date | null> => {
  const converted = { ...data };
  
  fields.forEach(field => {
    if (data[field] instanceof Timestamp) {
      converted[field] = data[field].toDate();
    } else if (data[field]) {
      converted[field] = new Date(data[field]);
    } else {
      converted[field] = null;
    }
  });

  return converted;
};

export const getUserCollectionPath = (userId: string, collection: string) => {
  if (!userId) throw new Error('User ID is required');
  return `users/${userId}/${collection}`;
}; 