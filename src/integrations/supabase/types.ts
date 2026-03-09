export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_type: Database["public"]["Enums"]["booking_type"] | null
          created_at: string
          doctor_id: string
          end_time: string | null
          family_member_id: string | null
          final_price: number | null
          funding_amount: number | null
          id: string
          is_free_case: boolean | null
          notes: string | null
          patient_id: string
          queue_position: number | null
          shift_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_type?: Database["public"]["Enums"]["booking_type"] | null
          created_at?: string
          doctor_id: string
          end_time?: string | null
          family_member_id?: string | null
          final_price?: number | null
          funding_amount?: number | null
          id?: string
          is_free_case?: boolean | null
          notes?: string | null
          patient_id: string
          queue_position?: number | null
          shift_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_type?: Database["public"]["Enums"]["booking_type"] | null
          created_at?: string
          doctor_id?: string
          end_time?: string | null
          family_member_id?: string | null
          final_price?: number | null
          funding_amount?: number | null
          id?: string
          is_free_case?: boolean | null
          notes?: string | null
          patient_id?: string
          queue_position?: number | null
          shift_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "doctor_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          name_ar: string
          name_en: string | null
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name_ar: string
          name_en?: string | null
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_shifts: {
        Row: {
          consultation_duration_min: number | null
          created_at: string
          days_of_week: number[] | null
          doctor_id: string
          enable_slot_generation: boolean | null
          end_time: string
          free_cases_count: number | null
          free_cases_frequency: string | null
          id: string
          label: string
          late_tolerance_min: number | null
          max_capacity: number | null
          start_time: string
        }
        Insert: {
          consultation_duration_min?: number | null
          created_at?: string
          days_of_week?: number[] | null
          doctor_id: string
          enable_slot_generation?: boolean | null
          end_time?: string
          free_cases_count?: number | null
          free_cases_frequency?: string | null
          id?: string
          label?: string
          late_tolerance_min?: number | null
          max_capacity?: number | null
          start_time?: string
        }
        Update: {
          consultation_duration_min?: number | null
          created_at?: string
          days_of_week?: number[] | null
          doctor_id?: string
          enable_slot_generation?: boolean | null
          end_time?: string
          free_cases_count?: number | null
          free_cases_frequency?: string | null
          id?: string
          label?: string
          late_tolerance_min?: number | null
          max_capacity?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_shifts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          about_ar: string | null
          about_en: string | null
          available_today: boolean | null
          base_price: number | null
          booking_types: Database["public"]["Enums"]["booking_type"][] | null
          city: string | null
          city_ar: string | null
          clinic_id: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          education: string[] | null
          free_cases_per_shift: number | null
          gender: string | null
          id: string
          is_sponsored: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          name_ar: string
          name_en: string | null
          profile_image: string | null
          rating: number | null
          specialty: string | null
          specialty_ar: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          wait_time: string | null
          years_experience: number | null
        }
        Insert: {
          about_ar?: string | null
          about_en?: string | null
          available_today?: boolean | null
          base_price?: number | null
          booking_types?: Database["public"]["Enums"]["booking_type"][] | null
          city?: string | null
          city_ar?: string | null
          clinic_id: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          education?: string[] | null
          free_cases_per_shift?: number | null
          gender?: string | null
          id?: string
          is_sponsored?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          name_ar: string
          name_en?: string | null
          profile_image?: string | null
          rating?: number | null
          specialty?: string | null
          specialty_ar?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          wait_time?: string | null
          years_experience?: number | null
        }
        Update: {
          about_ar?: string | null
          about_en?: string | null
          available_today?: boolean | null
          base_price?: number | null
          booking_types?: Database["public"]["Enums"]["booking_type"][] | null
          city?: string | null
          city_ar?: string | null
          clinic_id?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          education?: string[] | null
          free_cases_per_shift?: number | null
          gender?: string | null
          id?: string
          is_sponsored?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          name_ar?: string
          name_en?: string | null
          profile_image?: string | null
          rating?: number | null
          specialty?: string | null
          specialty_ar?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          wait_time?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          camp_id: string | null
          case_id: string | null
          created_at: string
          donor_id: string | null
          donor_name: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          status: Database["public"]["Enums"]["donation_status"] | null
        }
        Insert: {
          amount: number
          camp_id?: string | null
          case_id?: string | null
          created_at?: string
          donor_id?: string | null
          donor_name?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
        }
        Update: {
          amount?: number
          camp_id?: string | null
          case_id?: string | null
          created_at?: string
          donor_id?: string | null
          donor_name?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["donation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "medical_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "medical_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          available_slots: number | null
          camp_id: string
          created_at: string
          end_time: string
          id: string
          location_note: string | null
          schedule_date: string
          service_type: string | null
          start_time: string
          total_slots: number | null
        }
        Insert: {
          available_slots?: number | null
          camp_id: string
          created_at?: string
          end_time: string
          id?: string
          location_note?: string | null
          schedule_date: string
          service_type?: string | null
          start_time: string
          total_slots?: number | null
        }
        Update: {
          available_slots?: number | null
          camp_id?: string
          created_at?: string
          end_time?: string
          id?: string
          location_note?: string | null
          schedule_date?: string
          service_type?: string | null
          start_time?: string
          total_slots?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "medical_camps"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          full_name: string | null
          full_name_ar: string
          gender: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          relationship: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          full_name_ar: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          relationship?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          full_name?: string | null
          full_name_ar?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          relationship?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medical_camps: {
        Row: {
          clinic_id: string | null
          cover_image: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          end_date: string | null
          id: string
          is_free: boolean | null
          location_city: string | null
          location_name: string | null
          organizer_id: string
          raised_fund: number | null
          services: string[] | null
          sponsors: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["camp_status"] | null
          target_fund: number | null
          title_ar: string
          title_en: string | null
          total_capacity: number | null
        }
        Insert: {
          clinic_id?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          end_date?: string | null
          id?: string
          is_free?: boolean | null
          location_city?: string | null
          location_name?: string | null
          organizer_id: string
          raised_fund?: number | null
          services?: string[] | null
          sponsors?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["camp_status"] | null
          target_fund?: number | null
          title_ar: string
          title_en?: string | null
          total_capacity?: number | null
        }
        Update: {
          clinic_id?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          end_date?: string | null
          id?: string
          is_free?: boolean | null
          location_city?: string | null
          location_name?: string | null
          organizer_id?: string
          raised_fund?: number | null
          services?: string[] | null
          sponsors?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["camp_status"] | null
          target_fund?: number | null
          title_ar?: string
          title_en?: string | null
          total_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_camps_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_cases: {
        Row: {
          case_code: string
          created_at: string
          created_by: string
          diagnosis_summary: string | null
          estimated_cost: number | null
          funded_amount: number | null
          id: string
          is_anonymous: boolean | null
          patient_age: number | null
          patient_gender: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          treatment_plan: string | null
        }
        Insert: {
          case_code: string
          created_at?: string
          created_by: string
          diagnosis_summary?: string | null
          estimated_cost?: number | null
          funded_amount?: number | null
          id?: string
          is_anonymous?: boolean | null
          patient_age?: number | null
          patient_gender?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          treatment_plan?: string | null
        }
        Update: {
          case_code?: string
          created_at?: string
          created_by?: string
          diagnosis_summary?: string | null
          estimated_cost?: number | null
          funded_amount?: number | null
          id?: string
          is_anonymous?: boolean | null
          patient_age?: number | null
          patient_gender?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          treatment_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_cases_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_files: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          description: string | null
          doctor_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          patient_id: string
          session_id: string | null
          uploaded_by: string
        }
        Insert: {
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          patient_id: string
          session_id?: string | null
          uploaded_by: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          doctor_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          patient_id?: string
          session_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_files_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "treatment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body_ar: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          title_ar: string
          type: string
          user_id: string
        }
        Insert: {
          body_ar?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title_ar: string
          type?: string
          user_id: string
        }
        Update: {
          body_ar?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title_ar?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          dosage: string | null
          duration: string | null
          frequency: string | null
          id: string
          instructions: string | null
          medicine_name: string
          prescription_id: string
        }
        Insert: {
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medicine_name: string
          prescription_id: string
        }
        Update: {
          dosage?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          medicine_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          pharmacy_sent: boolean | null
          session_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          pharmacy_sent?: boolean | null
          session_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          pharmacy_sent?: boolean | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "treatment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          full_name_ar: string | null
          gender: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          full_name_ar?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          full_name_ar?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_orders: {
        Row: {
          camp_id: string | null
          created_at: string
          id: string
          notes: string | null
          order_details: Json | null
          order_type: string | null
          provider_id: string
          registration_id: string | null
          results_url: string | null
          status: Database["public"]["Enums"]["order_status"] | null
        }
        Insert: {
          camp_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_details?: Json | null
          order_type?: string | null
          provider_id: string
          registration_id?: string | null
          results_url?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
        }
        Update: {
          camp_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_details?: Json | null
          order_type?: string | null
          provider_id?: string
          registration_id?: string | null
          results_url?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_orders_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "medical_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_orders_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string | null
          provider_type: string | null
          user_id: string | null
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en?: string | null
          provider_type?: string | null
          user_id?: string | null
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string | null
          provider_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          booked_by: string
          camp_id: string
          case_code: string
          checked_in_at: string | null
          created_at: string
          hold_expires_at: string | null
          hold_token: string | null
          id: string
          notes: string | null
          patient_info: Json | null
          schedule_id: string
          status: Database["public"]["Enums"]["registration_status"] | null
        }
        Insert: {
          booked_by: string
          camp_id: string
          case_code?: string
          checked_in_at?: string | null
          created_at?: string
          hold_expires_at?: string | null
          hold_token?: string | null
          id?: string
          notes?: string | null
          patient_info?: Json | null
          schedule_id: string
          status?: Database["public"]["Enums"]["registration_status"] | null
        }
        Update: {
          booked_by?: string
          camp_id?: string
          case_code?: string
          checked_in_at?: string | null
          created_at?: string
          hold_expires_at?: string | null
          hold_token?: string | null
          id?: string
          notes?: string | null
          patient_info?: Json | null
          schedule_id?: string
          status?: Database["public"]["Enums"]["registration_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "medical_camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "event_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          default_price: number | null
          description_ar: string | null
          duration_min: number | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          default_price?: number | null
          description_ar?: string | null
          duration_min?: number | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          default_price?: number | null
          description_ar?: string | null
          duration_min?: number | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_types: {
        Row: {
          created_at: string
          description_ar: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string | null
          tier_level: number | null
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en?: string | null
          tier_level?: number | null
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string | null
          tier_level?: number | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name_ar: string
          name_en: string | null
          sponsor_type_id: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name_ar: string
          name_en?: string | null
          sponsor_type_id?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name_ar?: string
          name_en?: string | null
          sponsor_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_sponsor_type_id_fkey"
            columns: ["sponsor_type_id"]
            isOneToOne: false
            referencedRelation: "sponsor_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name_ar: string
          permissions: Json
          staff_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar: string
          permissions?: Json
          staff_role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar?: string
          permissions?: Json
          staff_role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sessions: {
        Row: {
          booking_id: string | null
          created_at: string
          diagnosis: string | null
          doctor_id: string
          examination: string | null
          follow_up_date: string | null
          id: string
          notes: string | null
          patient_id: string
          session_date: string
          status: string
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          examination?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          session_date?: string
          status?: string
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          examination?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          session_date?: string
          status?: string
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_hold: {
        Args: { _hold_token: string; _registration_id: string }
        Returns: Json
      }
      get_staff_permission: {
        Args: { _clinic_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hold_event_slot: {
        Args: {
          _booked_by: string
          _camp_id: string
          _patient_info?: Json
          _schedule_id: string
        }
        Returns: Json
      }
      is_clinic_member: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      reclaim_expired_holds: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "doctor"
        | "clinic_admin"
        | "staff"
        | "patient"
        | "donor"
        | "provider"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      booking_type: "clinic" | "hospital" | "home" | "video" | "voice" | "lab"
      camp_status: "draft" | "published" | "active" | "completed" | "cancelled"
      case_status:
        | "open"
        | "funded"
        | "partially_funded"
        | "in_treatment"
        | "closed"
      discount_type: "none" | "percentage" | "fixed"
      donation_status: "pledged" | "received" | "verified" | "refunded"
      order_status:
        | "pending"
        | "received"
        | "sample_taken"
        | "results_uploaded"
        | "delivered"
      registration_status:
        | "held"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "expired"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "doctor",
        "clinic_admin",
        "staff",
        "patient",
        "donor",
        "provider",
      ],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      booking_type: ["clinic", "hospital", "home", "video", "voice", "lab"],
      camp_status: ["draft", "published", "active", "completed", "cancelled"],
      case_status: [
        "open",
        "funded",
        "partially_funded",
        "in_treatment",
        "closed",
      ],
      discount_type: ["none", "percentage", "fixed"],
      donation_status: ["pledged", "received", "verified", "refunded"],
      order_status: [
        "pending",
        "received",
        "sample_taken",
        "results_uploaded",
        "delivered",
      ],
      registration_status: [
        "held",
        "confirmed",
        "checked_in",
        "completed",
        "expired",
        "cancelled",
      ],
    },
  },
} as const
