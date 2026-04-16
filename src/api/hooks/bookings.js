import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function useMyBookings(status) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['bookings', 'my', status ?? 'all'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get('/bookings/my', { params: status ? { status } : {} });
      return data;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courtId, date, startTime, duration = 1 }) => {
      const { data } = await api.post('/bookings', { courtId, date, startTime, duration });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings', 'my'] });
      qc.invalidateQueries({ queryKey: ['court'] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId) => {
      const { data } = await api.delete(`/bookings/${bookingId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings', 'my'] });
      qc.invalidateQueries({ queryKey: ['facility'] });
    },
  });
}
