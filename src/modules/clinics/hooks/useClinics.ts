import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/shared/result';
import { clinicsService } from '../services/clinics.service';

export function useClinics() {
  return useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: async () => unwrap(await clinicsService.list()),
  });
}

export function useClinic(id: string | undefined) {
  return useQuery({
    queryKey: ['clinics', 'detail', id ?? 'none'],
    queryFn: async () => unwrap(await clinicsService.byId(id as string)),
    enabled: !!id,
  });
}