import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlert } from '../../context/AlertContext.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import CustomDatePicker from '../forms/CustomDatePicker.jsx';
import {
  useMyFacilities, useOwnerBookings, useOwnerStats,
  useDeleteFacility, useUpdateBookingStatus, useCreateOwnerBooking,
} from '../../api/hooks/owner.js';
import { useCourtSlots } from '../../api/hooks/facilities.js';
import { apiErrorMessage, resolveUploadUrl } from '../../api/client.js';
import { formatPrice } from '../../utils/formatters.js';

const STATUS_LABEL = {
  pending: { label: 'Ожидает', bg: 'bg-secondary/10 text-secondary' },
  confirmed: { label: 'Подтв.', bg: 'bg-primary-fixed/20 text-primary' },
  cancelled: { label: 'Отмен.', bg: 'bg-surface-container-high text-on-surface-variant' },
  completed: { label: 'Завер.', bg: 'bg-surface-container-high text-on-surface' },
};

const MOD_LABEL = {
  pending: { label: 'На модерации', bg: 'bg-secondary/10 text-secondary', icon: 'pending' },
  approved: { label: 'Одобрено', bg: 'bg-primary-fixed/20 text-primary', icon: 'verified' },
  rejected: { label: 'Отклонено', bg: 'bg-surface-container-high text-on-surface-variant', icon: 'cancel' },
};

