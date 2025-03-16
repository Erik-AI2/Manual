interface Task {
  id: string;
  text: string;
  description?: string;
  dueDate?: string;
  projectId?: string;
  isNonNegotiable?: boolean;
} 