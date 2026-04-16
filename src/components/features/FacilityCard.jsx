import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAddFavorite, useIsFavorite, useRemoveFavorite } from '../../api/hooks/favorites.js';
import { resolveUploadUrl } from '../../api/client.js';
import { formatPrice } from '../../utils/formatters.js';

const sportIcons = {
  'Футбол': 'sports_soccer',
  'Теннис': 'sports_tennis',
  'Баскетбол': 'sports_basketball',
  'Волейбол': 'sports_volleyball',
  'Бадминтон': 'sports_badminton',
  'Настольный теннис': 'sports_ping_pong',
  'Хоккей': 'ice_skating',
  'Сквош': 'sports_kabaddi',
};

const FacilityCard = ({ facility, showPhoto = true }) => {
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthModalOpen } = useAuth();
  const isLiked = useIsFavorite(facility.id);
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();

  const price = facility.pricePerHour ?? facility.price;
  const photo = facility.photo ?? facility.photos?.[0]?.url ?? facility.photos?.[0];

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isLiked) removeFav.mutate(facility.id);
    else addFav.mutate(facility.id);
  };

  const handleCardClick = () => navigate(`/facility/${facility.id}`);

  const handleBookingClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    handleCardClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-container-high hover:shadow-md transition-all cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary to-primary-fixed flex-shrink-0 flex items-center justify-center">
        {showPhoto && photo ? (
          <img
            src={resolveUploadUrl(photo)}
            alt={facility.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="material-symbols-outlined text-6xl text-white/60">
            {sportIcons[facility.sport] || 'sports_kabaddi'}
          </span>
        )}

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary">
          {facility.sport}
        </div>

        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform active:scale-90 flex-shrink-0"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{
              color: isLiked ? '#94f990' : '#191c1e',
              fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            favorite
          </span>
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-primary font-headline">{facility.name}</h3>
            <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-1">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span>{facility.district}</span>
            </div>
          </div>
          {facility.rating != null && (
            <div className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded font-bold text-sm">
              {facility.rating.toFixed ? facility.rating.toFixed(1) : facility.rating}
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-between items-center border-t border-surface-container-high pt-3">
          <span className="text-sm font-semibold text-primary">
            {formatPrice(price)} / час
          </span>
          <button
            onClick={handleBookingClick}
            className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg active:scale-95 transition-transform"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilityCard;
