'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { userOfferService } from '@/lib/services/userOfferService';
import { Offer } from '@/types/offer';
import Link from 'next/link';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface OfferDetailsProps {
  offerId: string;
}

export default function OfferDetails({ offerId }: OfferDetailsProps) {
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  // Define sections - same as in OfferQuestionnaire
  const sections = [
    {
      id: 'target',
      title: 'Who Is It For?',
      emoji: '🎯',
      questions: ['niche', 'problem', 'failed_solutions', 'secret_desire', 'consequences']
    },
    {
      id: 'promise',
      title: "What's the Promise?",
      emoji: '⚡',
      questions: ['big_result', 'timeframe', 'emotional_outcome', 'future_benefits']
    },
    {
      id: 'method',
      title: 'How Does It Work?',
      emoji: '🔧',
      questions: ['main_steps', 'key_step', 'simple_explanation']
    },
    {
      id: 'objections',
      title: 'Objections & Value',
      emoji: '🛡️',
      questions: ['hesitations', 'advantages', 'proof', 'bonuses']
    },
    {
      id: 'guarantee',
      title: 'Risk Reversal',
      emoji: '🔒',
      questions: ['guarantee_type', 'guarantee_phrase']
    },
    {
      id: 'pricing',
      title: 'Pricing Strategy',
      emoji: '💰',
      questions: ['value_worth', 'competitor_pricing', 'price_point']
    }
  ];

  // Map of question IDs to human-readable labels
  const questionLabels: Record<string, string> = {
    niche: 'What niche are you targeting?',
    problem: "What's their biggest painful problem?",
    failed_solutions: "What solutions have they tried that didn't work?",
    secret_desire: 'What do they secretly want? (Beyond money)',
    consequences: "What happens if they don't solve this problem?",
    big_result: "What's the BIG RESULT you guarantee?",
    timeframe: 'How FAST can you deliver it?',
    emotional_outcome: 'How will they feel after getting this result?',
    future_benefits: 'What doors does this open for them?',
    main_steps: 'What are the 3-5 main steps of your system?',
    key_step: "What's the most important step?",
    simple_explanation: 'How would you explain it to a 10-year-old?',
    hesitations: 'What are 3-5 reasons someone might hesitate to buy?',
    advantages: 'How do you flip these into advantages?',
    proof: 'How can you prove your system works?',
    bonuses: 'What extra bonuses make it irresistible?',
    guarantee_type: 'How do you make it 100% risk-free?',
    guarantee_phrase: 'What is a catchy way to phrase your guarantee?',
    value_worth: 'What is the outcome worth to them?',
    competitor_pricing: 'What are competitors charging?',
    price_point: 'What is your ideal price point?'
  };

  // Placeholders for questions - same as in OfferQuestionnaire
  const placeholders: Record<string, string> = {
    niche: 'E.g., "Female entrepreneurs who want to scale their service business"',
    problem: 'E.g., "Working 60+ hours/week but still not making enough profit"',
    failed_solutions: 'E.g., "Hiring cheap VAs, using complex automation tools"',
    secret_desire: 'E.g., "To be seen as a successful businesswoman by their family"',
    consequences: 'E.g., "They will burn out and have to go back to their 9-5"',
    big_result: 'E.g., "Double your revenue while working 20 hours less per week"',
    timeframe: 'E.g., "90 days or less"',
    emotional_outcome: 'E.g., "Confident, in control, respected by peers"',
    future_benefits: 'E.g., "Scale to 7-figures, take regular vacations, hire A-players"',
    main_steps: 'E.g., "1. Audit current operations\n2. Implement core systems\n3. Train team\n4. Scale delivery"',
    key_step: 'E.g., "The systems implementation phase, where we remove you from day-to-day operations"',
    simple_explanation: 'E.g., "We build a business that runs like a well-oiled machine, so you can take vacations"',
    hesitations: 'E.g., "Price, time commitment, past failures with other programs"',
    advantages: 'E.g., "High price = serious clients only, better results, more support"',
    proof: 'E.g., "Case studies, live demonstrations, data from past clients"',
    bonuses: 'E.g., "1-on-1 strategy session, templates library, weekly group calls"',
    guarantee_type: 'E.g., "Double your money back if you do not 2x your revenue in 90 days"',
    guarantee_phrase: 'E.g., "Triple Your Revenue Or Triple Your Money Back"',
    value_worth: 'E.g., "$100k+ in additional revenue, 20 hours/week saved"',
    competitor_pricing: 'E.g., "Similar programs charge $5k-$10k but offer less support"',
    price_point: 'E.g., "$8,997 or 3 payments of $3,333"'
  };

  useEffect(() => {
    const fetchOffer = async () => {
      if (!user || !offerId) return;
      
      try {
        setLoading(true);
        const offers = await userOfferService.getUserOffers(user.uid);
        const foundOffer = offers.find(o => o.id === offerId);
        
        if (foundOffer) {
          setOffer(foundOffer);
          setEditedAnswers(foundOffer.answers);
        } else {
          setError('Offer not found');
        }
      } catch (err) {
        console.error('Error fetching offer:', err);
        setError('Failed to load the offer');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [user, offerId]);

  const handleSaveChanges = async () => {
    if (!user || !offer) return;
    
    try {
      setIsSaving(true);
      
      await userOfferService.updateOffer(user.uid, offerId, {
        answers: editedAnswers,
        updatedAt: Date.now(),
        // Allow updating the title based on the edited content
        title: editedAnswers.niche || editedAnswers.big_result || offer.title,
      });
      
      // Update the local offer state
      setOffer({
        ...offer,
        answers: editedAnswers,
        updatedAt: Date.now(),
        title: editedAnswers.niche || editedAnswers.big_result || offer.title,
      });
      
      setIsEditing(false);
      toast.success('Offer updated successfully!');
    } catch (err) {
      console.error('Error updating offer:', err);
      toast.error('Failed to update offer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (offer) {
      setEditedAnswers(offer.answers);
    }
    setIsEditing(false);
    setCurrentSection(0);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setEditedAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Failed to load offer'}
      </div>
    );
  }

  const currentSectionData = sections[currentSection];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <Link href="/offers/list" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} className="mr-1" /> Back to offers
        </Link>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <Edit size={16} className="mr-1" /> Edit Offer
          </button>
        )}
      </div>

      {!isEditing ? (
        <>
          <div className="flex items-end justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {offer.title || 'Untitled Offer'}
            </h1>
            <div className="text-sm text-gray-500">
              Created on {new Date(offer.createdAt).toLocaleDateString()}
              {offer.updatedAt > offer.createdAt && (
                <> · Updated on {new Date(offer.updatedAt).toLocaleDateString()}</>
              )}
            </div>
          </div>

          <div className="space-y-12">
            {sections.map(section => {
              // Check if this section has any answers
              const hasAnswers = section.questions.some(q => offer.answers[q]);
              if (!hasAnswers) return null;
              
              return (
                <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-2xl">{section.emoji}</span>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {section.questions.map(questionId => {
                      const answer = offer.answers[questionId];
                      if (!answer) return null;
                      
                      return (
                        <div key={questionId} className="space-y-2">
                          <h3 className="font-medium text-gray-700">{questionLabels[questionId]}</h3>
                          <p className="text-gray-800 whitespace-pre-line">{answer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
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
              <span className="text-2xl">{currentSectionData.emoji}</span>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentSectionData.title}
              </h2>
            </div>

            <div className="space-y-6">
              {currentSectionData.questions.map(questionId => (
                <div key={questionId} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {questionLabels[questionId]}
                  </label>
                  <textarea
                    value={editedAnswers[questionId] || ''}
                    onChange={(e) => handleAnswerChange(questionId, e.target.value)}
                    placeholder={placeholders[questionId]}
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
                onClick={handleSaveChanges}
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

          {/* Cancel button */}
          <div className="text-center pt-4">
            <button
              onClick={handleCancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel editing
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 