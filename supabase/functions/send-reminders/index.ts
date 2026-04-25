import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in Yemen timezone (UTC+3)
    const now = new Date();
    const yemenOffset = 3 * 60; // Yemen is UTC+3
    const yemenTime = new Date(now.getTime() + yemenOffset * 60 * 1000);
    
    const todayDate = yemenTime.toISOString().split('T')[0];
    
    // Calculate time window: 25-35 minutes from now (to catch appointments in ~30 min window)
    const minTime = new Date(yemenTime.getTime() + 25 * 60 * 1000);
    const maxTime = new Date(yemenTime.getTime() + 35 * 60 * 1000);
    
    const minTimeStr = minTime.toTimeString().slice(0, 5); // HH:MM
    const maxTimeStr = maxTime.toTimeString().slice(0, 5); // HH:MM

    console.log(`Checking reminders for ${todayDate} between ${minTimeStr} and ${maxTimeStr}`);

    // Find confirmed bookings happening in ~30 minutes
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        patient_id,
        doctor_id,
        booking_date,
        start_time,
        family_member_id
      `)
      .eq('booking_date', todayDate)
      .eq('status', 'confirmed')
      .gte('start_time', minTimeStr)
      .lte('start_time', maxTimeStr);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return new Response(JSON.stringify({ error: bookingsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bookings || bookings.length === 0) {
      console.log('No upcoming bookings found');
      return new Response(JSON.stringify({ message: 'No reminders to send', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${bookings.length} bookings to remind`);

    // Get doctor names
    const doctorIds = [...new Set(bookings.map(b => b.doctor_id))];
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, name_ar')
      .in('id', doctorIds);

    const doctorMap: Record<string, string> = {};
    doctors?.forEach(d => { doctorMap[d.id] = d.name_ar; });

    // Check which notifications already exist to avoid duplicates
    const bookingIds = bookings.map(b => b.id);
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('entity_id')
      .eq('type', 'booking_reminder')
      .in('entity_id', bookingIds);

    const existingSet = new Set(existingNotifs?.map(n => n.entity_id) || []);

    // Create reminder notifications
    const notifications = bookings
      .filter(b => !existingSet.has(b.id))
      .map(booking => ({
        user_id: booking.patient_id,
        type: 'booking_reminder',
        title_ar: '⏰ تذكير بموعدك',
        body_ar: `موعدك مع د. ${doctorMap[booking.doctor_id] || 'الطبيب'} بعد 30 دقيقة — الساعة ${booking.start_time}`,
        entity_type: 'booking',
        entity_id: booking.id,
      }));

    if (notifications.length === 0) {
      console.log('All reminders already sent');
      return new Response(JSON.stringify({ message: 'Reminders already sent', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Sent ${notifications.length} reminder notifications`);

    return new Response(
      JSON.stringify({ message: 'Reminders sent', count: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
