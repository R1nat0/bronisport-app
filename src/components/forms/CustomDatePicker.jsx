import React, { useState, useMemo, useRef, useEffect } from 'react';

const CustomDatePicker = ({
  value,
  onChange,
  label = 'Выберите дату',
  availableSlots = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const wrapperRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen]);

  // Получаем дни в месяце
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Получаем первый день недели месяца (0 = Воскресенье, 1 = Понедельник и т.д.)
  // Преобразуем в формат где 0 = Понедельник для совместимости с неделей
  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDay = getFirstDayOfMonth(displayMonth);
  const days = [];

  // Добавляем пустые дни перед первым днем месяца
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Добавляем дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isOutOfRange = (day) => {
    if (!day) return true;
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    maxDate.setHours(23, 59, 59, 999);
    return date > maxDate;
  };

  const isDateAvailable = (day) => {
    if (isOutOfRange(day)) return false;
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.length === 0 || availableSlots.some(slot => slot.date === dateStr && slot.available);
  };

  const isToday = (day) => {
    const today = new Date();
    return day && today.getDate() === day && 
           today.getMonth() === displayMonth.getMonth() &&
           today.getFullYear() === displayMonth.getFullYear();
  };

  const isSelected = (day) => {
    if (!day || !value) return false;
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === value;
  };

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const handleDateSelect = (day) => {
    if (!day) return;
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const canGoPrev = (() => {
    const now = new Date();
    return displayMonth.getFullYear() > now.getFullYear() ||
      (displayMonth.getFullYear() === now.getFullYear() && displayMonth.getMonth() > now.getMonth());
  })();

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const canGoNext = (() => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    const nextMonthStart = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
    return nextMonthStart <= maxDate;
  })();

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  const selectedDateFormatted = value ? new Date(value + 'T00:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  }) : 'Выберите дату';

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-surface-container-high rounded-xl px-4 py-3 text-left font-medium text-on-surface flex items-center justify-between hover:border-primary-fixed/50 transition-colors"
      >
        <span className={value ? 'text-on-surface' : 'text-on-surface-variant'}>
          {selectedDateFormatted}
        </span>
        <span className="material-symbols-outlined">calendar_today</span>
      </button>

      {isOpen && (
          <div className="absolute top-full left-0 z-40 bg-white rounded-2xl border border-surface-container-high shadow-lg p-4 mt-2 w-72">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                disabled={!canGoPrev}
                className="p-2 hover:bg-surface-container-low rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <h3 className="font-bold text-on-surface">
                {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
              </h3>

              <button
                onClick={handleNextMonth}
                disabled={!canGoNext}
                className="p-2 hover:bg-surface-container-low rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-bold text-on-surface-variant py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const hasSlots = day && isDateAvailable(day);
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={idx}
                    onClick={() => day && handleDateSelect(day)}
                    disabled={!day || !hasSlots}
                    className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                      !day
                        ? 'cursor-default'
                        : !hasSlots
                        ? 'text-on-surface-variant/40 cursor-not-allowed'
                        : selected
                        ? 'bg-primary-fixed text-on-primary-fixed shadow-md'
                        : today
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Info Text */}
            <p className="text-xs text-on-surface-variant mt-4 text-center">
              Бронирование доступно на ближайшие 14 дней
            </p>
          </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
