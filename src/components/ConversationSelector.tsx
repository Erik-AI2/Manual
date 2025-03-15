import { useState, useEffect } from 'react';
import { 
  getUserConversations, 
  createConversation, 
  renameConversation, 
  Conversation 
} from '@/lib/services/conversationService';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Edit2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { addMessageToConversation } from '@/lib/services/conversationService';

interface ConversationSelectorProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
}

export default function ConversationSelector({
  currentConversationId,
  onSelectConversation,
  onCreateConversation
}: ConversationSelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch user conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const userConversations = await getUserConversations(user.uid);
        setConversations(userConversations);
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid) {
      loadConversations();
    }
  }, [user?.uid]);

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId);
    setIsOpen(false);
  };

  const handleCreateConversation = async () => {
    onCreateConversation();
    setIsOpen(false);
  };

  const startRenaming = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setNewTitle(conversation.title);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid || !editingId || !newTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await renameConversation(user.uid, editingId, newTitle.trim());
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === editingId ? { ...conv, title: newTitle.trim() } : conv
        )
      );
    } catch (error) {
      console.error('Error renaming conversation:', error);
    } finally {
      setEditingId(null);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-xs text-gray-500 hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-3 w-3" />
        Conversations
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 p-1 z-50 max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center px-2 py-1">
            <div className="text-xs font-medium text-gray-500">Your conversations</div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={handleCreateConversation}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-2 text-center text-sm text-gray-500">No conversations yet</div>
          ) : (
            <div>
              {conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded ${
                    currentConversationId === conversation.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                  }`}
                >
                  {editingId === conversation.id ? (
                    <form onSubmit={handleRename} className="flex-1">
                      <Input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        autoFocus
                        className="h-6 text-xs"
                        onBlur={handleRename}
                      />
                    </form>
                  ) : (
                    <>
                      <button
                        className="flex-1 text-left text-sm truncate"
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        {conversation.title}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => startRenaming(conversation, e)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 