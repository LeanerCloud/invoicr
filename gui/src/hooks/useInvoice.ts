import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi, healthApi } from '../services/api';

export function useInvoicePreview(persona: string, clientName: string, quantity: number, month?: string) {
  return useQuery({
    queryKey: ['personas', persona, 'invoice-preview', clientName, quantity, month],
    queryFn: () => invoiceApi.preview(persona, clientName, quantity, month),
    enabled: !!persona && !!clientName && quantity > 0,
  });
}

export function useGenerateInvoice(persona: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      clientName: string;
      quantity: number;
      month?: string;
      template?: string;
      generatePdf?: boolean;
      generateEInvoice?: boolean;
      eInvoiceFormat?: string;
    }) => invoiceApi.generate(persona, params),
    onSuccess: (_, { clientName }) => {
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients', clientName, 'history'] });
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients', clientName] });
      queryClient.invalidateQueries({ queryKey: ['personas', persona, 'clients'] });
    },
  });
}

export function useLibreOfficeStatus() {
  return useQuery({
    queryKey: ['libreoffice-status'],
    queryFn: healthApi.libreOffice,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 30000, // Check every 30 seconds
  });
}
