import React from 'react';

const CourtSelector = ({ 
  selectedCourt,
  onCourtSelect,
  courts = [],
  facilityName
}) => {
  if (!courts || courts.length <= 1) {
    return null;
  }

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 block">
        Выберите зал
      </label>

      <div className="space-y-2">
        {courts.map((court) => (
          <button
            key={court.id}
            onClick={() => onCourtSelect(court.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedCourt === court.id
                ? 'bg-primary-fixed/20 border-primary-fixed text-primary'
                : 'bg-white border-surface-container-high text-on-surface hover:border-primary-fixed/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold">{court.name}</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {court.description}
                </p>
              </div>
              {selectedCourt === court.id && (
                <span className="material-symbols-outlined text-primary-fixed">check_circle</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CourtSelector;
