/* =====================================================
   THE BLOCK - Auth System (Supabase)
   Real Authentication with Cloud Database
   Part of BIG LOVE Holdings
   ===================================================== */

// ============ DOM ELEMENTS ============
const AuthDOM = {
    signinForm: document.getElementById('signin-form'),
    signupForm: document.getElementById('signup-form'),
    forgotForm: document.getElementById('forgot-form'),
    formSignin: document.getElementById('form-signin'),
    formSignup: document.getElementById('form-signup'),
    formForgot: document.getElementById('form-forgot'),
    showSignup: document.getElementById('show-signup'),
    showSignin: document.getElementById('show-signin'),
    forgotPasswordLink: document.getElementById('forgot-password-link'),
    backToSignin: document.getElementById('back-to-signin'),
    googleSignin: document.getElementById('google-signin'),
    googleSignup: document.getElementById('google-signup')
};

// ============ INITIALIZATION ============
// Wait for Supabase to be ready
window.addEventListener('supabase-ready', () => {
    console.log('✦ Auth system initializing...');
    checkExistingSession();
    bindAuthEvents();
});

// Fallback if already loaded
if (window.SupabaseAuth) {
    console.log('✦ Auth system initializing...');
    checkExistingSession();
    bindAuthEvents();
}

// ============ CHECK EXISTING SESSION ============
async function checkExistingSession() {
    try {
        const user = await SupabaseAuth.getUser();
        if (user) {
            console.log('✦ User already logged in:', user.email);
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.log('✦ No existing session');
    }
}

// ============ BIND EVENTS ============
function bindAuthEvents() {
    if (AuthDOM.formSignin) {
        AuthDOM.formSignin.addEventListener('submit', handleSignin);
    }
    if (AuthDOM.formSignup) {
        AuthDOM.formSignup.addEventListener('submit', handleSignup);
    }
    if (AuthDOM.formForgot) {
        AuthDOM.formForgot.addEventListener('submit', handleForgotPassword);
    }
    if (AuthDOM.showSignup) {
        AuthDOM.showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('signup');
        });
    }
    if (AuthDOM.showSignin) {
        AuthDOM.showSignin.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('signin');
        });
    }
    if (AuthDOM.forgotPasswordLink) {
        AuthDOM.forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('forgot');
        });
    }
    if (AuthDOM.backToSignin) {
        AuthDOM.backToSignin.addEventListener('click', (e) => {
            e.preventDefault();
            showForm('signin');
        });
    }
    if (AuthDOM.googleSignin) {
        AuthDOM.googleSignin.addEventListener('click', handleGoogleAuth);
    }
    if (AuthDOM.googleSignup) {
        AuthDOM.googleSignup.addEventListener('click', handleGoogleAuth);
    }
}

// ============ SHOW/HIDE FORMS ============
function showForm(formName) {
    AuthDOM.signinForm.classList.add('hidden');
    AuthDOM.signupForm.classList.add('hidden');
    AuthDOM.forgotForm.classList.add('hidden');
    
    switch(formName) {
        case 'signin':
            AuthDOM.signinForm.classList.remove('hidden');
            break;
        case 'signup':
            AuthDOM.signupForm.classList.remove('hidden');
            break;
        case 'forgot':
            AuthDOM.forgotForm.classList.remove('hidden');
            break;
    }
}

// ============ HANDLE SIGN IN ============
async function handleSignin(e) {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    submitBtn.classList.add('loading');
    
    try {
        const data = await SupabaseAuth.signIn(email, password);
        console.log('✦ Signed in:', data.user.email);
        showSuccess('Welcome back!');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Sign in error:', error);
        showError(error.message || 'Failed to sign in');
        submitBtn.classList.remove('loading');
    }
}

// ============ HANDLE SIGN UP ============
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }
    
    submitBtn.classList.add('loading');
    
    try {
        const data = await SupabaseAuth.signUp(email, password, name);
        console.log('✦ Account created:', data);
        
        // Check if email confirmation is required
        if (data.user && !data.session) {
            showSuccess('Check your email to confirm your account!');
            submitBtn.classList.remove('loading');
        } else {
            showSuccess('Account created!');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
        
    } catch (error) {
        console.error('Sign up error:', error);
        showError(error.message || 'Failed to create account');
        submitBtn.classList.remove('loading');
    }
}

// ============ HANDLE FORGOT PASSWORD ============
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email) {
        showError('Please enter your email');
        return;
    }
    
    submitBtn.classList.add('loading');
    
    try {
        await SupabaseAuth.resetPassword(email);
        showSuccess('Password reset link sent! Check your email.');
        submitBtn.classList.remove('loading');
        
    } catch (error) {
        console.error('Reset error:', error);
        showError(error.message || 'Failed to send reset email');
        submitBtn.classList.remove('loading');
    }
}

// ============ HANDLE GOOGLE AUTH ============
async function handleGoogleAuth() {
    try {
        const { data, error } = await SupabaseAuth.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Google auth error:', error);
        showError('Google sign-in not configured yet');
    }
}

// ============ TOAST NOTIFICATIONS ============
function showError(message) {
    const existingError = document.querySelector('.error-message-toast');
    if (existingError) existingError.remove();
    
    const toast = document.createElement('div');
    toast.className = 'error-message-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: rgba(244, 63, 94, 0.15);
        border: 1px solid #f43f5e;
        border-radius: 10px;
        color: #f43f5e;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showSuccess(message) {
    const existingMsg = document.querySelector('.success-message-toast');
    if (existingMsg) existingMsg.remove();
    
    const toast = document.createElement('div');
    toast.className = 'success-message-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid #10b981;
        border-radius: 10px;
        color: #10b981;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

console.log('✦ Auth system ready (Supabase)');