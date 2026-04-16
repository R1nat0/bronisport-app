import { useQuery } from '@tanstack/react-query';
import { api } from '../client.js';

export function useFacilities(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  return useQuery({
    queryKey: ['facilities', params],
    queryFn: async () => {
      const { data } = await api.get('/facilities', { params });
      return data;
    },
  });
}

export function useFacility(id) {
  return useQuery({
    queryKey: ['facility', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/facilities/${id}`);
      return data;
    },
  });
}

export function useFacilitySlots(id, date) {
  return useQuery({
    queryKey: ['facility', id, 'slots', date],
    enabled: !!id && !!date,
    queryFn: async () => {
      const { data } = await api.get(`/facilities/${id}/slots`, { params: { date } });
      return data;
    },
  });
}

export function useFacilityReviews(id) {
  return useQuery({
    queryKey: ['facility', id, 'reviews'],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/facilities/${id}/reviews`);
      return data;
    },
  });
}
