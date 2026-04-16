import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../layout/Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import FacilityCard from '../features/FacilityCard.jsx';
import AuthRequired from '../ui/AuthRequired.jsx';
import { useFavorites } from '../../api/hooks/favorites.js';

const Favorites = () => {
  const { isAuthenticated } = useAuth();
  const { data: favorites = [], isLoading } = useFavorites();

  if (!isAuthenticated) {
    return (
      <AuthRequired
        icon="favorite"
        title="Избранные места"
        description="Войдите, чтобы сохранять и просматривать вашу коллекцию избранных клубов."
        buttonText="Войти"
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <Header title="Избранные места" subtitle="Ваши любимые спортивные клубы" />

      <section className="px-4 pt-4 pb-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-on-surface-variant">Загрузка…</div>
        ) : favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((f) => (
              <FacilityCard
                key={f.facilityId}
                facility={f.facility}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">♡</div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Пока нет избранных</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              Добавляй нажатием сердечка на понравившихся клубах
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-primary-fixed text-on-primary-fixed font-bold rounded-xl transition-transform active:scale-95"
            >
              Смотреть клубы
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Favorites;