function todayIso() { return new Date().toISOString().slice(0, 10); }

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function formatDateShort(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3).toLowerCase()}`;
}

// ──── Mini Calendar Picker (для фильтров) ────
function MiniCalendar({ value, onChange, label, placeholder = 'Выберите' }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDow = (() => { const d = new Date(month.getFullYear(), month.getMonth(), 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const select = (day) => {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    onChange(d.toISOString().split('T')[0]);
    setOpen(false);
  };

  const isSelected = (day) => {
    if (!day || !value) return false;
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    return d.toISOString().split('T')[0] === value;
  };

  const isToday = (day) => {
    if (!day) return false;
    const t = new Date();
    return day === t.getDate() && month.getMonth() === t.getMonth() && month.getFullYear() === t.getFullYear();
  };

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-sm text-left flex items-center justify-between hover:border-primary-fixed/50 transition-colors">
        <span className={value ? 'text-on-surface font-medium' : 'text-on-surface-variant'}>{value ? formatDateShort(value) : placeholder}</span>
        <span className="material-symbols-outlined text-base">calendar_today</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 bg-white rounded-2xl border border-surface-container-high shadow-xl p-3 mt-1 w-64">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
              className="p-1 hover:bg-surface-container-low rounded transition-colors">
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-on-surface">{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
              className="p-1 hover:bg-surface-container-low rounded transition-colors">
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => <div key={w} className="text-center text-[10px] font-bold text-on-surface-variant py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <button key={i} type="button" disabled={!day} onClick={() => day && select(day)}
                className={`aspect-square rounded-md text-xs font-bold transition-all ${
                  !day ? '' : isSelected(day) ? 'bg-primary-fixed text-on-primary-fixed' : isToday(day) ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'
                }`}>{day}</button>
            ))}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="w-full mt-2 text-xs text-primary font-bold hover:opacity-80">Сбросить</button>
          )}
        </div>
      )}
    </div>
  );
}

// ──── Create Booking Modal ────
function CreateBookingModal({ isOpen, onClose, facilities }) {
  const { success, error } = useAlert();
  const createBooking = useCreateOwnerBooking();
  const [facilityId, setFacilityId] = useState('');
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const selectedFac = facilities.find((f) => f.id === facilityId);
  const courts = selectedFac?.courts ?? [];
  const activeCourt = courtId || courts[0]?.id || '';

  const { data: slotsData, isLoading: slotsLoading } = useCourtSlots(activeCourt || undefined, date);
  const slots = slotsData?.slots ?? [];

  const canBookBlock = (st, dur) => {
    const idx = slots.findIndex((s) => s.time === st);
    if (idx === -1) return false;
    for (let i = 0; i < dur; i++) { if (!slots[idx + i]?.available) return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeCourt || !startTime || !guestName.trim()) return;
    try {
      await createBooking.mutateAsync({
        courtId: activeCourt, date, startTime, duration, guestName,
        guestPhone: guestPhone.trim() || undefined,
      });
      success('Бронь внесена');
      setStartTime(null); setGuestName(''); setGuestPhone('');
      onClose();
    } catch (err) {
      error(apiErrorMessage(err));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[20px] z-[9998]" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        <div className="min-h-full flex items-start justify-center p-4 pt-8 pb-8">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl">
          <div className="relative p-6 border-b border-surface-container-high">
            <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h2 className="text-xl font-bold text-on-surface font-headline">Внести бронь</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Клуб</label>
              <select value={facilityId} onChange={(e) => { setFacilityId(e.target.value); setCourtId(''); setStartTime(null); }}
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50">
                <option value="">Выберите клуб</option>
                {facilities.filter((f) => f.moderationStatus === 'approved').map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {formatPrice(f.pricePerHour)}/ч</option>
                ))}
              </select>
            </div>

            {facilityId && courts.length > 1 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Зал</label>
                <div className="flex gap-2 flex-wrap">
                  {courts.map((c) => (
                    <button key={c.id} type="button" onClick={() => { setCourtId(c.id); setStartTime(null); }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${activeCourt === c.id ? 'bg-primary-fixed text-on-primary-fixed border-transparent' : 'bg-white text-on-surface border-surface-container-high'}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {facilityId && (
              <CustomDatePicker value={date} onChange={(d) => { setDate(d); setStartTime(null); }} label="Дата" />
            )}

            {facilityId && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Длительность</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((d) => (
                    <button key={d} type="button" onClick={() => { setDuration(d); if (startTime && !canBookBlock(startTime, d)) setStartTime(null); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${duration === d ? 'bg-primary-fixed text-on-primary-fixed border-transparent' : 'bg-white text-on-surface border-surface-container-high'}`}
                    >{d} ч</button>
                  ))}
                </div>
              </div>
            )}

            {facilityId && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Время</label>
                {slotsLoading ? <div className="text-sm text-on-surface-variant">Загрузка…</div>
                : slots.length === 0 ? <div className="text-sm text-on-surface-variant">Нет слотов</div>
                : (
                  <div className="grid grid-cols-5 gap-2">
                    {slots.map((s) => {
                      const canStart = s.available && canBookBlock(s.time, duration);
                      return (
                        <button key={s.time} type="button" disabled={!canStart} onClick={() => setStartTime(s.time)}
                          className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                            startTime === s.time ? 'bg-primary-fixed text-on-primary-fixed border-transparent ring-2 ring-primary-fixed/40'
                            : !s.available ? 'bg-surface-container-low text-on-surface-variant/40 border-transparent cursor-not-allowed line-through'
                            : canStart ? 'bg-white text-on-surface border-surface-container-high hover:border-primary-fixed'
                            : 'bg-white text-on-surface-variant/50 border-surface-container-high cursor-not-allowed'
                          }`}>{s.time}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Имя клиента *</label>
                <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Иван Иванов"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Телефон</label>
                <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+7 999 000-00-00"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50" />
              </div>
            </div>

            {startTime && selectedFac && (
              <div className="flex items-center justify-between pt-4 border-t border-surface-container-high">
                <span className="text-on-surface-variant font-bold">Итого ({duration} ч)</span>
                <span className="text-xl font-black text-primary font-headline">{formatPrice(selectedFac.pricePerHour * duration)}</span>
              </div>
            )}

            <button type="submit"
              disabled={!facilityId || !startTime || !guestName.trim() || createBooking.isPending}
              className="w-full py-3.5 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all">
              {createBooking.isPending ? 'Создание…' : 'Внести бронь'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  );
}

// ──── Main Dashboard ────
const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error } = useAlert();
  const [activeTab, setActiveTab] = useState('overview');
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);

  const [filterFacility, setFilterFacility] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const { data: facilities = [], isLoading: facilitiesLoading } = useMyFacilities();
  const { data: ownerBookings = [] } = useOwnerBookings({
    facilityId: filterFacility || undefined,
    status: filterStatus || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
  });
  const { data: stats } = useOwnerStats();
  const deleteFacility = useDeleteFacility();
  const updateBookingStatus = useUpdateBookingStatus();

  const hasFilters = filterFacility || filterStatus || filterFrom || filterTo;

  const handleLogout = async () => { setIsConfirmLogoutOpen(false); await logout(); };

  const handleDeleteFacility = async () => {
    if (!deleteTargetId) return;
    try { await deleteFacility.mutateAsync(deleteTargetId); success('Клуб удалён'); }
    catch (err) { error(apiErrorMessage(err)); }
    finally { setDeleteTargetId(null); }
  };

  const handleBookingStatus = async (id, status) => {
    try { await updateBookingStatus.mutateAsync({ id, status }); success('Статус обновлён'); }
    catch (err) { error(apiErrorMessage(err)); }
  };

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="sticky top-0 z-30 bg-white border-b border-surface-container-high">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary font-headline">🏢 Кабинет организатора</h1>
            <p className="text-xs text-on-surface-variant">{user?.name}</p>
          </div>
          <button onClick={() => setIsConfirmLogoutOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">Выход</button>
        </div>
      </header>

      <div className="sticky top-[72px] z-20 bg-white border-b border-surface-container-high px-4">
        <div className="flex gap-4">
          {[{ k: 'overview', l: 'Обзор' }, { k: 'facilities', l: 'Мои клубы' }, { k: 'bookings', l: 'Брони' }].map((t) => (
            <button key={t.k} onClick={() => setActiveTab(t.k)}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === t.k ? 'border-primary-fixed text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>{t.l}</button>
          ))}
        </div>
      </div>

      <section className="p-4 pb-6 space-y-4">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-surface-container-high text-center shadow-sm">
                <p className="text-2xl font-bold text-primary font-headline">{stats?.facilities?.total ?? 0}</p>
                <p className="text-xs text-on-surface-variant mt-1">Клубов</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-surface-container-high text-center shadow-sm">
                <p className="text-2xl font-bold text-primary-fixed font-headline">{stats?.bookings?.upcoming ?? 0}</p>
                <p className="text-xs text-on-surface-variant mt-1">Предстоит</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-surface-container-high text-center shadow-sm">
                <p className="text-xl font-bold text-primary font-headline">{formatPrice(stats?.totalRevenue ?? 0)}</p>
                <p className="text-xs text-on-surface-variant mt-1">Доход</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/owner/add-facility')}
                className="flex-1 px-4 py-3 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add</span> Новый клуб
              </button>
              <button onClick={() => { setActiveTab('bookings'); setIsCreateBookingOpen(true); }}
                className="flex-1 px-4 py-3 bg-white text-primary border border-primary-fixed rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">edit_calendar</span> Внести бронь
              </button>
            </div>
          </>
        )}

        {/* ── FACILITIES ── */}
        {activeTab === 'facilities' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-on-surface">Мои клубы ({facilities.length})</h3>
              <button onClick={() => navigate('/owner/add-facility')} className="text-sm font-bold text-primary hover:opacity-80">+ Добавить</button>
            </div>
            {facilitiesLoading ? <div className="text-center py-8 text-on-surface-variant">Загрузка…</div>
            : facilities.length > 0 ? (
              <div className="space-y-3">
                {facilities.map((f) => {
                  const mod = MOD_LABEL[f.moderationStatus] ?? MOD_LABEL.pending;
                  const photo = f.photos?.[0]?.url;
                  return (
                    <div key={f.id} className="bg-white rounded-2xl overflow-hidden border border-surface-container-high shadow-sm">
                      <div className="flex gap-3 p-3">
                        {photo ? <img src={resolveUploadUrl(photo)} alt={f.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-20 h-20 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary">sports_kabaddi</span></div>}
                        <div className="flex-1 min-w-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${mod.bg} mb-1`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{mod.icon}</span>{mod.label}
                          </span>
                          <h4 className="font-bold text-on-surface font-headline truncate">{f.name}</h4>
                          <p className="text-xs text-on-surface-variant truncate">{f.sport} • {f.district}, {f.city}</p>
                          <span className="px-2 py-1 bg-primary-fixed/20 text-primary rounded-lg text-xs font-bold mt-1 inline-block">{formatPrice(f.pricePerHour)}/ч</span>
                        </div>
                      </div>
                      <div className="bg-surface-container-low px-4 py-3 flex gap-2 border-t border-surface-container-high">
                        <button onClick={() => navigate(`/owner/edit-facility/${f.id}`)} className="flex-1 text-xs font-semibold text-primary hover:bg-primary-fixed/10 p-2 rounded transition-colors">Редактировать</button>
                        <button onClick={() => setDeleteTargetId(f.id)} className="flex-1 text-xs font-semibold text-red-600 hover:bg-red-50 p-2 rounded transition-colors">Удалить</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-2xl border border-surface-container-high shadow-sm">
                <p className="text-on-surface-variant text-sm mb-4">Нет клубов</p>
                <button onClick={() => navigate('/owner/add-facility')} className="px-6 py-2 bg-primary-fixed text-on-primary-fixed font-bold rounded-xl active:scale-95 transition-transform">Добавить клуб</button>
              </div>
            )}
          </>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-on-surface">Брони ({ownerBookings.length})</h3>
              <button onClick={() => setIsCreateBookingOpen(true)}
                className="text-sm font-bold text-primary hover:opacity-80 flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Внести бронь
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 border border-surface-container-high space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Клуб</label>
                  <select value={filterFacility} onChange={(e) => setFilterFacility(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-sm focus:outline-none">
                    <option value="">Все клубы</option>
                    {facilities.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Статус</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container-high text-sm focus:outline-none">
                    <option value="">Все</option>
                    <option value="confirmed">Подтверждённые</option>
                    <option value="pending">Ожидающие</option>
                    <option value="completed">Завершённые</option>
                    <option value="cancelled">Отменённые</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MiniCalendar value={filterFrom} onChange={setFilterFrom} label="От" placeholder="Начало" />
                <MiniCalendar value={filterTo} onChange={setFilterTo} label="До" placeholder="Конец" />
              </div>
              {hasFilters && (
                <button onClick={() => { setFilterFacility(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); }}
                  className="text-xs font-bold text-primary hover:opacity-80">Сбросить фильтры</button>
              )}
            </div>

            {/* Booking cards */}
            {ownerBookings.length > 0 ? (
              <div className="space-y-3">
                {ownerBookings.map((b) => {
                  const s = STATUS_LABEL[b.status] ?? STATUS_LABEL.pending;
                  const clientName = b.guestName || b.user?.name || 'Клиент';
                  const clientContact = b.guestPhone || b.user?.email || '';
                  const isGuest = !!b.guestName;
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-surface-container-high p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-on-surface truncate">{b.facility?.name}{b.court?.name ? ` — ${b.court.name}` : ''}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{b.date} • {b.startTime}–{b.endTime}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="font-bold text-primary">{formatPrice(b.totalPrice)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.bg}`}>{s.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 py-3 border-t border-surface-container-high">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">{isGuest ? 'phone' : 'person'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">
                            {clientName}
                            {isGuest && <span className="text-[10px] font-normal text-on-surface-variant ml-1">(по телефону)</span>}
                          </p>
                          {clientContact && <p className="text-xs text-on-surface-variant truncate">{clientContact}</p>}
                        </div>
                        {b.guestPhone && (
                          <a href={`tel:${b.guestPhone}`} className="p-2 rounded-full bg-primary-fixed/10 text-primary hover:bg-primary-fixed/20 transition-colors flex-shrink-0">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                          </a>
                        )}
                      </div>

                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <div className="flex gap-2 pt-3 border-t border-surface-container-high">
                          {b.status === 'pending' && <button onClick={() => handleBookingStatus(b.id, 'confirmed')} className="flex-1 py-2 text-xs font-bold bg-primary-fixed text-on-primary-fixed rounded-lg">Подтвердить</button>}
                          {b.status === 'confirmed' && <button onClick={() => handleBookingStatus(b.id, 'completed')} className="flex-1 py-2 text-xs font-bold bg-surface-container-high text-on-surface rounded-lg">Завершить</button>}
                          <button onClick={() => handleBookingStatus(b.id, 'cancelled')} className="flex-1 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-lg">Отменить</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-surface-container-high">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-3">event_busy</span>
                <p className="text-on-surface font-bold mb-1">{hasFilters ? 'Ничего не найдено' : 'Нет броней'}</p>
                <p className="text-on-surface-variant text-sm mb-4">{hasFilters ? 'Попробуйте изменить фильтры' : 'Внесите первую бронь'}</p>
                {!hasFilters && (
                  <button onClick={() => setIsCreateBookingOpen(true)}
                    className="px-6 py-2 bg-primary-fixed text-on-primary-fixed font-bold rounded-xl active:scale-95 transition-transform">Внести бронь</button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <CreateBookingModal isOpen={isCreateBookingOpen} onClose={() => setIsCreateBookingOpen(false)} facilities={facilities} />
      <ConfirmDialog isOpen={isConfirmLogoutOpen} title="Выход" message="Вы уверены?" confirmText="Выйти" cancelText="Отмена" onConfirm={handleLogout} onCancel={() => setIsConfirmLogoutOpen(false)} isDangerous />
      <ConfirmDialog isOpen={!!deleteTargetId} title="Удалить клуб?" message="Все связанные брони будут удалены." confirmText="Удалить" cancelText="Отмена" onConfirm={handleDeleteFacility} onCancel={() => setDeleteTargetId(null)} isDangerous />
    </div>
  );
};

export default OwnerDashboard;
