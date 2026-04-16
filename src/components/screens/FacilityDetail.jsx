import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlert } from '../../context/AlertContext.jsx';
import { useFacility, useFacilitySlots } from '../../api/hooks/facilities.js';
import { useCreateBooking } from '../../api/hooks/bookings.js';
import { useAddFavorite, useIsFavorite, useRemoveFavorite } from '../../api/hooks/favorites.js';
import { apiErrorMessage, resolveUploadUrl } from '../../api/client.js';
import { formatPrice } from '../../utils/formatters.js';
import CustomDatePicker from '../forms/CustomDatePicker.jsx';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

const FacilityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAthlete, setIsAuthModalOpen } = useAuth();
  const { error: showError, success: showSuccess } = useAlert();

  const { data: facility, isLoading, isError } = useFacility(id);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const { data: slotsData, isLoading: slotsLoading } = useFacilitySlots(id, selectedDate);
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState(1);

  const createBooking = useCreateBooking();
  const isLiked = useIsFavorite(id);
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const slots = slotsData?.slots ?? [];

  const canBookBlock = (startTime, dur) => {
    if (!startTime) return false;
    const startIdx = slots.findIndex((s) => s.time === startTime);
    if (startIdx === -1) return false;
    for (let i = 0; i < dur; i++) {
      const s = slots[startIdx + i];
      if (!s || !s.available) return false;
    }
    return true;
  };

  const isInBlock = (time) => {
    if (!selectedTime) return false;
    const startIdx = slots.findIndex((s) => s.time === selectedTime);
    const thisIdx = slots.findIndex((s) => s.time === time);
    return thisIdx >= startIdx && thisIdx < startIdx + duration;
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated) return setIsAuthModalOpen(true);
    if (isLiked) removeFav.mutate(id);
    else addFav.mutate(id);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) return setIsAuthModalOpen(true);
    if (!isAthlete) {
      showError('Бронировать могут только спортсмены');
      return;
    }
    if (!selectedTime) {
      showError('Выберите свободное время');
      return;
    }
    if (!canBookBlock(selectedTime, duration)) {
      showError(`Не все слоты свободны для ${duration} ч`);
      return;
    }
    try {
      await createBooking.mutateAsync({
        facilityId: id,
        date: selectedDate,
        startTime: selectedTime,
        duration,
      });
      showSuccess('Бронирование успешно создано!');
      setTimeout(() => navigate('/bookings'), 400);
    } catch (err) {
      showError(apiErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant">
        Загрузка…
      </div>
    );
  }

  if (isError || !facility) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-on-surface mb-4">Площадка не найдена</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-fixed text-on-primary-fixed rounded-xl font-headline font-bold"
          >
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  const mainPhoto = facility.photos?.[0]?.url;
  const totalPrice = facility.pricePerHour * duration;

  return (
    <div className="bg-surface min-h-screen">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-surface-container-high px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-on-surface hover:bg-surface-container rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-primary font-headline flex-1 truncate">
          {facility.name}
        </h1>
        <button
          onClick={handleToggleFavorite}
          className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
        >
          <span
            className="material-symbols-outlined"
            style={{
              color: isLiked ? '#94f990' : 'inherit',
              fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            favorite
          </span>
        </button>
      </div>

      <div>
        <div className="px-4 pt-4 pb-6">
          <div className="relative h-56 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-fixed flex items-center justify-center">
            {mainPhoto ? (
              <img src={resolveUploadUrl(mainPhoto)} alt={facility.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-6xl text-white/40">
                sports_kabaddi
              </span>
            )}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary">
              {facility.sport}
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 grid grid-cols-12 gap-6 md:gap-12 pb-24 md:pb-12">
          <div className="col-span-12 md:col-span-8 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-surface leading-tight">
                {facility.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-medium">
                {facility.rating != null && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <span className="text-on-surface font-bold">
                      {facility.rating.toFixed ? facility.rating.toFixed(1) : facility.rating}
                    </span>
                    <span className="text-sm">({facility.reviewsCount ?? 0} отзывов)</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="text-sm">{facility.address}, {facility.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined">schedule</span>
                  <span className="text-sm">{facility.openTime}–{facility.closeTime}</span>
                </div>
              </div>
            </div>

            {facility.description && (
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-extrabold font-headline">О площадке</h2>
                <p className="text-base md:text-lg leading-relaxed text-on-surface-variant">
                  {facility.description}
                </p>
              </div>
            )}

            {facility.reviews?.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-outline">
                <h2 className="text-xl md:text-2xl font-extrabold font-headline">Отзывы</h2>
                {facility.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-4 md:p-6 bg-white rounded-2xl border border-surface-container-high">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed/20 flex items-center justify-center font-bold text-xs text-primary">
                          {review.user?.name?.[0] ?? '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{review.user?.name ?? 'Пользователь'}</p>
                          <p className="text-xs text-on-surface-variant">
                            {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className="material-symbols-outlined text-amber-500 text-sm"
                            style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-on-surface-variant text-sm italic">"{review.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-12 md:col-span-4 md:sticky md:top-28 md:self-start space-y-4 pb-20 md:pb-0">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-surface-container-high shadow-sm space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    Цена за час
                  </p>
                  <p className="text-3xl font-black font-headline text-primary">
                    {formatPrice(facility.pricePerHour)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="material-symbols-outlined text-primary-fixed">bolt</span>
                  <p className="text-[10px] font-bold text-on-primary-container">Мгновенно</p>
                </div>
              </div>

              {!isAuthenticated ? (
                <>
                  <div className="py-8 space-y-4">
                    <div className="text-center space-y-3">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block">lock</span>
                      <p className="font-bold text-on-surface">Требуется вход</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Войдите чтобы забронировать площадку
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-4 rounded-xl font-headline font-extrabold text-on-primary-fixed bg-primary-fixed hover:opacity-90 transition-all active:scale-95"
                  >
                    Войти для бронирования
                  </button>
                </>
              ) : (
                <>
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={(d) => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                    label="Выберите дату"
                  />

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Длительность
                    </label>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setDuration(d);
                            if (selectedTime && !canBookBlock(selectedTime, d)) setSelectedTime(null);
                          }}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                            duration === d
                              ? 'bg-primary-fixed text-on-primary-fixed border-transparent'
                              : 'bg-white text-on-surface border-surface-container-high'
                          }`}
                        >
                          {d} ч
                        </button>
                      ))}
                    </div>

                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                      Доступное время
                    </label>
                    {slotsLoading ? (
                      <div className="text-sm text-on-surface-variant">Загрузка слотов…</div>
                    ) : slots.length === 0 ? (
                      <div className="text-sm text-on-surface-variant">Нет доступных слотов</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((s) => {
                          const blocked = !s.available;
                          const inBlock = isInBlock(s.time);
                          const isStart = selectedTime === s.time;
                          const canStart = s.available && canBookBlock(s.time, duration);
                          return (
                            <button
                              key={s.time}
                              type="button"
                              disabled={blocked || !canStart}
                              onClick={() => setSelectedTime(s.time)}
                              className={`py-2 rounded-lg text-sm font-bold border transition-all ${
                                isStart
                                  ? 'bg-primary-fixed text-on-primary-fixed border-transparent ring-2 ring-primary-fixed/40'
                                  : inBlock
                                  ? 'bg-primary-fixed/30 text-primary border-primary-fixed/40'
                                  : blocked
                                  ? 'bg-surface-container-low text-on-surface-variant/40 border-transparent cursor-not-allowed line-through'
                                  : canStart
                                  ? 'bg-white text-on-surface border-surface-container-high hover:border-primary-fixed'
                                  : 'bg-white text-on-surface-variant/50 border-surface-container-high cursor-not-allowed'
                              }`}
                            >
                              {s.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-headline font-bold text-on-surface-variant">
                        Итого ({duration} ч)
                      </span>
                      <span className="font-headline font-black text-2xl text-primary">
                        {formatPrice(totalPrice)}
                      </span>
                    </div>
                    <button
                      onClick={handleBooking}
                      disabled={createBooking.isPending || !selectedTime || !canBookBlock(selectedTime, duration)}
                      className="w-full py-4 rounded-xl font-headline font-extrabold text-on-primary-fixed bg-primary-fixed hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {createBooking.isPending ? 'Создание…' : 'Забронировать'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {facility.owner && (
              <div className="bg-white rounded-2xl p-4 border border-surface-container-high flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-primary-fixed/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Менеджер площадки
                  </p>
                  <p className="font-bold text-sm text-on-surface">{facility.owner.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetail;
