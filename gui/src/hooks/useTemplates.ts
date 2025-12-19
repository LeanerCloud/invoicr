import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '../services/api';

export function useTemplates(persona: string) {
  return useQuery({
    queryKey: ['personas', persona, 'templates'],
    queryFn: () => templatesApi.list(persona),
    enabled: !!persona,
  });
}

export function useDownloadTemplate(persona: string) {
  return useMutation({
    mutationFn: async (name: string) => {
      const blob = await templatesApi.download(persona, name);
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    },
  });
}

export function useUploadTemplate(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, file }: { name: string; file: File }) => {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      return templatesApi.upload(persona, name, base64);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'templates'] });
    },
  });
}

export function useDeleteTemplate(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => templatesApi.delete(persona, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'templates'] });
    },
  });
}

export function useCopyTemplate(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, newName }: { name: string; newName?: string }) =>
      templatesApi.copy(persona, name, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'templates'] });
    },
  });
}

export function useOpenTemplate(persona: string) {
  return useMutation({
    mutationFn: (name: string) => templatesApi.open(persona, name),
  });
}
