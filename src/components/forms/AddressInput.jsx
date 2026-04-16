import React, { useState, useRef, useEffect, useCallback } from 'react';

const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN;

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

const AddressInput = ({ value, onChange, onSelect, city, label = 'Адрес', placeholder = 'Начните вводить адрес...' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 3 || !DADATA_TOKEN) { setSuggestions([]); return; }
      try {
        const res = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${DADATA_TOKEN}`,
          },
          body: JSON.stringify({
            query,
            count: 5,
            locations: city ? [{ city }] : [],
          }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300),
    [city]
  );

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    fetchSuggestions(v);
  };

  const handleSelect = (s) => {
    onChange(s.value);
    setOpen(false);
    setSuggestions([]);
    if (onSelect) {
      onSelect({
        address: s.value,
        lat: s.data?.geo_lat ? parseFloat(s.data.geo_lat) : null,
        lng: s.data?.geo_lon ? parseFloat(s.data.geo_lon) : null,
        city: s.data?.city || '',
        district: s.data?.city_district || s.data?.area || '',
      });
    }
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-xs font-semibold text-on-surface mb-2">{label}</label>
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary-fixed/50"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-surface-container-high shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors border-b border-surface-container-high last:border-b-0"
            >
              <div className="font-medium">{s.value}</div>
              {s.data?.city && s.data.city !== city && (
                <div className="text-xs text-on-surface-variant mt-0.5">{s.data.city}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
