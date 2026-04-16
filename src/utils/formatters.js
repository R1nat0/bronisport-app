/**
 * Форматирует число, убирая .0 в конце
 * Примеры:
 * formatNumber(2.0) → "2"
 * formatNumber(2.5) → "2.5"
 * formatNumber(99.99) → "99.99"
 */
export const formatNumber = (num) => {
  const number = parseFloat(num);
  return Number.isInteger(number) ? String(number) : String(number);
};

/**
 * Форматирует цену в ₽
 * Примеры:
 * formatPrice(500) → "500 ₽"
 * formatPrice(1200.5) → "1200.5 ₽"
 */
export const formatPrice = (price) => {
  return `${formatNumber(price)} ₽`;
};

/**
 * Форматирует длительность в часах
 * Примеры:
 * formatDuration(2.0) → "2 ч."
 * formatDuration(1.5) → "1.5 ч."
 */
export const formatDuration = (duration) => {
  return `${formatNumber(duration)} ч.`;
};
