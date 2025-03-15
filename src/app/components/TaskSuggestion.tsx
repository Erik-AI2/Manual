import { BusinessStage } from './BusinessSequenceChecker';

interface Props {
  stage: BusinessStage;
  suggestedTask: string;
}

export default function TaskSuggestion({ stage, suggestedTask }: Props) {
  // Map the current BusinessStage values to the task suggestions
  const getTaskSuggestion = () => {
    switch (stage) {
      case "offer":
        return {
          task: suggestedTask,
          moneyImpact: "This will validate your offer before you invest more time and resources",
          sayingNoTo: "Building features nobody wants, marketing an unproven offer"
        };
      case "leads":
        return {
          task: suggestedTask,
          moneyImpact: "Without leads, you have no one to sell to - this creates your pipeline",
          sayingNoTo: "Optimizing your website, tweaking your offer with no traffic"
        };
      case "sales":
        return {
          task: suggestedTask,
          moneyImpact: "Improving your close rate directly increases revenue with the same lead flow",
          sayingNoTo: "Getting more leads that won't convert, creating content with no ROI"
        };
      case "delivery":
        return {
          task: suggestedTask,
          moneyImpact: "Fixing delivery issues reduces refunds and increases referrals",
          sayingNoTo: "Scaling a broken product, acquiring customers who will be unhappy"
        };
      case "scaling":
        return {
          task: suggestedTask,
          moneyImpact: "With a working system, removing bottlenecks creates exponential growth",
          sayingNoTo: "Starting new projects that distract from your working system"
        };
      default:
        return {
          task: "Answer the questions to get your focused task",
          moneyImpact: "",
          sayingNoTo: ""
        };
    }
  };

  const suggestion = getTaskSuggestion();
  
  const stageTitles = {
    offer: 'GET A PROVEN OFFER',
    leads: 'GET MORE LEADS',
    sales: 'IMPROVE YOUR CLOSE RATE',
    delivery: 'FIX YOUR DELIVERY',
    scaling: 'REMOVE BOTTLENECKS'
  };

  const stageToActionMap = {
    offer: "validate your offer",
    leads: "get more leads",
    sales: "close more sales",
    delivery: "improve your delivery",
    scaling: "scale your business"
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 rounded-lg shadow-lg">
        <div className="text-sm font-semibold text-yellow-900 bg-yellow-100 rounded px-3 py-1 inline-block mb-3">
          {stageTitles[stage]}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">YOUR ONE FOCUS:</h3>
        <p className="text-3xl font-extrabold text-white tracking-tight">{suggestion.task}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border-l-4 border-l-green-600 shadow">
          <h3 className="font-bold text-green-800 mb-2 text-lg">THIS WILL MAKE MONEY BECAUSE:</h3>
          <p className="text-gray-700">{suggestion.moneyImpact}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border-l-4 border-l-red-600 shadow">
          <h3 className="font-bold text-red-800 mb-2 text-lg">STOP DOING THIS:</h3>
          <p className="text-gray-700">{suggestion.sayingNoTo}</p>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h3 className="font-bold text-blue-800 text-lg">ACTION QUESTION</h3>
        </div>
        <h2 className="text-2xl font-bold text-blue-900">
          What do you need to do TODAY to {stageToActionMap[stage]}?
        </h2>
      </div>
    </div>
  );
} 