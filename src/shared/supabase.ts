/**
 * Shared kernel — typed Supabase client.
 *
 * Modules MUST import the client from here, not from `@/integrations/supabase/client`,
 * so we can later swap transports / add interceptors without touching every module.
 */
export { supabase } from '@/integrations/supabase/client';
export type { Database } from '@/integrations/supabase/types';