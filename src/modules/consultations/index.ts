/** Public API of the Consultations module. */
export { consultationsService } from './services/consultations.service';
export { sessionsRepo } from './api/sessions.repo';
export { prescriptionsRepo } from './api/prescriptions.repo';
export { providerOrdersRepo } from './api/providerOrders.repo';
export type {
  TreatmentSession,
  TreatmentSessionStatus,
  PrescriptionItemInput,
  EndSessionInput,
} from './schemas/consultation.schema';
export { PatientHistoryPanel } from './components/PatientHistoryPanel';
export { ConsultationNotesCard } from './components/ConsultationNotesCard';
export { PrescriptionBuilder } from './components/PrescriptionBuilder';
export { CatalogPicker } from './components/CatalogPicker';