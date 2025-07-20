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
    .select('id, username, email, partner_email, partner_nickname, created_at, avatar_url') // Explicitly select columns including avatar_url
    .eq('id', profileId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 means no rows found
      // console.error('Supabase Error fetching profile by ID:', error.message); // Removed debug log
    }
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
    .select('id, username, email, partner_email, partner_nickname, created_at, avatar_url') // Explicitly select columns including avatar_url
    .ilike('email', email) // Changed from .eq to .ilike for case-insensitive comparison
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 means no rows found
      // console.error('Supabase Error fetching profile by email:', error.message); // Removed debug log
    }
    return null;
  }
  return data || null;
};