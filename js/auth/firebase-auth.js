// firebase-auth.js - Firebase Authentication for Admin Panel
// Assumes Firebase is already initialized globally

class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.isInitialized = false;
        
        // Initialize auth state listener
        this.initAuthStateListener();
    }

    // Initialize Firebase Auth state listener
    initAuthStateListener() {
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            this.isInitialized = true;
            
            // Notify all listeners
            this.authStateListeners.forEach(listener => {
                listener(user);
            });

            // Update UI based on auth state
            this.updateAuthUI(user);
        });
    }

    // Add auth state change listener
    onAuthStateChanged(callback) {
        this.authStateListeners.push(callback);
        
        // If already initialized, call immediately
        if (this.isInitialized) {
            callback(this.currentUser);
        }
    }

    // Update UI based on authentication state
    updateAuthUI(user) {
        const authContainer = document.getElementById('authContainer');
        const adminContent = document.getElementById('adminContent');
        
        if (!authContainer || !adminContent) return;

        if (user) {
            // Check if user has admin privileges
            if (this.isAdmin()) {
                // Admin user - show admin panel
                authContainer.style.display = 'none';
                adminContent.style.display = 'block';
                
                // Update user info if elements exist
                const userEmail = document.getElementById('userEmail');
                if (userEmail) {
                    userEmail.textContent = user.email;
                }
                
                const userName = document.getElementById('userName');
                if (userName) {
                    userName.textContent = user.displayName || user.email;
                }
            } else {
                // Non-admin user - show access denied
                authContainer.style.display = 'block';
                adminContent.style.display = 'none';
                this.showAccessDenied();
            }
        } else {
            // User is signed out
            authContainer.style.display = 'block';
            adminContent.style.display = 'none';
            
            // Show login form if not already shown
            if (!authContainer.querySelector('.auth-form-container')) {
                this.showLoginForm();
            }
        }
    }

    // Sign in with email and password
    async signInWithEmail(email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await firebase.auth().signInWithPopup(provider);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Sign out
    async signOut() {
        try {
            await firebase.auth().signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Check if user has admin privileges
    isAdmin() {
        // Check if user is authenticated and has admin email
        if (!this.currentUser) return false;
        
        // Allow specific admin emails
        const adminEmails = [
            'adminpriyorong@ecommerce.com',
            'admin@ecommerceapp.com'
        ];
        
        return adminEmails.includes(this.currentUser.email);
        
        // Future: Check custom claims when you set them up
        // return this.currentUser && this.currentUser.customClaims && this.currentUser.customClaims.admin === true;
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled.',
            'auth/popup-blocked': 'Sign-in popup was blocked by the browser.',
            'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
            'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
            'auth/weak-password': 'Password is too weak.',
            'auth/email-already-in-use': 'An account already exists with this email address.',
            'auth/invalid-credential': 'Invalid credentials.',
            'auth/operation-not-supported-in-this-environment': 'This operation is not supported in this environment.',
            'auth/timeout': 'Operation timed out.',
            'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
            'auth/unsupported-persistence-type': 'The persistence type is not supported.',
            'auth/user-token-expired': 'User token has expired.',
            'auth/web-storage-unsupported': 'Web storage is not supported.',
            'default': 'An error occurred during authentication. Please try again.'
        };
        
        return errorMessages[errorCode] || errorMessages['default'];
    }

    // Show authentication message
    showAuthMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.textContent = message;

        // Insert into auth container
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.insertBefore(messageDiv, authContainer.firstChild);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    // Require authentication - redirect to login if not authenticated
    requireAuth(callback) {
        if (this.isAuthenticated()) {
            callback();
        } else {
            // Redirect to login or show login form
            this.showLoginForm();
        }
    }

    // Show login form
    showLoginForm() {
        const authContainer = document.getElementById('authContainer');
        if (!authContainer) return;
    
        authContainer.innerHTML = `
            <center>
            <div class="auth-form-container">
                <img src="images/PriyoRong Logo Vertical for Products.png" alt="Shop Logo" style="width:200px;display:block;margin:0 auto 0.7rem auto;" />
                <h2 style="margin-top:0.2rem;">Admin Login</h2>
                <p class="auth-subtitle">Enter your admin credentials to access the panel</p>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" required placeholder="adminpriyorong@ecommerce.com" />
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" required placeholder="Enter password" />
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Sign In</button>
                    </div>
                </form>
            </div>
            <div class="auth-footer">
                <p>&copy; 2025 PriyoRong.com.bd | All rights reserved.</p>
                <p>Every Purchase is Special</p>
            </div>
                
            </center>
        `;
    
        // Add event listeners
        this.addLoginEventListeners();
    }

    // Add login form event listeners
    addLoginEventListeners() {
        const loginForm = document.getElementById('loginForm');
    
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
    
                const result = await this.signInWithEmail(email, password);
                if (result.success) {
                    this.showAuthMessage('Successfully signed in!', 'success');
                } else {
                    this.showAuthMessage(result.error, 'error');
                }
            });
        }
    }

    // Show access denied message
    showAccessDenied() {
        const authContainer = document.getElementById('authContainer');
        if (!authContainer) return;

        authContainer.innerHTML = `
            <div class="auth-form-container">
                <h2>Access Denied</h2>
                <p class="auth-subtitle">You don't have admin privileges to access this panel.</p>
                <div class="auth-message error">
                    Only authorized admin users can access the admin panel.
                </div>
                <div class="form-actions">
                    <button type="button" id="signOutBtn" class="btn-secondary">Sign Out</button>
                </div>
            </div>
        `;

        // Add sign out event listener
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                await this.signOut();
            });
        }
    }

    // Add login form event listeners
    addLoginEventListeners() {
        const loginForm = document.getElementById('loginForm');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                const result = await this.signInWithEmail(email, password);
                if (result.success) {
                    this.showAuthMessage('Successfully signed in!', 'success');
                } else {
                    this.showAuthMessage(result.error, 'error');
                }
            });
        }
    }
}

// Create global instance
window.adminAuth = new AdminAuth();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAuth;
}