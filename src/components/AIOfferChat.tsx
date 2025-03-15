'use client';

import { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Sparkles, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import PromptSelector from './PromptSelector';
import ConversationSelector from './ConversationSelector';
import { 
  addMessageToConversation, 
  createConversation, 
  getConversationMessages
} from '@/lib/services/conversationService';

export default function AIOfferChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize chat with default or saved messages
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/openai/chat',
    id: currentConversationId || undefined,
    initialMessages: [],
    onFinish: async (message) => {
      // Save assistant message to Firebase when the message is complete
      if (user?.uid && currentConversationId) {
        try {
          await addMessageToConversation(user.uid, currentConversationId, {
            role: 'assistant',
            content: message.content,
          });
        } catch (error) {
          console.error('Error saving assistant message:', error);
          setError('Failed to save message. Please try again.');
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setError('An error occurred while sending your message. Please try again.');
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load conversation messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.uid || !currentConversationId) return;
      
      setIsLoadingMessages(true);
      setError(null);
      
      try {
        const conversationMessages = await getConversationMessages(user.uid, currentConversationId);
        
        // Convert Firebase messages to AI SDK format
        const formattedMessages = conversationMessages.map(msg => ({
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          role: msg.role,
          content: msg.content,
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading conversation messages:', error);
        setError('Failed to load conversation. Please try refreshing.');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (currentConversationId) {
      loadMessages();
    } else {
      // Clear messages when no conversation is selected
      setMessages([
        {
          id: 'initial-message',
          role: 'assistant',
          content: "Hi! I'm your Offer AI Assistant. I can help you generate ideas for your offers, answer questions about effective offer creation, or provide suggestions based on Alex Hormozi's framework. What would you like help with today?"
        }
      ]);
    }
  }, [currentConversationId, user?.uid, setMessages]);

  // Clear error when input changes
  useEffect(() => {
    if (error) setError(null);
  }, [input]);

  const toggleChat = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Handle keyboard events in the textarea
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If Enter is pressed without Shift and there's text to send
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault(); // Prevent default behavior (new line)
      
      // Submit the form
      if (formRef.current) {
        const submitEvent = new Event('submit', { cancelable: true, bubbles: true }) as unknown as FormEvent<HTMLFormElement>;
        handleSubmit(submitEvent);
      }
    }
    // If Shift+Enter is pressed, allow default behavior (new line)
  };

  // Handle form submission with Firebase integration
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || !user?.uid) return;
    
    setError(null);
    
    // Create a new conversation if none is selected
    if (!currentConversationId) {
      try {
        const newConversationId = await createConversation(user.uid);
        setCurrentConversationId(newConversationId);
        
        // Save the initial message
        await addMessageToConversation(user.uid, newConversationId, {
          role: 'assistant',
          content: "Hi! I'm your Offer AI Assistant. I can help you generate ideas for your offers, answer questions about effective offer creation, or provide suggestions based on Alex Hormozi's framework. What would you like help with today?"
        });
        
        // Save the user message
        await addMessageToConversation(user.uid, newConversationId, {
          role: 'user',
          content: input,
        });
      } catch (error) {
        console.error('Error creating conversation:', error);
        setError('Failed to create conversation. Please try again.');
        return;
      }
    } else {
      // Save the user message to Firebase
      try {
        await addMessageToConversation(user.uid, currentConversationId, {
          role: 'user',
          content: input,
        });
      } catch (error) {
        console.error('Error saving user message:', error);
        setError('Failed to save message. Please try again.');
        return;
      }
    }
    
    // Submit to the AI API
    handleSubmit(e);
  };

  // Handle prompt selection
  const handleSelectPrompt = (prompt: string) => {
    handleInputChange({ target: { value: prompt } } as any);
  };

  // Handle conversation creation
  const handleCreateConversation = async () => {
    if (!user?.uid) return;
    
    setError(null);
    
    try {
      const newConversationId = await createConversation(user.uid);
      setCurrentConversationId(newConversationId);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation. Please try again.');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div 
          className={`bg-white rounded-lg shadow-xl border border-gray-200 mb-2 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
            isExpanded ? 'w-96 h-[600px]' : 'w-80 h-96'
          }`}
        >
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              <h3 className="font-medium">Offer AI Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={toggleExpand} className="text-white hover:text-blue-100">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
              <button onClick={toggleChat} className="text-white hover:text-blue-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-b border-gray-200">
            <ConversationSelector
              currentConversationId={currentConversationId}
              onSelectConversation={setCurrentConversationId}
              onCreateConversation={handleCreateConversation}
            />
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCreateConversation}
              title="New conversation"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`mb-4 ${
                      message.role === 'assistant' 
                        ? 'bg-blue-50 border-blue-100 border rounded-lg p-3' 
                        : 'bg-gray-100 border-gray-200 border rounded-lg p-3 ml-4'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          <form ref={formRef} onSubmit={handleFormSubmit} className="p-3 border-t border-gray-200">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about offer ideas..."
                  className="resize-none min-h-[60px] max-h-32 mb-1"
                  rows={2}
                  disabled={isLoading || isLoadingMessages}
                />
                <div className="flex justify-between items-center">
                  <PromptSelector onSelectPrompt={handleSelectPrompt} />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={isLoading || isLoadingMessages || !input.trim()}
                    className="h-7"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <Button 
        onClick={toggleChat} 
        className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center"
      >
        <Sparkles className="h-5 w-5" />
      </Button>
    </div>
  );
} 