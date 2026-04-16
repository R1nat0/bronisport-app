import { useMutation } from '@tanstack/react-query';
import { api } from '../client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function useUpdateMe() {
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: async (patch) => {
      const { data } = await api.patch('/users/me', patch);
      return data.user;
    },
    onSuccess: (user) => updateUser(user),
  });
}
