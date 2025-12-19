import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, Client } from '../services/api';

export function useClients(persona: string) {
  return useQuery({
    queryKey: ['personas', persona, 'clients'],
    queryFn: () => clientsApi.list(persona),
    enabled: !!persona,
  });
}

export function useClient(persona: string, name: string) {
  return useQuery({
    queryKey: ['personas', persona, 'clients', name],
    queryFn: () => clientsApi.get(persona, name),
    enabled: !!persona && !!name,
  });
}

export function useClientHistory(persona: string, name: string) {
  return useQuery({
    queryKey: ['personas', persona, 'clients', name, 'history'],
    queryFn: () => clientsApi.getHistory(persona, name),
    enabled: !!persona && !!name,
  });
}

export function useCreateClient(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ directoryName, client }: { directoryName: string; client: Client }) =>
      clientsApi.create(persona, directoryName, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}

export function useUpdateClient(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, client }: { name: string; client: Client }) =>
      clientsApi.update(persona, name, client),
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients', name] });
    },
  });
}

export function useDeleteClient(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => clientsApi.delete(persona, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
