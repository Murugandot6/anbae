import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';

/**
 * Fetches a single user profile by their email address.
 * @param email The email of the profile to fetch.
 * @returns The profile data or null if not found/error.
 */
export const fetchProfileByEmail = async (email: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, partner_email, partner_nickname')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Supabase Error fetching profile by email:', error.message, error);
      return null;
    }
    return data as Profile | null;
  } catch (error: any) {
    console.error('Unexpected error fetching profile by email:', error.message, error);
    return null;
  }
};

/**
 * Fetches a single user profile by their ID.
 * @param id The ID of the profile to fetch.
 * @returns The profile data or null if not found/error.
 */
export const fetchProfileById = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, partner_email, partner_nickname')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Supabase Error fetching profile by ID:', error.message, error);
      return null;
    }
    return data as Profile | null;
  } catch (error: any) {
    console.error('Unexpected error fetching profile by ID:', error.message, error);
    return null;
  }
};

/**
 * Fetches multiple user profiles by a list of IDs.
 * @param ids An array of profile IDs to fetch.
 * @returns A Map where keys are profile IDs and values are Profile objects.
 */
export const fetchProfilesByIds = async (ids: string[]): Promise<Map<string, Profile>> => {
  const profilesMap = new Map<string, Profile>();
  if (ids.length === 0) {
    return profilesMap;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, partner_email, partner_nickname')
      .in('id', ids);

    if (error) {
      console.error('Supabase Error fetching profiles by IDs:', error.message, error);
      return profilesMap;
    }

    data?.forEach(profile => {
      profilesMap.set(profile.id, profile as Profile);
    });
    return profilesMap;
  } catch (error: any) {
    console.error('Unexpected error fetching profiles by IDs:', error.message, error);
    return profilesMap;
  }
};