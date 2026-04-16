import React, { useMemo } from 'react';
import { formatDuration } from '../../utils/formatters.js';

const TimeSlotSelector = ({ 
  selectedDate,
  selectedTime,
  onTimeSelect,
  selectedDuration = '1.0',
  onDurationSelect,
  availableSlots = []
}) => {
  // Получаем доступные слоты для выбранной даты
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlots
      .filter(slot => slot.date === selectedDate && slot.available)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, availableSlots]);

  const durations = [
    { value: '1.0', label: '1 час' },
    { value: '1.5', label: '1.5 часа' },
    { value: '2.0', label: '2 часа' },
    { value: '3.0', label: '3 часа' },
    { value: '4.0', label: '4 часа' }
  ];

  const timeSlots = slotsForDate.length > 0 
    ? slotsForDate.map(s => s.time)
    : ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

  if (!selectedDate) {
    return (
      <div className="p-6 bg-surface-container-low rounded-2xl text-center">
        <p className="text-on-surface-variant text-sm">
          Выберите дату для просмотра доступных времён
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Duration Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
          Продолжительность
        </label>
        <div className="grid grid-cols-3 gap-2">
          {durations.map(duration => (
            <button
              key={duration.value}
              onClick={() => onDurationSelect(duration.value)}
              className={`py-3 px-2 rounded-xl font-bold text-sm transition-all ${
                selectedDuration === duration.value
                  ? 'bg-primary-fixed text-on-primary-fixed shadow-md'
                  : 'bg-white border border-surface-container-high text-on-surface hover:border-primary-fixed/50'
              }`}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
          Доступные слоты
        </label>

        {slotsForDate.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map(time => (
              <button
                key={time}
                onClick={() => onTimeSelect(time)}
                className={`py-3 px-2 rounded-xl font-bold text-sm transition-all ${
                  selectedTime === time
                    ? 'bg-primary-fixed text-on-primary-fixed shadow-md'
                    : 'bg-white border border-surface-container-high text-on-surface hover:border-primary-fixed/50'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-surface-container-low rounded-xl text-center">
            <p className="text-on-surface-variant text-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">info</span>
              Нет доступных слотов на эту дату
            </p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {selectedTime && selectedDate && (
        <div className="p-4 bg-primary-fixed/10 rounded-xl border border-primary-fixed/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase">Выбранное время</p>
              <p className="text-on-surface font-bold mt-1">
                {selectedDate} • {selectedTime} ({formatDuration(selectedDuration)})
              </p>
            </div>
            <span className="material-symbols-outlined text-primary-fixed">check_circle</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
