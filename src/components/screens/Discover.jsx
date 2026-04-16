import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../layout/Header.jsx';
import FacilityCard from '../features/FacilityCard.jsx';
import CustomSelect from '../forms/CustomSelect.jsx';
import CustomSearchInput from '../forms/CustomSearchInput.jsx';
import { useFacilities } from '../../api/hooks/facilities.js';
import { useAuth } from '../../context/AuthContext.jsx';

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];

const Discover = () => {
  const { setIsAuthModalOpen } = useAuth();
  const [params, setParams] = useSearchParams();

  const selectedCity = params.get('city') || '';
  const selectedSport = params.get('sport') || '';
  const searchQuery = params.get('q') || '';

  const setFilter = (key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key === 'city') next.delete('sport');
      return next;
    }, { replace: true });
  };

  const { data: sportsData } = useFacilities({
    city: selectedCity || undefined,
    search: searchQuery.trim() || undefined,
    limit: 50,
  });

  const sportsInCity = useMemo(() => {
    const items = sportsData?.items ?? [];
    return [...new Set(items.map((f) => f.sport))].sort();
  }, [sportsData]);

  const { data, isLoading, isError } = useFacilities({
    city: selectedCity || undefined,
    sport: selectedSport || undefined,
    search: searchQuery.trim() || undefined,
    limit: 50,
  });

  const facilities = data?.items ?? [];

  const cityOptions = [
    { value: '', label: 'Все города' },
    ...CITIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="min-h-screen bg-surface pb-24">
      <Header title="Найди свой" highlightText="клуб" />

      <section className="px-4 pt-4 pb-6 space-y-4">
        <CustomSelect
          value={selectedCity}
          onChange={(v) => setFilter('city', v)}
          options={cityOptions}
          placeholder="Все города"
        />

        <CustomSearchInput
          value={searchQuery}
          onChange={(v) => setFilter('q', v)}
          onClear={() => setFilter('q', '')}
          placeholder="Название или адрес..."
        />
      </section>

      {sportsInCity.length > 0 && (
        <section className="mt-2">
          <div className="flex gap-2 px-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setFilter('sport', '')}
              className={`flex-none px-5 py-2 rounded-full text-xs font-bold border transition-all ${
                !selectedSport
                  ? 'bg-primary-fixed text-on-primary-fixed border-transparent'
                  : 'bg-white text-on-surface-variant border-surface-container-high'
              }`}
            >
              Все виды
            </button>
            {sportsInCity.map((sport) => (
              <button
                key={sport}
                onClick={() => setFilter('sport', sport)}
                className={`flex-none px-5 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  selectedSport === sport
                    ? 'bg-primary-fixed text-on-primary-fixed border-transparent'
                    : 'bg-white text-on-surface-variant border-surface-container-high'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="px-4 mb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-primary font-headline">
            {selectedCity ? `Клубы — ${selectedCity}` : 'Все клубы'}
          </h2>
        </div>

        {isLoading ? (
          <div className="px-4 text-center py-12 text-on-surface-variant">Загрузка…</div>
        ) : isError ? (
          <div className="px-4 text-center py-12 text-red-600 text-sm">
            Не удалось загрузить клубы
          </div>
        ) : facilities.length > 0 ? (
          <div className="space-y-4 px-4">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        ) : (
          <div className="px-4 text-center py-12">
            <div className="text-4xl mb-4">🏟️</div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Площадок не найдено</h3>
            <p className="text-on-surface-variant text-sm">
              Попробуйте изменить город или вид спорта
            </p>
          </div>
        )}
      </section>

      <section className="mt-12 px-4">
        <div className="bg-white rounded-2xl p-6 border border-surface-container-high shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
              <h2 className="text-lg font-bold text-on-surface font-headline">
                Сдавайте клуб
              </h2>
            </div>
            <p className="text-on-surface-variant text-sm mb-4">
              Управляйте бронированиями и доходами прямо со смартфона.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-primary-fixed text-on-primary-fixed py-3 rounded-xl font-headline font-bold text-sm active:scale-95 transition-transform"
            >
              Начать
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Discover;
