import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../services/api';

export function useLibreOffice() {
  return useQuery({
    queryKey: ['libreoffice'],
    queryFn: () => healthApi.libreOffice(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}
