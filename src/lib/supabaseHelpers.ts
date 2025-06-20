// src/lib/supabaseHelpers.ts
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';

/**
 * Fetches a user profile by their ID.
 * @param profileId The ID of the profile to fetch.
 * @returns The profile data or null if not found/error.
 */
export const fetchProfileById = async (profileId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email')
    .eq('id', profileId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Supabase Error fetching profile by ID:', error.message, error);
    return null;
  }
  return data || null;
};

/**
 * Fetches a user profile by their email.
 * @param email The email of the profile to fetch.
 * @returns The profile data or null if not found/error.
 */
export const fetchProfileByEmail = async (email: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Supabase Error fetching profile by email:', error.message, error);
    return null;
  }
  return data || null;
};