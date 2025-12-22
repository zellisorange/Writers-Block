/* =====================================================
   THE BLOCK - Supabase Connection
   Database & Authentication
   Part of BIG LOVE Holdings
   ===================================================== */

// Supabase Configuration
const SUPABASE_URL = 'https://wwzhafvlqejccrskvwhb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3emhhZnZscWVqY2Nyc2t2d2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTk0MzgsImV4cCI6MjA4MTg3NTQzOH0.ajBE95GUoGNHmWiJ7WMFj0StVRrLd6Rp58I0sEh55pQ';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✦ Supabase connected');

// ============ AUTH FUNCTIONS ============

// Sign Up with Email
async function supabaseSignUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: name,
                tier: 'free'
            }
        }
    });
    
    if (error) throw error;
    return data;
}

// Sign In with Email
async function supabaseSignIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) throw error;
    return data;
}

// Sign Out
async function supabaseSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
}

// Get Current User
async function supabaseGetUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Password Reset
async function supabaseResetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth.html'
    });
    
    if (error) throw error;
    return data;
}

// Listen for Auth Changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('✦ Auth event:', event);
    if (event === 'SIGNED_IN') {
        console.log('✦ User signed in:', session.user.email);
    }
    if (event === 'SIGNED_OUT') {
        console.log('✦ User signed out');
    }
});

// ============ EXPORT ============
window.SupabaseAuth = {
    signUp: supabaseSignUp,
    signIn: supabaseSignIn,
    signOut: supabaseSignOut,
    getUser: supabaseGetUser,
    resetPassword: supabaseResetPassword,
    client: supabase
};