import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlert } from '../../context/AlertContext.jsx';
import AuthRequired from '../ui/AuthRequired.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useCancelBooking, useMyBookings } from '../../api/hooks/bookings.js';
import { apiErrorMessage, resolveUploadUrl } from '../../api/client.js';
import { formatPrice } from '../../utils/formatters.js';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Мая', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

const STATUS_CONFIG = {
  confirmed: { label: 'Подтверждено', icon: 'check_circle', bg: 'bg-primary-fixed/20', text: 'text-primary' },
  pending: { label: 'Ожидает', icon: 'schedule', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { label: 'Завершено', icon: 'task_alt', bg: 'bg-surface-container-high', text: 'text-on-surface' },
  cancelled: { label: 'Отменено', icon: 'cancel', bg: 'bg-red-50', text: 'text-red-600' },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.confirmed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${c.bg} ${c.text}`}>
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{c.icon}</span>
      {c.label}
    </span>
  );
}

const Bookings = () => {
  const { isAuthenticated } = useAuth();
  const { success, error } = useAlert();
  const [activeTab, setActiveTab] = useState('active');
  const [confirmId, setConfirmId] = useState(null);

  const { data: bookings = [], isLoading } = useMyBookings();
  const cancel = useCancelBooking();

  const { activeBookings, completedBookings } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const active = [];
    const done = [];
    for (const b of bookings) {
      const isPast = b.date < today;
      const terminal = b.status === 'cancelled' || b.status === 'completed';
      if (terminal || isPast) done.push(b);
      else active.push(b);
    }
    return { activeBookings: active, completedBookings: done };
  }, [bookings]);

  if (!isAuthenticated) {
    return (
      <AuthRequired
        icon="calendar_today"
        title="Ваши брони"
        description="Войдите чтобы просмотреть забронированные площадки и управлять бронями."
        buttonText="Войти"
      />
    );
  }

  const displayBookings = activeTab === 'active' ? activeBookings : completedBookings;

  const handleConfirmCancel = async () => {
    if (!confirmId) return;
    try {
      await cancel.mutateAsync(confirmId);
      success('Бронирование отменено');
    } catch (err) {
      error(apiErrorMessage(err));
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-12">
      <Header title="Мои бронирования" subtitle="Управляйте своими тренировками" showBack={false} />

      <div className="sticky top-0 z-40 bg-surface backdrop-blur-md border-b border-surface-container-high">
        <div className="px-4 md:px-6 pt-4 pb-4">
          <div className="flex gap-2 p-1.5 bg-surface-container-high rounded-2xl">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'active'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Активные ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'completed'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Прошедшие ({completedBookings.length})
            </button>
          </div>
        </div>
      </div>

      <section className="px-4 md:px-6 pt-6 pb-8">
        {isLoading ? (
          <div className="text-center py-16 text-on-surface-variant">Загрузка…</div>
        ) : displayBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayBookings.map((b) => {
              const photo = b.facility?.photos?.[0]?.url;
              const isActive = activeTab === 'active';
              return (
                <div
                  key={b.id}
                  className="group relative overflow-hidden bg-white rounded-3xl p-5 border border-surface-container-high transition-all hover:shadow-md"
                >
                  <div className="flex gap-4">
                    {photo ? (
                      <img
                        src={resolveUploadUrl(photo)}
                        alt={b.facility?.name}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-2xl">sports_kabaddi</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="text-base font-bold text-primary font-headline truncate">
                          {b.facility?.name ?? 'Площадка'}
                        </h3>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-on-surface-variant text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                        {b.facility?.city}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-sm font-bold text-primary">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                          {formatDate(b.date)}
                        </span>
                        <span className="text-on-surface-variant">•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                          {b.startTime}–{b.endTime}
                        </span>
                        <span className="text-on-surface-variant">•</span>
                        <span>{formatPrice(b.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                  {isActive && b.status !== 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-surface-container-high">
                      <button
                        onClick={() => setConfirmId(b.id)}
                        disabled={cancel.isPending}
                        className="w-full py-2.5 rounded-xl font-bold text-sm bg-surface-container-low text-on-surface hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        Отменить
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-container-high mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                {activeTab === 'active' ? 'event_busy' : 'check_circle'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-primary mb-2 font-headline">
              {activeTab === 'active' ? 'Нет активных бронирований' : 'Нет прошедших бронирований'}
            </h3>
            <p className="text-on-surface-variant text-sm mb-8 max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'Исследуйте площадки города и забронируйте тренировку'
                : 'Завершённые и отменённые брони появятся здесь'}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/"
                className="inline-block px-8 py-3 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold hover:opacity-90 transition-colors text-sm"
              >
                Найти площадку
              </Link>
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!confirmId}
        onCancel={() => setConfirmId(null)}
        onConfirm={handleConfirmCancel}
        isDangerous
        title="Отменить бронирование?"
        message="Слот снова станет доступным для других. Это действие необратимо."
        confirmText="Отменить бронь"
        cancelText="Назад"
      />
    </div>
  );
};

export default Bookings;
