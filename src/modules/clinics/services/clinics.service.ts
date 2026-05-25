import { clinicsRepo } from '../api/clinics.repo';

export const clinicsService = {
  list: () => clinicsRepo.list(),
  byId: (id: string) => clinicsRepo.byId(id),
};