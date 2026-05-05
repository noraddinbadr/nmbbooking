-- Cleanup: remove duplicate triggers (kept canonical names)
DROP TRIGGER IF EXISTS trg_log_auction_state_change ON public.auction_requests;
DROP TRIGGER IF EXISTS trg_bookings_updated ON public.bookings;
DROP TRIGGER IF EXISTS trg_clinics_updated ON public.clinics;
DROP TRIGGER IF EXISTS trg_doctors_updated ON public.doctors;
DROP TRIGGER IF EXISTS trg_sync_case_funded ON public.donations;
DROP TRIGGER IF EXISTS trg_bid_total ON public.procurement_bid_lines;
DROP TRIGGER IF EXISTS trg_pb_updated_at ON public.procurement_bids;
DROP TRIGGER IF EXISTS trg_pr_updated_at ON public.procurement_requests;
DROP TRIGGER IF EXISTS trg_procurement_status ON public.procurement_requests;
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS trg_notify_order_results ON public.provider_orders;
DROP TRIGGER IF EXISTS trg_staff_updated ON public.staff_members;

-- Ensure handle_new_user trigger exists on auth.users (standard Supabase pattern)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();