'use client';

import React, { useState, useEffect } from 'react';
import { Repeat, ChevronDown } from 'lucide-react';
import { RecurrenceRule, RecurrenceFrequency } from '@/types/events';

interface RecurrencePickerProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
  startDate: Date;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_OF_WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurrencePicker({ value, onChange, startDate }: RecurrencePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(value?.frequency || 'weekly');
  const [interval, setInterval] = useState(value?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(value?.daysOfWeek || [startDate.getDay()]);
  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>(
    value?.endDate ? 'date' : value?.occurrences ? 'occurrences' : 'never'
  );
  const [endDate, setEndDate] = useState<string>(
    value?.endDate ? value.endDate.toISOString().split('T')[0] : ''
  );
  const [occurrences, setOccurrences] = useState(value?.occurrences || 10);

  // Update selected days when start date changes
  useEffect(() => {
    if (!value && selectedDays.length === 0) {
      setSelectedDays([startDate.getDay()]);
    }
  }, [startDate, value, selectedDays.length]);

  const handleEnableRecurrence = () => {
    setIsExpanded(true);
    // Set default rule when enabling
    onChange({
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [startDate.getDay()],
    });
  };

  const handleDisableRecurrence = () => {
    setIsExpanded(false);
    onChange(undefined);
  };

  const updateRule = (updates: Partial<RecurrenceRule>) => {
    const newFrequency = updates.frequency ?? frequency;
    const newInterval = updates.interval ?? interval;
    const newSelectedDays = updates.daysOfWeek ?? selectedDays;
    
    const rule: RecurrenceRule = {
      frequency: newFrequency,
      interval: newInterval,
    };

    // Only include daysOfWeek for weekly frequency
    if (newFrequency === 'weekly') {
      rule.daysOfWeek = newSelectedDays.length > 0 ? newSelectedDays : [startDate.getDay()];
    }

    // Handle end conditions
    if (endType === 'date' && endDate) {
      rule.endDate = new Date(endDate);
    } else if (endType === 'occurrences') {
      rule.occurrences = occurrences;
    }

    onChange(rule);
  };

  const handleFrequencyChange = (newFrequency: RecurrenceFrequency) => {
    setFrequency(newFrequency);
    updateRule({ frequency: newFrequency });
  };

  const handleIntervalChange = (newInterval: number) => {
    setInterval(newInterval);
    updateRule({ interval: newInterval });
  };

  const handleDayToggle = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    
    // Ensure at least one day is selected
    if (newDays.length === 0) return;
    
    setSelectedDays(newDays);
    updateRule({ daysOfWeek: newDays });
  };

  const handleEndTypeChange = (newEndType: 'never' | 'date' | 'occurrences') => {
    setEndType(newEndType);
    // Trigger update
    setTimeout(() => updateRule({}), 0);
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);
    // Trigger update
    setTimeout(() => updateRule({}), 0);
  };

  const handleOccurrencesChange = (newOccurrences: number) => {
    setOccurrences(newOccurrences);
    // Trigger update
    setTimeout(() => updateRule({}), 0);
  };

  const getRecurrenceDescription = (): string => {
    if (!value) return 'Does not repeat';

    const frequencyNames: Record<RecurrenceFrequency, string> = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
      yearly: 'year',
    };

    let desc = '';
    if (value.interval === 1) {
      desc = `Every ${frequencyNames[value.frequency]}`;
    } else {
      desc = `Every ${value.interval} ${frequencyNames[value.frequency]}s`;
    }

    if (value.frequency === 'weekly' && value.daysOfWeek && value.daysOfWeek.length > 0) {
      if (value.daysOfWeek.length === 7) {
        desc += ' (every day)';
      } else if (value.daysOfWeek.length === 1) {
        desc += ` on ${DAYS_OF_WEEK_FULL[value.daysOfWeek[0]]}`;
      } else {
        desc += ` on ${value.daysOfWeek.map(d => DAYS_OF_WEEK[d]).join(', ')}`;
      }
    }

    if (value.endDate) {
      desc += ` until ${value.endDate.toLocaleDateString()}`;
    } else if (value.occurrences) {
      desc += `, ${value.occurrences} times`;
    }

    return desc;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => value ? setIsExpanded(!isExpanded) : handleEnableRecurrence()}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Repeat size={16} className={value ? 'text-blue-600' : 'text-gray-500'} />
          <span className={`text-sm ${value ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
            {getRecurrenceDescription()}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="p-3 space-y-3 border-t border-gray-200 bg-white">
          {/* Frequency */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-800 min-w-16">Repeat:</label>
            <select
              value={frequency}
              onChange={(e) => handleFrequencyChange(e.target.value as RecurrenceFrequency)}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Interval */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-800 min-w-16">Every:</label>
            <input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => handleIntervalChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-800">
              {frequency === 'daily' && (interval === 1 ? 'day' : 'days')}
              {frequency === 'weekly' && (interval === 1 ? 'week' : 'weeks')}
              {frequency === 'monthly' && (interval === 1 ? 'month' : 'months')}
              {frequency === 'yearly' && (interval === 1 ? 'year' : 'years')}
            </span>
          </div>

          {/* Days of week (for weekly) */}
          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm text-gray-800 mb-2">Repeat on:</label>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(index)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                      selectedDays.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End condition */}
          <div>
            <label className="block text-sm text-gray-800 mb-2">Ends:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'never'}
                  onChange={() => handleEndTypeChange('never')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-800">Never</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'date'}
                  onChange={() => handleEndTypeChange('date')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-800">On date</span>
                {endType === 'date' && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={startDate.toISOString().split('T')[0]}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === 'occurrences'}
                  onChange={() => handleEndTypeChange('occurrences')}
                  className="text-blue-600"
                />
                <span className="text-sm text-gray-800">After</span>
                {endType === 'occurrences' && (
                  <>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={occurrences}
                      onChange={(e) => handleOccurrencesChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800">occurrences</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Remove recurrence button */}
          <button
            type="button"
            onClick={handleDisableRecurrence}
            className="text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            Remove recurrence
          </button>
        </div>
      )}
    </div>
  );
}
