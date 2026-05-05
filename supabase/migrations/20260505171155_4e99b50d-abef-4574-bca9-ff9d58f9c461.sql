-- Attach missing triggers (audit P0 finding: 13 trigger functions defined but not attached)

-- Procurement: stamp published_at / awarded_at automatically
DROP TRIGGER IF EXISTS trg_procurement_status_change ON public.procurement_requests;
CREATE TRIGGER trg_procurement_status_change
BEFORE UPDATE ON public.procurement_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_procurement_status_change();

-- Procurement: keep total_amount in sync with bid lines
DROP TRIGGER IF EXISTS trg_recalc_bid_total ON public.procurement_bid_lines;
CREATE TRIGGER trg_recalc_bid_total
AFTER INSERT OR UPDATE OR DELETE ON public.procurement_bid_lines
FOR EACH ROW EXECUTE FUNCTION public.recalc_bid_total();

-- Auction state log
DROP TRIGGER IF EXISTS trg_log_auction_state_change ON public.auction_requests;
CREATE TRIGGER trg_log_auction_state_change
AFTER UPDATE ON public.auction_requests
FOR EACH ROW EXECUTE FUNCTION public.log_auction_state_change();

-- Sync funded_amount on medical_cases when donations change
DROP TRIGGER IF EXISTS trg_sync_case_funded_amount ON public.donations;
CREATE TRIGGER trg_sync_case_funded_amount
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.sync_case_funded_amount();

-- Booking audit log
DROP TRIGGER IF EXISTS trg_log_booking_status_change ON public.bookings;
CREATE TRIGGER trg_log_booking_status_change
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_status_change();

-- Booking transition validation
DROP TRIGGER IF EXISTS trg_validate_booking_transition ON public.bookings;
CREATE TRIGGER trg_validate_booking_transition
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_transition();

DROP TRIGGER IF EXISTS trg_validate_booking_delete ON public.bookings;
CREATE TRIGGER trg_validate_booking_delete
BEFORE DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_delete();

-- Booking notifications
DROP TRIGGER IF EXISTS trg_notify_doctor_on_booking ON public.bookings;
CREATE TRIGGER trg_notify_doctor_on_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_doctor_on_booking();

DROP TRIGGER IF EXISTS trg_notify_on_booking_update ON public.bookings;
CREATE TRIGGER trg_notify_on_booking_update
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_update();

-- Provider order results notification
DROP TRIGGER IF EXISTS trg_notify_on_order_results ON public.provider_orders;
CREATE TRIGGER trg_notify_on_order_results
AFTER UPDATE ON public.provider_orders
FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_results();

-- Doctor shift overlap check
DROP TRIGGER IF EXISTS trg_check_shift_overlap ON public.doctor_shifts;
CREATE TRIGGER trg_check_shift_overlap
BEFORE INSERT OR UPDATE ON public.doctor_shifts
FOR EACH ROW EXECUTE FUNCTION public.check_shift_overlap();

-- updated_at maintenance on key tables
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_doctors_updated_at ON public.doctors;
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_clinics_updated_at ON public.clinics;
CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON public.clinics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_procurement_requests_updated_at ON public.procurement_requests;
CREATE TRIGGER trg_procurement_requests_updated_at BEFORE UPDATE ON public.procurement_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_procurement_bids_updated_at ON public.procurement_bids;
CREATE TRIGGER trg_procurement_bids_updated_at BEFORE UPDATE ON public.procurement_bids
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_auction_requests_updated_at ON public.auction_requests;
CREATE TRIGGER trg_auction_requests_updated_at BEFORE UPDATE ON public.auction_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile + patient role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();