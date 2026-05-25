import { doctorsRepo } from '../api/doctors.repo';

export const doctorsService = {
  list: () => doctorsRepo.list(),
  byId: (id: string) => doctorsRepo.byId(id),
  featured: (limit?: number) => doctorsRepo.featured(limit),
};