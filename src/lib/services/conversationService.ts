import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  where
} from 'firebase/firestore';

export type Message = {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Timestamp;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: string;
};

// Get all user conversations
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const conversationsRef = collection(db, 'conversations', userId, 'userConversations');
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        title: data.title,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastMessage: data.lastMessage,
      });
    });
    
    return conversations;
  } catch (error) {
    console.error('Error getting user conversations:', error);
    throw error;
  }
};

// Create a new conversation
export const createConversation = async (userId: string, title: string = 'New Conversation'): Promise<string> => {
  try {
    const conversationsRef = collection(db, 'conversations', userId, 'userConversations');
    const newConversation = {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
    };
    
    const docRef = await addDoc(conversationsRef, newConversation);
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Rename a conversation
export const renameConversation = async (userId: string, conversationId: string, newTitle: string): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', userId, 'userConversations', conversationId);
    await updateDoc(conversationRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error renaming conversation:', error);
    throw error;
  }
};

// Add a message to a conversation
export const addMessageToConversation = async (
  userId: string,
  conversationId: string,
  message: Omit<Message, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    // Add the message to the messages subcollection
    const messagesRef = collection(db, 'conversations', userId, 'userConversations', conversationId, 'messages');
    const newMessage = {
      ...message,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(messagesRef, newMessage);
    
    // Update the conversation's lastMessage and updatedAt
    const conversationRef = doc(db, 'conversations', userId, 'userConversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    throw error;
  }
};

// Get all messages from a conversation
export const getConversationMessages = async (userId: string, conversationId: string): Promise<Message[]> => {
  try {
    const messagesRef = collection(
      db, 
      'conversations', 
      userId, 
      'userConversations', 
      conversationId, 
      'messages'
    );
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        role: data.role,
        content: data.content,
        createdAt: data.createdAt,
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    throw error;
  }
}; 