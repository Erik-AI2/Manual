export interface Offer {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  answers: Record<string, string>;
  title?: string;
} 