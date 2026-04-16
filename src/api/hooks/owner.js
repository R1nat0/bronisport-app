import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function useMyFacilities() {
  const { isOwner } = useAuth();
  return useQuery({
    queryKey: ['owner', 'facilities'],
    enabled: isOwner,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get('/owner/facilities');
      return data;
    },
  });
}

export function useOwnerStats() {
  const { isOwner } = useAuth();
  return useQuery({
    queryKey: ['owner', 'stats'],
    enabled: isOwner,
    queryFn: async () => {
      const { data } = await api.get('/owner/stats');
      return data;
    },
  });
}

export function useOwnerBookings(filters = {}) {
  const { isOwner } = useAuth();
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  return useQuery({
    queryKey: ['owner', 'bookings', params],
    enabled: isOwner,
    queryFn: async () => {
      const { data } = await api.get('/owner/bookings', { params });
      return data;
    },
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post('/owner/facilities', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner'] });
    },
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }) => {
      const { data } = await api.patch(`/owner/facilities/${id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner'] });
    },
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/owner/facilities/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner'] });
    },
  });
}

export function useCreateOwnerBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { data } = await api.post('/owner/bookings', body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['owner', 'stats'] });
      qc.invalidateQueries({ queryKey: ['court'] });
    },
  });
}

export function useAddCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ facilityId, name }) => {
      const { data } = await api.post(`/owner/facilities/${facilityId}/courts`, { name });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner', 'facilities'] }),
  });
}

export function useRenameCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courtId, name }) => {
      const { data } = await api.patch(`/owner/courts/${courtId}`, { name });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner', 'facilities'] }),
  });
}

export function useDeleteCourt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courtId) => {
      const { data } = await api.delete(`/owner/courts/${courtId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner', 'facilities'] }),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/owner/bookings/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['owner', 'stats'] });
    },
  });
}
