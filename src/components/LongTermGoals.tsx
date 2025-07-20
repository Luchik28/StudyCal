'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Target, Check } from 'lucide-react';

export interface LongTermGoal {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  isCompleted: boolean;
}

interface LongTermGoalsProps {
  className?: string;
}

export function LongTermGoals({ className }: LongTermGoalsProps) {
  const [goals, setGoals] = useState<LongTermGoal[]>([]);
  const [input, setInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);

  // Load goals from localStorage on component mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('longTermGoals');
    if (savedGoals && savedGoals !== 'undefined' && savedGoals !== 'null') {
      try {
        const parsedGoals = JSON.parse(savedGoals).map((goal: LongTermGoal) => ({
          ...goal,
          createdAt: new Date(goal.createdAt)
        }));
        setGoals(parsedGoals);
      } catch (error) {
        console.error('Error loading goals from localStorage:', error);
      }
    }
    // Set the flag after we've attempted to load (whether successful or not)
    setTimeout(() => {
      hasLoadedRef.current = true;
    }, 0);
  }, []);

  // Save goals to localStorage whenever goals change (but only after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      try {
        localStorage.setItem('longTermGoals', JSON.stringify(goals));
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('goalsUpdated'));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [goals]);

  const handleAdd = () => {
    if (input.trim()) {
      const newGoal: LongTermGoal = {
        id: `goal_${Date.now()}`,
        title: input.trim(),
        createdAt: new Date(),
        isCompleted: false
      };
      setGoals([...goals, newGoal]);
      setInput('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setInput('');
    }
  };

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(goals[idx].title);
  };

  const handleEditSave = (idx: number) => {
    if (editValue.trim()) {
      setGoals(goals.map((goal, i) => 
        i === idx ? { ...goal, title: editValue.trim() } : goal
      ));
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      handleEditSave(idx);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleToggleComplete = (idx: number) => {
    setGoals(goals.map((goal, i) => 
      i === idx ? { ...goal, isCompleted: !goal.isCompleted } : goal
    ));
  };

  const handleRemoveGoal = (idx: number) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const activeGoals = goals.filter(goal => !goal.isCompleted);
  const completedGoals = goals.filter(goal => goal.isCompleted);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Target size={20} className="text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900 font-mono">Long-Term Goals</h3>
      </div>

      {/* Active Goals */}
      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {activeGoals.map((goal, idx) => (
          <div key={goal.id} className="border rounded-lg p-3 bg-white shadow-sm group">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    className="w-4 h-4 rounded border-2 border-gray-300 hover:border-green-500 flex items-center justify-center transition-colors"
                    onClick={() => handleToggleComplete(idx)}
                  >
                    {goal.isCompleted && <Check size={12} className="text-green-600" />}
                  </button>
                  {editingIndex === idx ? (
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-900 bg-white dark:bg-white"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => handleEditKeyDown(e, idx)}
                      onBlur={() => handleEditSave(idx)}
                      autoFocus
                      style={{ marginRight: '0.75rem', cursor: 'text' }}
                    />
                  ) : (
                    <span
                      className="text-sm font-medium flex-1 text-gray-900 dark:text-gray-900 cursor-text group-hover:bg-gray-50 group-hover:border group-hover:border-gray-300 group-hover:rounded px-1 py-0.5 -mx-1 -my-0.5 transition-all"
                      onClick={() => handleEdit(idx)}
                      style={{ marginRight: '0.75rem' }}
                    >
                      {goal.title}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    className="text-xs px-2 py-1 font-bold text-red-800 bg-red-100 rounded hover:bg-red-200"
                    onClick={() => handleRemoveGoal(idx)}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Goal - Matching task input style */}
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            ref={inputRef}
            className="flex-1 border rounded px-2 py-1 text-sm mr-2 text-gray-900 dark:text-gray-900 bg-white dark:bg-white"
            placeholder="Add a long-term goal..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            onClick={handleAdd}
          >
            Add
          </button>
        </div>

        {/* Show/Hide Completed Goals */}
        {completedGoals.length > 0 && (
          <button
            className="text-xs text-gray-800 hover:text-gray-900"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? '− Hide' : '+ Show'} completed goals ({completedGoals.length})
          </button>
        )}

        {/* Completed Goals */}
        {showCompleted && completedGoals.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="border rounded p-2 bg-gray-50 opacity-75">
                <div className="flex items-center gap-2">
                  <button
                    className="w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center"
                    onClick={() => handleToggleComplete(goals.indexOf(goal))}
                  >
                    <Check size={12} className="text-white" />
                  </button>
                  <span className="text-sm line-through text-gray-700 dark:text-gray-700 flex-1">{goal.title}</span>
                  <button
                    className="text-xs px-1 py-0.5 bg-red-100 rounded hover:bg-red-200"
                    onClick={() => handleRemoveGoal(goals.indexOf(goal))}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
