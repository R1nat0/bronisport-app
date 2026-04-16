import React from 'react';

const StaticMap = ({ lat, lng, name, width = 600, height = 300, zoom = 15 }) => {
  if (!lat || !lng) return null;

  const src = `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${lng},${lat}&z=${zoom}&size=${width},${height}&l=map&pt=${lng},${lat},pm2rdm`;

  const yandexUrl = `https://yandex.ru/maps/?pt=${lng},${lat}&z=${zoom}&l=map`;

  return (
    <div className="space-y-3">
      <h2 className="text-xl md:text-2xl font-extrabold font-headline">На карте</h2>
      <a
        href={yandexUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl overflow-hidden border border-surface-container-high hover:shadow-md transition-shadow"
      >
        <img
          src={src}
          alt={name || 'Карта'}
          className="w-full h-48 md:h-56 object-cover"
          loading="lazy"
        />
      </a>
      <p className="text-xs text-on-surface-variant text-center">
        Нажмите на карту, чтобы открыть в Яндекс.Картах
      </p>
    </div>
  );
};

export default StaticMap;
