import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../layout/Header.jsx';
import { useAlert } from '../../context/AlertContext.jsx';
import { useMyFacilities, useUpdateFacility } from '../../api/hooks/owner.js';
import { api, apiErrorMessage, resolveUploadUrl } from '../../api/client.js';

const SPORTS = [
  'Футбол', 'Теннис', 'Баскетбол', 'Волейбол',
  'Бадминтон', 'Настольный теннис', 'Хоккей', 'Сквош',
];

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'];

const DISTRICTS = {
  'Москва': ['Центр', 'ЮААО', 'СВАО', 'ЮВАО', 'СЗАО', 'ЗАО', 'ВАО', 'САО'],
  'Санкт-Петербург': ['Центр', 'Василеостровский', 'Петроградский', 'Кировский', 'Московский'],
  'Казань': ['Вахитовский', 'Советский', 'Приволжский', 'Кировский'],
  'Екатеринбург': ['Центр', 'Ленинский', 'Октябрьский', 'Железнодорожный'],
  'Новосибирск': ['Центр', 'Первомайский', 'Октябрьский', 'Ленинский'],
};

const EditFacility = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useAlert();
  const queryClient = useQueryClient();
  const { data: facilities = [] } = useMyFacilities();
  const updateFacility = useUpdateFacility();
  const fileInputRef = useRef();

  const facility = facilities.find((f) => f.id === id);

  const [form, setForm] = useState(null);
  const [newPhotos, setNewPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (facility && !form) {
      setForm({
        name: facility.name,
        sport: facility.sport,
        city: facility.city,
        district: facility.district,
        address: facility.address,
        description: facility.description ?? '',
        pricePerHour: String(facility.pricePerHour),
        openTime: facility.openTime,
        closeTime: facility.closeTime,
        status: facility.status,
      });
    }
  }, [facility, form]);

  if (!facility) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant">
        Загрузка…
      </div>
    );
  }

  if (!form) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'city') next.district = '';
      return next;
    });
  };

  const refreshFacilities = () => queryClient.invalidateQueries({ queryKey: ['owner', 'facilities'] });

  const handleDeletePhoto = async (photoId) => {
    try {
      await api.delete(`/owner/facilities/${id}/photos/${photoId}`);
      success('Фото удалено');
      refreshFacilities();
    } catch (err) {
      error(apiErrorMessage(err));
    }
  };

  const handleUploadPhotos = async () => {
    if (newPhotos.length === 0) return;
    setIsUploading(true);
    const fd = new FormData();
    for (const p of newPhotos) fd.append('photos', p);
    try {
      await api.post(`/owner/facilities/${id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      success(`Загружено: ${newPhotos.length} фото`);
      setNewPhotos([]);
      refreshFacilities();
    } catch (err) {
      error(apiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateFacility.mutateAsync({
        id,
        name: form.name,
        sport: form.sport,
        city: form.city,
        district: form.district,
        address: form.address,
        description: form.description,
        pricePerHour: Number(form.pricePerHour),
        openTime: form.openTime,
        closeTime: form.closeTime,
        status: form.status,
      });
      success('Площадка обновлена');
      navigate('/owner');
    } catch (err) {
      error(apiErrorMessage(err));
    }
  };

  const districtsList = DISTRICTS[form.city] ?? [];

  const inputCls =
    'w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50';

  return (
    <div className="min-h-screen bg-surface pb-6">
      <Header title="Редактирование" showBack onBack={() => navigate('/owner')} />

      <form onSubmit={handleSubmit} className="px-4 pt-6 pb-6 space-y-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Основная информация</h3>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Название</label>
            <input name="name" value={form.name} onChange={handleChange} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Вид спорта</label>
              <select name="sport" value={form.sport} onChange={handleChange} className={inputCls}>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Цена / час</label>
              <input name="pricePerHour" type="number" min="1" value={form.pricePerHour} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Статус</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                <option value="active">Активна</option>
                <option value="inactive">Скрыта</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Расположение</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Город</label>
              <select name="city" value={form.city} onChange={handleChange} className={inputCls}>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Район</label>
              <select name="district" value={form.district} onChange={handleChange} className={inputCls}>
                <option value="">Выберите</option>
                {districtsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Адрес</label>
            <input name="address" value={form.address} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Время работы</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Открывается</label>
              <input type="time" name="openTime" value={form.openTime} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2">Закрывается</label>
              <input type="time" name="closeTime" value={form.closeTime} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Описание</h3>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className={inputCls + ' resize-none'}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Фотографии ({facility.photos?.length ?? 0})</h3>
          {facility.photos?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {facility.photos.map((p) => (
                <div key={p.id} className="relative group">
                  <img
                    src={resolveUploadUrl(p.url)}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg border border-surface-container-high"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(p.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => setNewPhotos(Array.from(e.target.files ?? []).slice(0, 5))}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-4 rounded-xl bg-white border-2 border-dashed border-surface-container-high hover:bg-surface-container-low transition-colors flex flex-col items-center gap-1"
          >
            <span className="material-symbols-outlined text-2xl text-primary">add_photo_alternate</span>
            <span className="text-xs font-bold text-on-surface">
              {newPhotos.length > 0 ? `Выбрано: ${newPhotos.length}` : 'Добавить фото'}
            </span>
          </button>
          {newPhotos.length > 0 && (
            <button
              type="button"
              onClick={handleUploadPhotos}
              disabled={isUploading}
              className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm disabled:opacity-50"
            >
              {isUploading ? 'Загрузка…' : `Загрузить ${newPhotos.length} фото`}
            </button>
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
            disabled={updateFacility.isPending || !form.name || !form.sport || !form.district}
            className="flex-1 px-4 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {updateFacility.isPending ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFacility;
