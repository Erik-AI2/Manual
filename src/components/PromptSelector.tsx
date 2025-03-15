import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

// These would be the predefined prompts you want to use
export const OFFER_PROMPTS = [
  {
    id: 'value-stack',
    label: 'Value Stack',
    prompt: 'Help me create a compelling value stack for my offer. I want to maximize perceived value.'
  },
  {
    id: 'pricing-strategy',
    label: 'Pricing Strategy',
    prompt: 'What pricing strategy would work best for my offer? I want to optimize for conversions.'
  },
  {
    id: 'grand-slam-offer',
    label: 'Grand Slam Offer',
    prompt: 'Help me create a Grand Slam Offer using Alex Hormozi\'s framework. I want to make it irresistible.'
  },
  {
    id: 'guarantee-creation',
    label: 'Risk-Reversal Guarantee',
    prompt: 'I need help creating a powerful risk-reversal guarantee for my offer. What should it include?'
  },
  {
    id: 'offer-delivery',
    label: 'Offer Delivery',
    prompt: 'What\'s the best way to deliver my offer to maximize client success and minimize fulfillment costs?'
  }
];

interface PromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function PromptSelector({ onSelectPrompt }: PromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectPrompt = (prompt: string) => {
    onSelectPrompt(prompt);
    setIsOpen(false);
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
        Prompts
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-60 bg-white rounded-md shadow-lg border border-gray-200 p-1 z-50">
          <div className="text-xs font-medium text-gray-500 px-2 py-1">Select a prompt</div>
          {OFFER_PROMPTS.map((item) => (
            <button
              key={item.id}
              className="block w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded"
              onClick={() => handleSelectPrompt(item.prompt)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 