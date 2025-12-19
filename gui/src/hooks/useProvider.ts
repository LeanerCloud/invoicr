import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi, Provider } from '../services/api';

export function useProvider(persona: string) {
  return useQuery({
    queryKey: ['personas', persona, 'provider'],
    queryFn: () => providerApi.get(persona),
    enabled: !!persona,
  });
}

export function useSaveProvider(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: Provider) => providerApi.save(persona, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'provider'] });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
