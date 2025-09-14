// Authentication Management

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('authToken');
        // Don't initialize immediately, wait for global variables
        setTimeout(() => this.init(), 100);
    }

    async init() {
        if (this.token) {
            try {
                await this.getCurrentUser();
                this.updateUI();
            } catch (error) {
                console.error('Failed to get current user:', error);
                this.logout();
            }
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = $('#loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = $('#registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Handle Google OAuth callback
        if (window.location.pathname === '/auth/success') {
            this.handleGoogleCallback();
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const loginForm = $('#loginForm');
        const email = $('#loginEmail').value.trim();
        const password = $('#loginPassword').value;

        // Validate inputs
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (!isValidEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const loadingId = loading.show(submitBtn, 'Logging in...');

        try {
            const response = await api.login({ email, password });
            
            // Store token and user data
            this.setToken(response.token);
            this.currentUser = response.user;
            
            // Update UI
            this.updateUI();
            
            // Close modal and show success message
            modal.close('loginModal');
            toast.success('Welcome back!');
            
            // Redirect if needed
            const redirectUrl = getQueryParam('redirect');
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
            
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.message || 'Failed to login. Please try again.');
        } finally {
            loading.hide(loadingId);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        console.log('Registration form submitted');
        
        const registerForm = $('#registerForm');
        const username = $('#registerUsername').value.trim();
        const email = $('#registerEmail').value.trim();
        const password = $('#registerPassword').value;

        console.log('Form data:', { username, email, passwordLength: password.length });

        // Validate inputs
        if (!username || !email || !password) {
            console.log('Validation failed: Missing fields');
            toast.error('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            console.log('Validation failed: Username too short');
            toast.error('Username must be at least 3 characters long');
            return;
        }

        if (!isValidEmail(email)) {
            console.log('Validation failed: Invalid email');
            toast.error('Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            console.log('Validation failed: Password too short');
            toast.error('Password must be at least 6 characters long');
            return;
        }

        console.log('Validation passed, attempting registration...');

        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const loadingId = loading.show(submitBtn, 'Creating account...');

        try {
            console.log('Calling API register...');
            const response = await api.register({ username, email, password });
            console.log('Registration response:', response);
            
            // Store token and user data
            this.setToken(response.token);
            this.currentUser = response.user;
            
            // Update UI
            this.updateUI();
            
            // Close modal and show success message
            modal.close('registerModal');
            toast.success('Account created successfully! Welcome to Ly!');
            
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Failed to create account. Please try again.');
        } finally {
            loading.hide(loadingId);
        }
    }

    async handleGoogleCallback() {
        const token = getQueryParam('token');
        const error = getQueryParam('error');

        if (error) {
            toast.error('Google authentication failed. Please try again.');
            window.location.href = '/';
            return;
        }

        if (token) {
            this.setToken(token);
            
            try {
                await this.getCurrentUser();
                this.updateUI();
                toast.success('Successfully logged in with Google!');
                window.location.href = '/';
            } catch (error) {
                console.error('Google auth error:', error);
                toast.error('Failed to complete Google authentication');
                this.logout();
            }
        }
    }

    async getCurrentUser() {
        if (!this.token) {
            throw new Error('No authentication token');
        }

        try {
            const response = await api.getCurrentUser();
            this.currentUser = response.user;
            return this.currentUser;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        api.setToken(token);
        
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    async logout() {
        try {
            if (this.token) {
                await api.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.setToken(null);
            this.currentUser = null;
            this.updateUI();
            toast.info('You have been logged out');
            
            // Redirect to home if on protected page
            if (this.isProtectedPage()) {
                window.location.href = '/';
            }
        }
    }

    updateUI() {
        const authButtons = $('#authButtons');
        const userMenu = $('#userMenu');
        
        if (this.isLoggedIn()) {
            // Hide auth buttons, show user menu
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                this.updateUserMenu();
            }
        } else {
            // Show auth buttons, hide user menu
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }

        // Update page-specific elements
        this.updateProtectedElements();
    }

    updateUserMenu() {
        const userAvatar = $('#userAvatar');
        const userName = $('.user-name');
        
        if (this.currentUser) {
            if (userAvatar) {
                userAvatar.src = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.username)}&background=6366f1&color=fff`;
                userAvatar.alt = this.currentUser.username;
            }
            
            if (userName) {
                userName.textContent = this.currentUser.username;
            }
        }
    }

    updateProtectedElements() {
        // Show/hide elements based on auth state
        $$('[data-auth-required]').forEach(element => {
            element.style.display = this.isLoggedIn() ? '' : 'none';
        });

        $$('[data-auth-hidden]').forEach(element => {
            element.style.display = this.isLoggedIn() ? 'none' : '';
        });

        // Update profile links
        $$('[data-user-id]').forEach(element => {
            if (this.currentUser) {
                element.href = element.href.replace(/\/users\/[^\/]+/, `/users/${this.currentUser._id}`);
            }
        });
    }

    isLoggedIn() {
        return !!(this.token && this.currentUser);
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            toast.warning('Please login to continue');
            modal.open('loginModal');
            return false;
        }
        return true;
    }

    isProtectedPage() {
        const protectedPaths = ['/dashboard', '/profile', '/compose'];
        return protectedPaths.some(path => window.location.pathname.startsWith(path));
    }

    // Profile management
    async updateProfile(userData) {
        if (!this.requireAuth()) return;

        try {
            const response = await api.updateProfile(userData);
            this.currentUser = response.user;
            this.updateUI();
            toast.success('Profile updated successfully');
            return response.user;
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.message || 'Failed to update profile');
            throw error;
        }
    }
}

// Global auth functions
function showLoginModal() {
    modal.open('loginModal');
}

function showRegisterModal() {
    modal.open('registerModal');
}

function switchToLogin() {
    modal.close('registerModal');
    modal.open('loginModal');
}

function switchToRegister() {
    modal.close('loginModal');
    modal.open('registerModal');
}

function closeModal(modalId) {
    modal.close(modalId);
}

function toggleUserDropdown() {
    const dropdown = $('#userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function loginWithGoogle() {
    // Redirect to Google OAuth endpoint
    const googleAuthUrl = `${API_BASE_URL}/auth/google`;
    window.location.href = googleAuthUrl;
}

async function logout() {
    await auth.logout();
}

// Close user dropdown when clicking outside
document.addEventListener('click', (event) => {
    const userMenu = $('#userMenu');
    const dropdown = $('#userDropdown');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Create global auth instance
const auth = new AuthManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AuthManager,
        auth,
        showLoginModal,
        showRegisterModal,
        switchToLogin,
        switchToRegister,
        closeModal,
        toggleUserDropdown,
        loginWithGoogle,
        logout
    };
}
