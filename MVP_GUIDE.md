# БрониСпорт MVP — Руководство по использованию

## 🚀 Запуск приложения

```bash
npm run dev
```

Приложение будет доступно на **http://localhost:3000**

---

## 👥 Тестовые аккаунты

### Клиент (Client)
- **Email:** `client@example.com`
- **Функции:** Поиск залов, бронирование, избранное, профиль

### Владелец зала (Owner)
- **Email:** `owner@example.com`
- **Функции:** Dashboard, управление залами, брони (UI only)

### Администратор (Admin)
- **Email:** `admin@sport.ru`
- **Функции:** Модерация залов (UI only)

---

## 📱 Основные экраны (клиент)

### 1. **Discover** (Поиск)
- Список спортивных залов с фильтрацией по городу, спорту
- Полнотекстовый поиск по названию, названию, спорту
- Отметка избранных (❤️) на карточках
- Модаль с полной информацией, отзывами, фото-слайдером
- Booking Flow: календарь дат + выбор времени

### 2. **Bookings** (Мои брони)
- Список текущих и прошлых броней
- Фильтрация по статусам (Подтверждена, Ожидает, Завершена)
- Кнопки "Связаться", "Отменить"
- Empty state с редиректом на Discover

### 3. **Favorites** (Избранные)
- Быстрый доступ к сохраненным залам
- Каждый зал имеет кнопку "Забронировать"
- Empty state если нет избранных

### 4. **Profile** (Профиль)
- Информация о пользователе (аватар, имя, email, роль)
- Статистика (количество броней, активные брони)
- Настройки (язык, уведомления)
- Кнопка выхода

---

## 🏢 Экраны владельца

### Owner Dashboard
- **Обзор:** Статистика (количество залов, брони, доход)
- **Мои залы:** Список с редактированием и аналитикой
- **Брони:** Календарь и список будущих броней
- **Добавить зал:** Форма для создания нового объекта

---

## 🛡️ Admin Panel

- **Статистика:** Количество залов, активных, на модерации
- **Залы на модерации:** Одобрение/отклонение
- **Все залы:** Полный список с фильтрацией по статусу

---

## 📊 Структура проекта

```
src/
├── components/
│   ├── features/              # Компоненты функционала
│   │   ├── FacilityCard.jsx   # Карточка зала
│   │   └── FacilityModal.jsx  # Модаль с деталями + booking flow
│   ├── layout/                # Layout компоненты
│   │   ├── Header.jsx         # Заголовок экрана
│   │   ├── BottomNav.jsx      # Фиксированная навигация
│   │   └── Layout.jsx         # Main layout
│   └── screens/               # Экраны приложения
│       ├── Discover.jsx       # Поиск залов
│       ├── Bookings.jsx       # Брони
│       ├── Favorites.jsx      # Избранное
│       ├── Profile.jsx        # Профиль
│       ├── Login.jsx          # Вход
│       ├── OwnerDashboard.jsx # Dashboard владельца
│       ├── AddFacility.jsx    # Форма добавления зала
│       └── AdminPanel.jsx     # Админ панель
│
├── context/                   # React Context для state management
│   ├── AuthContext.jsx        # Авторизация, избранные, пользователь
│   └── BookingContext.jsx     # Управление бронями
│
├── utils/
│   ├── mockData.js            # Mock данные (facilities, users, bookings)
│   └── (storage.js - для localStorage helpers)
│
├── router.jsx                 # Routes и условная логика для ролей
├── App.jsx                    # Entry point с провайдерами
├── main.jsx                   # React mount point
├── index.css                  # Глобальные стили
└── tailwind.config.js         # Tailwind конфигурация с дизайн-токенами
```

---

## 🎨 Design система

### Цвета (из DESIGN.md)
- **Primary:** `#001c03` (Deep trust blue-green)
- **Primary-fixed:** `#94f990` (Sport Green — action)
- **Surface:** `#f7f9fc` (Foundation background)
- **Surface-container:** `#eceef1` (Stacked layer)
- **On-surface:** `#191c1e` (Text color)

### Типография
- **Заголовки:** Manrope (bold, tight letter-spacing)
- **Body:** Inter (600/500 weight for readability)

### Правила
- ✗ NO 1px borders — только tonal nesting через background
- ✓ Glassmorphism для модалей
- ✓ Asymmetrical margins, много whitespace
- ✓ Bottom nav фиксирована (мобиль)
- ✓ Responsive м/tablet

---

## 💾 Data Persistence

- **localStorage** для user, favorites, bookings
- Mock данные инициализируют при первом запуске
- При логауте — очистка localStorage

---

## 🔑 Key Features

✅ **Клиент:**
- Поиск по городу, спорту, названию
- Избранные залы (♥ toggle)
- Booking flow (календарь + time slots)
- История броней с фильтрацией
- Профиль с редактированием

✅ **Владелец (UI only):**
- Dashboard с аналитикой
- Список своих залов
- Форма добавления нового зала
- Календарь броней

✅ **Админ (UI only):**
- Модерация залов
- Статистика платформы

---

## 🚀 Развертывание

### Build для production
```bash
npm run build
npm run preview
```

### Деплой на Vercel (рекомендуется)
1. Push код на GitHub
2. Подключить репо на Vercel
3. Vercel автоматически задеплоит

---

## 📝 TODO для полноценного приложения

- [ ] Backend API (Node.js/Express или другое)
- [ ] Реальная база данных (PostgreSQL / MongoDB)
- [ ] Функциональность upload фото
- [ ] Реальная авторизация (JWT, OAuth)
- [ ] Push-уведомления для попроса владельца
- [ ] Платежная система (Stripe, YandexKassa)
- [ ] Рейтинговая система с проверкой
- [ ] Real-time обновления статуса броней
- [ ] Интеграция с картами (Google Maps / 2GIS)
- [ ] Analytics (Amplitude, Mixpanel)
- [ ] Email/SMS уведомления

---

## 🐛 Известные ограничения (MVP)

- Данные хранятся только в localStorage (теряются при очистке)
- Финальные подтверждения броней автоматические (нет модерации владельца)
- Форма добавления зала не сохраняет данные
- Фото загрузка не реализована (используются Unsplash images)
- Admin approval/rejection тоже UI only

---

## 📞 Поддержка

Это MVP прототип для демонстрации концепции. Для вопросов по функционалу или улучшениям:
- 📧 contact@bronisport.ru (пример)
- 💬 Telegram @bronisport_team

---

**Версия:** 0.1.0  
**Дата:** Март 2026  
**Статус:** MVP ✅
