import { useQuery } from '@tanstack/react-query';
import { qk } from '@/shared/queryKeys';
import { unwrap } from '@/shared/result';
import { doctorsService } from '../services/doctors.service';

export function useDoctors() {
  return useQuery({
    queryKey: qk.doctors.list(),
    queryFn: async () => unwrap(await doctorsService.list()),
  });
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.doctors.detail(id) : qk.doctors.detail('none'),
    queryFn: async () => unwrap(await doctorsService.byId(id as string)),
    enabled: !!id,
  });
}

export function useFeaturedDoctors(limit?: number) {
  return useQuery({
    queryKey: [...qk.doctors.all, 'featured', limit ?? 6] as const,
    queryFn: async () => unwrap(await doctorsService.featured(limit)),
  });
}