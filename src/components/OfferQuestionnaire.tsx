'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { userOfferService } from '@/lib/services/userOfferService';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface QuestionnaireSection {
  id: string;
  title: string;
  emoji: string;
  questions: {
    id: string;
    question: string;
    placeholder: string;
  }[];
}

const sections: QuestionnaireSection[] = [
  {
    id: 'target',
    title: 'Who Is It For?',
    emoji: '🎯',
    questions: [
      {
        id: 'niche',
        question: 'What niche are you targeting?',
        placeholder: 'E.g., "Female entrepreneurs who want to scale their service business"'
      },
      {
        id: 'problem',
        question: "What's their biggest painful problem?",
        placeholder: 'E.g., "Working 60+ hours/week but still not making enough profit"'
      },
      {
        id: 'failed_solutions',
        question: "What solutions have they tried that didn't work?",
        placeholder: 'E.g., "Hiring cheap VAs, using complex automation tools"'
      },
      {
        id: 'secret_desire',
        question: 'What do they secretly want? (Beyond money)',
        placeholder: 'E.g., "To be seen as a successful businesswoman by their family"'
      },
      {
        id: 'consequences',
        question: "What happens if they don't solve this problem?",
        placeholder: 'E.g., "They will burn out and have to go back to their 9-5"'
      }
    ]
  },
  {
    id: 'promise',
    title: "What's the Promise?",
    emoji: '⚡',
    questions: [
      {
        id: 'big_result',
        question: "What's the BIG RESULT you guarantee?",
        placeholder: 'E.g., "Double your revenue while working 20 hours less per week"'
      },
      {
        id: 'timeframe',
        question: 'How FAST can you deliver it?',
        placeholder: 'E.g., "90 days or less"'
      },
      {
        id: 'emotional_outcome',
        question: 'How will they feel after getting this result?',
        placeholder: 'E.g., "Confident, in control, respected by peers"'
      },
      {
        id: 'future_benefits',
        question: 'What doors does this open for them?',
        placeholder: 'E.g., "Scale to 7-figures, take regular vacations, hire A-players"'
      }
    ]
  },
  {
    id: 'method',
    title: 'How Does It Work?',
    emoji: '🔧',
    questions: [
      {
        id: 'main_steps',
        question: 'What are the 3-5 main steps of your system?',
        placeholder: 'E.g., "1. Audit current operations\n2. Implement core systems\n3. Train team\n4. Scale delivery"'
      },
      {
        id: 'key_step',
        question: "What's the most important step?",
        placeholder: 'E.g., "The systems implementation phase, where we remove you from day-to-day operations"'
      },
      {
        id: 'simple_explanation',
        question: 'How would you explain it to a 10-year-old?',
        placeholder: 'E.g., "We build a business that runs like a well-oiled machine, so you can take vacations"'
      }
    ]
  },
  {
    id: 'objections',
    title: 'Objections & Value',
    emoji: '🛡️',
    questions: [
      {
        id: 'hesitations',
        question: 'What are 3-5 reasons someone might hesitate to buy?',
        placeholder: 'E.g., "Price, time commitment, past failures with other programs"'
      },
      {
        id: 'advantages',
        question: 'How do you flip these into advantages?',
        placeholder: 'E.g., "High price = serious clients only, better results, more support"'
      },
      {
        id: 'proof',
        question: 'How can you prove your system works?',
        placeholder: 'E.g., "Case studies, live demonstrations, data from past clients"'
      },
      {
        id: 'bonuses',
        question: 'What extra bonuses make it irresistible?',
        placeholder: 'E.g., "1-on-1 strategy session, templates library, weekly group calls"'
      }
    ]
  },
  {
    id: 'guarantee',
    title: 'Risk Reversal',
    emoji: '🔒',
    questions: [
      {
        id: 'guarantee_type',
        question: 'How do you make it 100% risk-free?',
        placeholder: 'E.g., "Double your money back if you do not 2x your revenue in 90 days"'
      },
      {
        id: 'guarantee_phrase',
        question: 'What is a catchy way to phrase your guarantee?',
        placeholder: 'E.g., "Triple Your Revenue Or Triple Your Money Back"'
      }
    ]
  },
  {
    id: 'pricing',
    title: 'Pricing Strategy',
    emoji: '💰',
    questions: [
      {
        id: 'value_worth',
        question: 'What is the outcome worth to them?',
        placeholder: 'E.g., "$100k+ in additional revenue, 20 hours/week saved"'
      },
      {
        id: 'competitor_pricing',
        question: 'What are competitors charging?',
        placeholder: 'E.g., "Similar programs charge $5k-$10k but offer less support"'
      },
      {
        id: 'price_point',
        question: 'What is your ideal price point?',
        placeholder: 'E.g., "$8,997 or 3 payments of $3,333"'
      }
    ]
  }
];

export default function OfferQuestionnaire() {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save your offer');
      return;
    }

    try {
      setIsSaving(true);
      const title = answers.niche || answers.big_result || 'Untitled Offer';
      await userOfferService.createOffer(user.uid, answers, title);
      toast.success('Offer saved successfully!');
      router.push('/offers/list');
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(index)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
              currentSection === index
                ? "bg-blue-100 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <span>{section.emoji}</span>
            <span className="hidden sm:inline">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Current section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{sections[currentSection].emoji}</span>
          <h2 className="text-2xl font-bold text-gray-900">
            {sections[currentSection].title}
          </h2>
        </div>

        <div className="space-y-6">
          {sections[currentSection].questions.map(question => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {question.question}
              </label>
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
          disabled={currentSection === 0}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Previous
        </button>
        {currentSection === sections.length - 1 ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Offer'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentSection(prev => Math.min(sections.length - 1, prev + 1))}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
} 