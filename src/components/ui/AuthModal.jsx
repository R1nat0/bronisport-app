import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api, apiErrorMessage, setAccessToken } from '../../api/client.js';

const INPUT_CLS =
  'w-full px-4 py-3 bg-surface-container-low rounded-xl border border-surface-container-high text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed/30 transition-colors disabled:opacity-50';

const BTN_PRIMARY =
  'w-full px-4 py-3.5 bg-primary-fixed text-on-primary-fixed rounded-xl font-bold hover:bg-primary-fixed/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

function ErrorMessage({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
      <span className="material-symbols-outlined text-red-500" style={{ fontSize: '18px' }}>error</span>
      <span className="text-sm text-red-700">{text}</span>
    </div>
  );
}

const AuthModal = ({ isOpen, onClose, preSelectedRole = 'athlete', preSelectedMode = 'login' }) => {
  const { login, register, updateUser } = useAuth();

  const [mode, setMode] = useState(preSelectedMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState(preSelectedRole);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setMode(preSelectedMode);
      setSelectedRole(preSelectedRole);
      setFormError('');
      setResetStep(0);
    }
  }, [isOpen, preSelectedMode, preSelectedRole]);

  const clearError = () => setFormError('');
  const reset = () => {
    setEmail('');
    setPassword('');
    setName('');
    setFormError('');
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setResetStep(0);
  };

  const humanError = (err) => {
    const msg = apiErrorMessage(err);
    const map = {
      'Invalid credentials': 'Неверный email или пароль',
      'Email already in use': 'Этот email уже зарегистрирован',
    };
    return map[msg] || msg;
  };

  const handleLoginRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email.trim() || !email.includes('@')) return setFormError('Введите корректный email');
    if (password.length < 6) return setFormError('Пароль должен содержать минимум 6 символов');
    if (mode === 'register' && name.trim().length < 1) return setFormError('Введите имя');

    setIsLoading(true);
    try {
      if (mode === 'login') await login({ email, password });
      else await register({ email, password, name, role: selectedRole });
      reset();
      onClose();
    } catch (err) {
      setFormError(humanError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);
    try {
      if (resetStep === 0) {
        if (!email.trim() || !email.includes('@')) { setFormError('Введите email'); setIsLoading(false); return; }
        await api.post('/auth/forgot', { email });
        setResetStep(1);
      } else if (resetStep === 1) {
        if (resetCode.length !== 6) { setFormError('Введите 6-цифровой код'); setIsLoading(false); return; }
        const { data } = await api.post('/auth/verify-code', { email, code: resetCode });
        setResetToken(data.resetToken);
        setResetStep(2);
      } else if (resetStep === 2) {
        if (newPassword.length < 6) { setFormError('Минимум 6 символов'); setIsLoading(false); return; }
        const { data } = await api.post('/auth/reset-password', { email, resetToken, newPassword });
        setAccessToken(data.accessToken);
        updateUser(data.user);
        reset();
        onClose();
      }
    } catch (err) {
      setFormError(humanError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  const title = isForgot
    ? ['Восстановление', 'Введите код', 'Новый пароль'][resetStep]
    : isRegister
    ? 'Регистрация'
    : 'Вход';

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[20px] z-[9998]" onClick={onClose} />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="relative p-6 border-b border-surface-container-high">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h2 className="text-2xl font-bold text-on-surface font-headline">{title}</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* === FORGOT PASSWORD FLOW === */}
            {isForgot && (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                {resetStep === 0 && (
                  <>
                    <p className="text-sm text-on-surface-variant">
                      Введите email, на который зарегистрирован аккаунт. Мы отправим код подтверждения.
                    </p>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} disabled={isLoading} autoComplete="email" className={INPUT_CLS} />
                  </>
                )}

                {resetStep === 1 && (
                  <>
                    <p className="text-sm text-on-surface-variant">
                      Код отправлен на <span className="font-bold text-on-surface">{email}</span>
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-цифровой код"
                      value={resetCode}
                      onChange={(e) => { setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                      disabled={isLoading}
                      autoComplete="one-time-code"
                      className={INPUT_CLS + ' text-center text-2xl tracking-[0.5em] font-bold'}
                    />
                    <p className="text-xs text-on-surface-variant text-center">Код действителен 15 минут</p>
                  </>
                )}

                {resetStep === 2 && (
                  <>
                    <p className="text-sm text-on-surface-variant">Придумайте новый пароль для аккаунта.</p>
                    <input type="password" placeholder="Новый пароль" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); clearError(); }} disabled={isLoading} autoComplete="new-password" className={INPUT_CLS} />
                  </>
                )}

                <ErrorMessage text={formError} />

                <button type="submit" disabled={isLoading} className={BTN_PRIMARY}>
                  {isLoading ? 'Загрузка…' : resetStep === 0 ? 'Отправить код' : resetStep === 1 ? 'Подтвердить' : 'Сохранить пароль'}
                </button>

                <div className="text-center">
                  <button type="button" onClick={() => { setMode('login'); reset(); }} className="text-sm text-primary font-bold hover:opacity-80">
                    Назад к входу
                  </button>
                </div>
              </form>
            )}

            {/* === LOGIN / REGISTER FLOW === */}
            {!isForgot && (
              <>
                {isRegister && (
                  <div className="flex gap-3 bg-surface-container-low p-1.5 rounded-xl">
                    <button
                      onClick={() => setSelectedRole('athlete')}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${selectedRole === 'athlete' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
                      type="button"
                    >
                      Спортсмен
                    </button>
                    <button
                      onClick={() => setSelectedRole('organizer')}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${selectedRole === 'organizer' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant'}`}
                      type="button"
                    >
                      Организатор
                    </button>
                  </div>
                )}

                {isRegister && (
                  <p className="text-xs text-on-surface-variant text-center">
                    {selectedRole === 'athlete'
                      ? 'Бронируйте спортивные залы, смотрите свои брони'
                      : 'Добавляйте залы, управляйте бронями и доходом'}
                  </p>
                )}

                <form onSubmit={handleLoginRegister} className="space-y-3">
                  {isRegister && (
                    <input type="text" placeholder="Имя" value={name} onChange={(e) => { setName(e.target.value); clearError(); }} disabled={isLoading} className={INPUT_CLS} />
                  )}
                  <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); clearError(); }} disabled={isLoading} autoComplete="email" className={INPUT_CLS} />
                  <input type="password" placeholder="Пароль" value={password} onChange={(e) => { setPassword(e.target.value); clearError(); }} disabled={isLoading} autoComplete={isRegister ? 'new-password' : 'current-password'} className={INPUT_CLS} />

                  <ErrorMessage text={formError} />

                  <button type="submit" disabled={isLoading} className={BTN_PRIMARY}>
                    {isLoading ? 'Загрузка…' : isRegister ? 'Создать аккаунт' : 'Войти'}
                  </button>
                </form>

                {!isRegister && (
                  <div className="text-center">
                    <button type="button" onClick={() => { setMode('forgot'); setFormError(''); setResetStep(0); }} className="text-sm text-on-surface-variant hover:text-primary transition-colors">
                      Забыли пароль?
                    </button>
                  </div>
                )}

                <div className="text-center text-sm text-on-surface-variant">
                  {isRegister ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}{' '}
                  <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); reset(); }} className="text-primary font-bold hover:opacity-80">
                    {isRegister ? 'Войти' : 'Зарегистрироваться'}
                  </button>
                </div>

                {!isRegister && import.meta.env.DEV && (
                  <div className="text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-3 leading-relaxed">
                    <div className="font-bold text-on-surface mb-1">Демо-аккаунты:</div>
                    <div>athlete@example.com / password123</div>
                    <div>organizer@example.com / password123</div>
                  </div>
                )}

                <p className="text-xs text-on-surface-variant text-center leading-relaxed">
                  Нажимая кнопку, вы соглашаетесь с{' '}
                  <a href="#" className="text-primary underline hover:opacity-80">офертой</a> и{' '}
                  <a href="#" className="text-primary underline hover:opacity-80">политикой конфиденциальности</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
