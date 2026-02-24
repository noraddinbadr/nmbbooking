// ============================================================
// Backend API Stubs — Medical Events / Camps
// These are pseudocode endpoint definitions.
// In production, implement as Supabase Edge Functions.
// ============================================================

/*
 * ============ ENDPOINTS ============
 *
 * POST /api/camps
 *   Auth: admin | doctor | clinic_admin
 *   Body: { title_ar, title_en, description_ar, clinic_id, location_name,
 *           location_city, start_date, end_date, total_capacity, services[], sponsors[] }
 *   Logic:
 *     1. Validate role: has_role(uid, 'admin') || has_role(uid, 'doctor')
 *     2. Insert into medical_camps with status='draft'
 *     3. Log event_logs(entity_type='camp', action='created')
 *   Response: 201 { camp }
 *
 * GET /api/camps
 *   Auth: public (published only) | admin (all)
 *   Query: ?date=&location=&service=&status=
 *   Logic: SELECT * FROM medical_camps WHERE status IN ('published','active')
 *          with filters. Admin sees all.
 *   Response: 200 { camps[], total }
 *
 * GET /api/camps/{campId}
 *   Auth: public
 *   Logic: SELECT camp + schedules + stats (total registrations, available slots)
 *   Response: 200 { camp, schedules[], stats }
 *
 * POST /api/camps/{id}/registrations
 *   Auth: authenticated
 *   Body: { schedule_id, patient_profile_id?, patient_info?, request_sponsorship? }
 *   Logic:
 *     1. Call hold_event_slot(camp_id, schedule_id, uid, patient_profile_id, patient_info)
 *     2. If success: return 201 { registration_id, hold_token, hold_expires_at }
 *     3. If no_slots: return 409 { code: 'no_slots', message: 'لا توجد أماكن متاحة' }
 *     4. If overlap: return 409 { code: 'overlap', message: 'لديك حجز مسبق في نفس الموعد' }
 *   Response: 201 | 409
 *
 * POST /api/registrations/{id}/confirm
 *   Auth: authenticated (booked_by)
 *   Body: { hold_token }
 *   Logic:
 *     1. Call confirm_hold(registration_id, hold_token)
 *     2. If success: return 200 { status: 'confirmed' }
 *     3. If expired/invalid: return 410 { code: 'hold_expired' }
 *   Response: 200 | 410
 *
 * POST /api/registrations/{id}/checkin
 *   Auth: staff | admin | doctor (clinic-scoped)
 *   Body: { checked_in_by? }
 *   Logic:
 *     1. Validate staff belongs to camp's clinic
 *     2. UPDATE registrations SET status='checked_in', checked_in_at=now()
 *     3. Log event
 *   Response: 200
 *
 * GET /api/camps/{id}/registrations
 *   Auth: admin | clinic_admin | staff (clinic-scoped)
 *   Query: ?status=&page=&limit=
 *   Logic: paginated SELECT with filters
 *   Response: 200 { registrations[], total, page }
 *
 * POST /api/cases
 *   Auth: doctor only
 *   Body: { registration_id, diagnosis_summary, treatment_plan, estimated_cost }
 *   Logic:
 *     1. Verify doctor role
 *     2. Create case with is_anonymous=true
 *     3. Log event
 *   Response: 201 { case }
 *
 * POST /api/cases/{id}/donate
 *   Auth: authenticated | anonymous
 *   Body: { amount, payment_method, donor_name? }
 *   Logic:
 *     1. Create donation with status='pledged'
 *     2. Return payment_placeholder with bank details or wallet address
 *     3. Actual confirmation via webhook
 *   Response: 201 { donation_id, payment_placeholder: { bank_name, account, reference } }
 *
 * POST /api/webhooks/payments
 *   Auth: service-to-service (verify signature)
 *   Body: { payment_reference, amount, status }
 *   Logic:
 *     1. Find donation by payment_reference
 *     2. Update status to 'received' or 'verified'
 *     3. Update case.funded_amount
 *     4. Update camp.raised_fund
 *     5. Log event
 *   Response: 200
 *
 * POST /api/providers/{id}/orders
 *   Auth: doctor | staff (clinic-scoped)
 *   Body: { camp_id, registration_id?, order_type, order_details }
 *   Logic:
 *     1. Create provider_order
 *     2. TODO: push to provider API endpoint or mark for manual pickup
 *   Response: 201 { order }
 */

// Export type for endpoint registry (for documentation)
export interface EndpointDef {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  auth: string;
  description: string;
}

export const eventEndpoints: EndpointDef[] = [
  { method: 'POST', path: '/api/camps', auth: 'admin|doctor', description: 'Create a medical camp' },
  { method: 'GET', path: '/api/camps', auth: 'public', description: 'List camps with filters' },
  { method: 'GET', path: '/api/camps/:id', auth: 'public', description: 'Camp detail with schedules' },
  { method: 'POST', path: '/api/camps/:id/registrations', auth: 'authenticated', description: 'Create held registration (atomic)' },
  { method: 'POST', path: '/api/registrations/:id/confirm', auth: 'authenticated', description: 'Confirm held registration' },
  { method: 'POST', path: '/api/registrations/:id/checkin', auth: 'staff|admin', description: 'Check in patient' },
  { method: 'GET', path: '/api/camps/:id/registrations', auth: 'admin|staff', description: 'List registrations (paginated)' },
  { method: 'POST', path: '/api/cases', auth: 'doctor', description: 'Create anonymized case' },
  { method: 'POST', path: '/api/cases/:id/donate', auth: 'public', description: 'Donate to case' },
  { method: 'POST', path: '/api/webhooks/payments', auth: 'service', description: 'Payment webhook placeholder' },
  { method: 'POST', path: '/api/providers/:id/orders', auth: 'doctor|staff', description: 'Push order to provider' },
];
