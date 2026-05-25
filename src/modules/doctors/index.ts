/** Public API of the Doctors module. */
export type { Doctor, DoctorShift } from './schemas/doctor.schema';
export { doctorsService } from './services/doctors.service';
export { useDoctors, useDoctor, useFeaturedDoctors } from './hooks/useDoctors';