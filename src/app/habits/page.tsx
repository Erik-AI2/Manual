import HabitForm from '@/components/HabitForm';
import HabitList from '@/components/HabitList';

export default function HabitsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Habits</h1>
      <HabitForm />
      <HabitList />
    </div>
  );
} 