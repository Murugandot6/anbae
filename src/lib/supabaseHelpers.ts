// src/lib/supabaseHelpers.ts
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';

/**
 * Fetches a user profile by their ID.
 * @param profileId The ID of the profile to fetch.
 * @returns The profile data or null if not found/error.
 */
export const fetchProfileById = async (profileId: string): Promise<Profile | null> => {
  console.log(`SupabaseHelpers: Attempting to fetch profile by ID: ${profileId}`);
  const { data, error } = await supabase
    .from('profiles')
    .select('*') // Changed to select all columns
    .eq('id', profileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // PGRST116 means no rows found
      console.warn(`SupabaseHelpers: Profile not found for ID: ${profileId}`);
    } else {
      console.error('SupabaseHelpers: Supabase Error fetching profile by ID:', error.message, error);
    }
    return null;
  }
  console.log(`SupabaseHelpers: Profile fetched by ID ${profileId}:`, data);
  return data || null;
};

/**
 * Fetches a user profile by their email.
 * @param email The email of the profile to fetch.
 * @returns The profile data or null if not found/error.
 */
export const fetchProfileByEmail = async (email: string): Promise<Profile | null> => {
  console.log(`SupabaseHelpers: Attempting to fetch profile by email: ${email}`);
  const { data, error } = await supabase
    .from('profiles')
    .select('*') // Changed to select all columns
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // PGRST116 means no rows found
      console.warn(`SupabaseHelpers: Profile not found for email: ${email}`);
    } else {
      console.error('SupabaseHelpers: Supabase Error fetching profile by email:', error.message, error);
    }
    return null;
  }
  console.log(`SupabaseHelpers: Profile fetched by email ${email}:`, data);
  return data || null;
};