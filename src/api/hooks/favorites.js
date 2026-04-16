import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['favorites'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await api.get('/favorites');
      return data;
    },
  });
}

export function useIsFavorite(facilityId) {
  const { data } = useFavorites();
  return !!data?.some((f) => f.facilityId === facilityId);
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (facilityId) => {
      const { data } = await api.post(`/favorites/${facilityId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (facilityId) => {
      const { data } = await api.delete(`/favorites/${facilityId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
