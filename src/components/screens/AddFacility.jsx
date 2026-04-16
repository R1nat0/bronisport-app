import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header.jsx';
import { useAlert } from '../../context/AlertContext.jsx';
import { useCreateFacility } from '../../api/hooks/owner.js';
import { api, apiErrorMessage } from '../../api/client.js';

const SPORTS = [
  'Футбол',
  'Теннис',
  'Баскетбол',
  'Волейбол',
  'Бадминтон',
  'Настольный теннис',
  'Хоккей',
  'Сквош',
];

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];

const DISTRICTS = {
  'Москва': ['Центр', 'ЮААО', 'СВАО', 'ЮВАО', 'СЗАО', 'ЗАО', 'ВАО', 'САО'],
  'Санкт-Петербург': ['Центр', 'Василеостровский', 'Петроградский', 'Кировский', 'Московский'],
  'Казань': ['Вахитовский', 'Советский', 'Приволжский', 'Кировский'],
  'Екатеринбург': ['Центр', 'Ленинский', 'Октябрьский', 'Железнодорожный'],
  'Новосибирск': ['Центр', 'Первомайский', 'Октябрьский', 'Ленинский'],
};

const AddFacility = () => {
  const navigate = useNavigate();
  const { success, error } = useAlert();
  const createFacility = useCreateFacility();
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    city: 'Москва',
    district: '',
    address: '',
    pricePerHour: '',
    description: '',
    openTime: '08:00',
    closeTime: '22:00',
  });
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'city') next.district = '';
      return next;
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setPhotos(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const created = await createFacility.mutateAsync({
        ...formData,
        pricePerHour: Number(formData.pricePerHour),
      });

      if (photos.length > 0) {
        setIsUploading(true);
        const fd = new FormData();
        for (const p of photos) fd.append('photos', p);
        try {
          await api.post(`/owner/facilities/${created.id}/photos`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadErr) {
          error(`Площадка создана, но фото не загрузились: ${apiErrorMessage(uploadErr)}`);
          navigate('/owner');
          return;
        } finally {
          setIsUploading(false);
        }
      }

      success('Площадка отправлена на модерацию');
      navigate('/owner');
    } catch (err) {
      error(apiErrorMessage(err));
    }
  };

  const districtsList = DISTRICTS[formData.city] ?? [];
  const disabled =
    !formData.name ||
    !formData.sport ||
    !formData.district ||
    !formData.address ||
    !formData.pricePerHour ||
    createFacility.isPending ||
    isUploading;

  return (
    <div className="min-h-screen bg-surface pb-6">
      <Header title="Новая площадка" showBack onBack={() => navigate('/owner')} />

      <form onSubmit={handleSubmit} className="px-4 pt-6 pb-6 space-y-6 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          После создания площадка отправится на модерацию. Как только её одобрят — она появится в публичном списке.
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Основная информация</h3>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Название площадки</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Спортплекс «Надежда»"
              className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Вид спорта</label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              >
                <option value="">Выберите спорт</option>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Цена за час, ₽</label>
              <input
                type="number"
                name="pricePerHour"
                value={formData.pricePerHour}
                onChange={handleChange}
                min="1"
                placeholder="1500"
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Расположение</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Город</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Район</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              >
                <option value="">Выберите район</option>
                {districtsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Адрес</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="ул. Ленина, 15"
              className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Время работы</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Открывается</label>
              <input
                type="time"
                name="openTime"
                value={formData.openTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Закрывается</label>
              <input
                type="time"
                name="closeTime"
                value={formData.closeTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Описание</h3>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Укажите оборудование, условия, особенности..."
            rows="4"
            className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 resize-none"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Фотографии</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-6 rounded-xl bg-white border-2 border-dashed border-surface-container-high hover:bg-surface-container-low transition-colors flex flex-col items-center gap-2"
          >
            <span className="material-symbols-outlined text-3xl text-primary">image</span>
            <span className="text-sm font-bold text-on-surface">
              {photos.length > 0 ? `Выбрано файлов: ${photos.length}` : 'Выбрать фото'}
            </span>
            <span className="text-xs text-on-surface-variant">JPG / PNG / WebP, до 5 МБ, до 5 файлов</span>
          </button>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(p)}
                    alt={p.name}
                    className="w-full h-24 object-cover rounded-lg border border-surface-container-high"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={() => navigate('/owner')}
            className="flex-1 px-4 py-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-bold active:scale-95 transition-transform"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 px-4 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            {createFacility.isPending || isUploading ? 'Создание…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFacility;
