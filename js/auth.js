/* =====================================================
   THE BLOCK - Auth System
   Login / Signup / Password Reset
   Part of BIG LOVE Holdings
   ===================================================== */

// ============ DOM ELEMENTS ============
const AuthDOM = {
    // Forms
    signinForm: document.getElementById('signin-form'),
    signupForm: document.getElementById('signup-form'),
    forgotForm: document.getElementById('forgot-form'),
    
    // Form Elements
    formSignin: document.getElementById('form-signin'),
    formSignup: document.getElementById('form-signup'),
    formForgot: document.getElementById('form-forgot'),
    
    // Switch Links
    showSignup: document.getElementById('show-signup'),
    showSignin: document.getElementById('show-signin'),
    forgotPasswordLink: document.getElementById('forgot-password-link'),
    backToSignin: document.getElementById('back-to-signin'),
    
    // Social Buttons
    googleSignin: document.getElementById('google-signin'),
    googleSignup: document.getElementById('google-signup')
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('✦ Auth system initializing...');
    checkExistingSession();
    bindAuthEvents();
});

// ============ CHECK EXISTING SESSION ============
function checkExistingSession() {
    const user = localStorage.getItem('theblock_user');
    if (user) {
        // User already logged in, redirect to app
        window.location.href = 'index.html';
    }
}

// ============ BIND EVENTS ============
function bindAuthEvents() {
    // Form Submissions
    if (AuthDOM.formSignin) {
        AuthDOM.formSignin.addEventListener('submit', handleSignin);
    }
    if (AuthDOM.formSignup) {
        AuthDOM.formSignup.addEventListener('submit', handleSignup);
    }
    if (AuthDOM.formForgot) {
        AuthDOM.formForgot.addEventListener('submit', handleForgotPassword);
    }
    
    // Switch Between Forms
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
    
    // Google Auth
    if (AuthDOM.googleSignin) {
        AuthDOM.googleSignin.addEventListener('click', handleGoogleAuth);
    }
    if (AuthDOM.googleSignup) {
        AuthDOM.googleSignup.addEventListener('click', handleGoogleAuth);
    }
}

// ============ SHOW/HIDE FORMS ============
function showForm(formName) {
    // Hide all forms
    AuthDOM.signinForm.classList.add('hidden');
    AuthDOM.signupForm.classList.add('hidden');
    AuthDOM.forgotForm.classList.add('hidden');
    
    // Show requested form
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
    
    // Get submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading
    submitBtn.classList.add('loading');
    
    try {
        // For now, we'll use localStorage (later integrate Firebase)
        const users = JSON.parse(localStorage.getItem('theblock_users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('No account found with this email');
        }
        
        if (user.password !== hashPassword(password)) {
            throw new Error('Incorrect password');
        }
        
        // Success! Save session
        const session = {
            id: user.id,
            name: user.name,
            email: user.email,
            tier: user.tier || 'free',
            createdAt: user.createdAt
        };
        
        localStorage.setItem('theblock_user', JSON.stringify(session));
        localStorage.setItem('theblock_tier', session.tier);
        
        console.log('✦ Signed in:', session.email);
        
        // Redirect to app
        window.location.href = 'index.html';
        
    } catch (error) {
        showError(error.message);
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
    
    // Validate
    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email');
        return;
    }
    
    // Show loading
    submitBtn.classList.add('loading');
    
    try {
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('theblock_users') || '[]');
        
        if (users.find(u => u.email === email)) {
            throw new Error('An account with this email already exists');
        }
        
        // Create new user
        const newUser = {
            id: generateUserId(),
            name: name,
            email: email,
            password: hashPassword(password),
            tier: 'free',
            createdAt: new Date().toISOString(),
            aiUsage: {
                lastReset: new Date().toISOString(),
                daysUsed: 0,
                onCooldown: false
            }
        };
        
        // Save user
        users.push(newUser);
        localStorage.setItem('theblock_users', JSON.stringify(users));
        
        // Create session
        const session = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            tier: newUser.tier,
            createdAt: newUser.createdAt
        };
        
        localStorage.setItem('theblock_user', JSON.stringify(session));
        localStorage.setItem('theblock_tier', session.tier);
        
        console.log('✦ Account created:', session.email);
        
        // Redirect to app
        window.location.href = 'index.html';
        
    } catch (error) {
        showError(error.message);
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
        // Simulate sending email (later integrate real email service)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success
        showSuccess('Reset link sent! Check your email.');
        
        console.log('✦ Password reset requested for:', email);
        
    } catch (error) {
        showError('Failed to send reset email. Try again.');
    } finally {
        submitBtn.classList.remove('loading');
    }
}

// ============ HANDLE GOOGLE AUTH ============
async function handleGoogleAuth() {
    // Placeholder for Google OAuth
    // Later integrate Firebase Auth
    
    alert('✦ Google Sign-In\n\nComing soon!\n\nFor now, please use email/password.');
    
    console.log('✦ Google auth requested - Firebase integration needed');
}

// ============ UTILITIES ============
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function hashPassword(password) {
    // Simple hash for localStorage demo
    // In production, use bcrypt on server side!
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
}

function showError(message) {
    // Remove any existing error
    const existingError = document.querySelector('.error-message-toast');
    if (existingError) existingError.remove();
    
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-message-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: var(--accent-rose-soft, rgba(244, 63, 94, 0.15));
        border: 1px solid var(--accent-rose, #f43f5e);
        border-radius: 10px;
        color: var(--accent-rose, #f43f5e);
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function showSuccess(message) {
    // Remove any existing message
    const existingMsg = document.querySelector('.success-message-toast');
    if (existingMsg) existingMsg.remove();
    
    // Create success toast
    const toast = document.createElement('div');
    toast.className = 'success-message-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: var(--accent-green-soft, rgba(16, 185, 129, 0.15));
        border: 1px solid var(--accent-green, #10b981);
        border-radius: 10px;
        color: var(--accent-green, #10b981);
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============ ADD FADEOUT ANIMATION ============
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// ============ EXPORT ============
window.TheBlockAuth = {
    showForm,
    handleSignin,
    handleSignup,
    handleGoogleAuth
};

console.log('✦ Auth system ready');