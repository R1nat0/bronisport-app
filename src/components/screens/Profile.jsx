import React, { useMemo, useState } from 'react';
import Header from '../layout/Header.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlert } from '../../context/AlertContext.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import AuthRequired from '../ui/AuthRequired.jsx';
import { useMyBookings } from '../../api/hooks/bookings.js';
import { useUpdateMe } from '../../api/hooks/user.js';
import { apiErrorMessage } from '../../api/client.js';

const Profile = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { success, error } = useAlert();
  const [isConfirmLogoutOpen, setIsConfirmLogoutOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  const { data: bookings = [] } = useMyBookings();
  const updateMe = useUpdateMe();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: bookings.length,
      active: bookings.filter((b) => (b.status === 'confirmed' || b.status === 'pending') && b.date >= today).length,
    };
  }, [bookings]);

  if (!isAuthenticated) {
    return (
      <AuthRequired
        icon="person"
        title="Личный кабинет"
        description="Войдите чтобы просмотреть и редактировать ваш профиль."
        buttonText="Войти"
      />
    );
  }

  const handleSave = async () => {
    try {
      await updateMe.mutateAsync({ name, phone });
      success('Профиль обновлён');
      setIsEditing(false);
    } catch (err) {
      error(apiErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    setIsConfirmLogoutOpen(false);
    await logout();
  };

  const roleLabel = user?.role === 'organizer' ? '🏢 Организатор' : '👤 Спортсмен';

  return (
    <div className="min-h-screen bg-surface pb-24">
      <Header title="Профиль" />

      <section className="px-4 pt-6 space-y-6 pb-4">
        <div className="bg-white rounded-2xl p-6 border border-surface-container-high text-center shadow-sm">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-primary-fixed/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-primary-fixed/20 flex items-center justify-center border-4 border-primary-fixed/20">
              <span className="material-symbols-outlined text-3xl text-primary">person</span>
            </div>
          )}

          {!isEditing ? (
            <>
              <h2 className="text-lg font-bold text-on-surface mb-1 font-headline">{user?.name}</h2>
              <p className="text-sm text-on-surface-variant">{user?.email}</p>
              {user?.phone && (
                <p className="text-sm text-on-surface-variant mt-1">{user.phone}</p>
              )}
              <div className="inline-block px-4 py-1.5 bg-primary-fixed/20 text-primary rounded-full text-xs font-bold mt-3">
                {roleLabel}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setName(user?.name ?? '');
                    setPhone(user?.phone ?? '');
                    setIsEditing(true);
                  }}
                  className="text-sm font-bold text-primary hover:opacity-80"
                >
                  Редактировать
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  Имя
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-primary-fixed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  Телефон
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-surface-container-high focus:outline-none focus:border-primary-fixed"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMe.isPending}
                  className="flex-1 px-4 py-3 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold disabled:opacity-50"
                >
                  {updateMe.isPending ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
        </div>

        {user?.role === 'athlete' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-surface-container-high text-center shadow-sm">
              <p className="text-2xl font-bold text-primary-fixed font-headline">{stats.total}</p>
              <p className="text-xs text-on-surface-variant mt-1">всего броней</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-surface-container-high text-center shadow-sm">
              <p className="text-2xl font-bold text-primary-fixed font-headline">{stats.active}</p>
              <p className="text-xs text-on-surface-variant mt-1">активных</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsConfirmLogoutOpen(true)}
          className="w-full px-4 py-3.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors font-headline"
        >
          Выход
        </button>

        <div className="text-center text-xs text-on-surface-variant pt-4 border-t border-surface-container-high">
          <p>БрониСпорт MVP v0.1.0</p>
          <p className="mt-1">© 2026 — Все права защищены</p>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isConfirmLogoutOpen}
        title="Выход из аккаунта"
        message="Вы уверены, что хотите выйти?"
        confirmText="Выйти"
        cancelText="Отмена"
        onConfirm={handleLogout}
        onCancel={() => setIsConfirmLogoutOpen(false)}
        isDangerous
      />
    </div>
  );
};

export default Profile;
