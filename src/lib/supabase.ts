import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export interface User {
  id: string;
  username: string;
  name: string;
  expiration_date: string;
  max_devices: number;
  created_at: string;
  updated_at: string;
}

// Create a new user with 24-hour trial
export async function createTrialUser(username: string, password: string, name: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { user: null, error: 'Email already exists. Please use a different one or login.' };
    }

    // Calculate expiration date (24 hours from now)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    // Create the user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password, // Note: In production, you should hash this password
        name,
        expiration_date: expirationDate.toISOString(),
        max_devices: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return { user: null, error: 'Failed to create account. Please try again.' };
    }

    return { user: data, error: null };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { user: null, error: 'An unexpected error occurred. Please try again.' };
  }
}

// Login user
export async function loginUser(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return { user: null, error: 'Invalid username or password.' };
    }

    // Allow login even if trial is expired - user needs to be logged in to purchase a subscription
    return { user: data, error: null };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { user: null, error: 'An unexpected error occurred. Please try again.' };
  }
}

// Check if username is available
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  
  return !data;
}
