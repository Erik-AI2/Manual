import { useState } from 'react';

export type BusinessStage = 'offer' | 'leads' | 'sales' | 'delivery' | 'scaling';

interface Props {
  onStageIdentified: (stage: BusinessStage, suggestedTask: string) => void;
}

export default function BusinessSequenceChecker({ onStageIdentified }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    'Do you have a proven offer that people are actively buying?',
    'Do you have consistent leads seeing this offer?',
    'Are you closing these leads consistently?',
    'Are you delivering results consistently?'
  ];

  const stageTasks = {
    offer: 'Get 10 customer conversations about your offer today',
    leads: 'Do 100 direct outreach messages today',
    sales: 'Do 10 sales calls today',
    delivery: 'Interview 3 customers about their experience',
    scaling: 'Create one system to remove yourself from delivery'
  };

  const handleAnswer = (answer: boolean) => {
    if (!answer) {
      const stage = ['offer', 'leads', 'sales', 'delivery', 'scaling'][currentQuestion] as BusinessStage;
      onStageIdentified(stage, stageTasks[stage]);
      return;
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onStageIdentified('scaling', stageTasks.scaling);
    }
  };

  if (currentQuestion >= questions.length) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border-l-8 border-l-blue-600 shadow-lg">
        <div className="flex mb-6 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-xs font-semibold uppercase text-blue-600">Business Sequence Check</span>
          </div>
          <div className="text-sm text-gray-500">
            Question {currentQuestion + 1}/{questions.length}
          </div>
        </div>
        
        <h3 className="text-2xl font-bold mb-6">{questions[currentQuestion]}</h3>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            className="flex-1 py-4 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg shadow-md transition-all"
          >
            YES
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            className="flex-1 py-4 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-lg shadow-md transition-all"
          >
            NO
          </button>
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded text-sm text-gray-600">
          <p className="italic">
            "Answer honestly. The most expensive mistake in business is working on the wrong thing." - Alex Hormozi
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-1 h-1 bg-blue-200 rounded relative">
            <div 
              className="absolute top-0 left-0 h-1 bg-blue-600 rounded" 
              style={{ width: `${25 * (currentQuestion + 1)}%` }}
            ></div>
            {[0, 1, 2, 3, 4].map((step) => (
              <div 
                key={step}
                className={`absolute -top-1 left-0 w-3 h-3 ${step <= currentQuestion ? 'bg-blue-600' : 'bg-blue-300'} rounded-full`} 
                style={{ left: `${step * 25}%` }}
              ></div>
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Offer</span>
          <span>Leads</span>
          <span>Sales</span>
          <span>Delivery</span>
          <span>Scale</span>
        </div>
      </div>
    </div>
  );
} 