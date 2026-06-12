// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBysceZBQ0WA51fMuuQGnggKEUOzLlpiLw",
    authDomain: "triplens-94d41.firebaseapp.com",
    projectId: "triplens-94d41",
    storageBucket: "triplens-94d41.firebasestorage.app",
    messagingSenderId: "1078412424349",
    appId: "1:1078412424349:web:1dc4aa4b8bc24a4965d074",
    measurementId: "G-1JE8YC7HVH"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Turso Database Config
const TURSO_URL = "https://accept-assist-augusten6383.aws-ap-south-1.turso.io/v2/pipeline";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAyNTc1ODEsImlkIjoiMDE5ZTdmOWUtYjEwMS03MjMwLThjYWQtNTRmZjllNmI3ZWU4IiwicmlkIjoiYTEzZDg3YmYtOTdkOS00NjMwLWJkMGYtMjNjN2FkMWJhZmNjIn0.i4RsyjzDOZenpkfXj7HcCK8DCuE3usirajqfaAV3uxuKYfNK2GtzO6n9QBuq0SDwof9azXIQH68c535mM7_YDw";

// Utility to execute Turso SQL
async function executeTursoSQL(sql, args) {
    const payload = {
        requests: [
            {
                type: "execute",
                stmt: {
                    sql: sql,
                    args: args.map(arg => ({ type: typeof arg === 'number' ? 'integer' : 'text', value: String(arg) }))
                }
            },
            { type: "close" }
        ]
    };

    try {
        const response = await fetch(TURSO_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TURSO_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Parse pipeline response format
        if (data.results && data.results.length > 0) {
            const firstRes = data.results[0];
            if (firstRes.type === "ok" && firstRes.response && firstRes.response.result) {
                return firstRes.response.result.rows || [];
            }
        }
        return [];
    } catch (err) {
        console.error("Turso DB Error:", err);
        throw err;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authBtn = document.getElementById('authBtn');
    const logoLink = document.getElementById('logoLink');
    const navFeatures = document.getElementById('navFeatures');
    const navPricing = document.getElementById('navPricing');
    const navAbout = document.getElementById('navAbout');
    const navContact = document.getElementById('navContact');
    const navPolicies = document.getElementById('navPolicies');
    
    // Footers
    const footHome = document.querySelector('.foot-home');
    const footFeatures = document.querySelector('.foot-features');
    const footPricing = document.querySelector('.foot-pricing');
    const footAbout = document.querySelector('.foot-about');
    const footContact = document.querySelector('.foot-contact');
    const footPrivacy = document.querySelector('.foot-privacy');
    const footTerms = document.querySelector('.foot-terms');
    const footRefunds = document.querySelector('.foot-refunds');

    // Views
    const landingView = document.getElementById('landingView');
    const portalView = document.getElementById('portalView');
    const policiesView = document.getElementById('policiesView');

    // Modals
    const authModal = document.getElementById('authModal');
    const closeAuth = document.getElementById('closeAuth');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const paymentModal = document.getElementById('paymentModal');
    const closePayment = document.getElementById('closePayment');
    const simPayBtn = document.getElementById('simPayBtn');
    const activateSubBtn = document.getElementById('activateSubBtn');
    const subStatusBadge = document.getElementById('subStatusBadge');
    const logoutBtn = document.getElementById('logoutBtn');

    // User State
    let user = JSON.parse(localStorage.getItem('triplens_user')) || null;
    let selectedPlan = { name: "Month Pass", price: 299 };

    // Initialize View & Auth state
    updateUIForUser();

    // View Switching Logic
    function showView(viewId, targetSectionId = null) {
        landingView.classList.add('hidden');
        portalView.style.display = 'none';
        policiesView.classList.add('hidden');

        if (viewId === 'landing') {
            landingView.classList.remove('hidden');
            if (targetSectionId) {
                const el = document.getElementById(targetSectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (viewId === 'portal') {
            if (!user) {
                openModal(authModal);
                landingView.classList.remove('hidden');
            } else {
                portalView.style.display = 'block';
            }
        } else if (viewId === 'policies') {
            policiesView.classList.remove('hidden');
            if (targetSectionId) {
                const el = document.getElementById(targetSectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // Modal Helpers
    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    // User UI update
    function updateUIForUser() {
        if (user) {
            authBtn.textContent = 'Portal Dashboard';
            document.getElementById('portalUserName').textContent = `Welcome Back, ${user.displayName || 'Captain'}!`;
            document.getElementById('portalUserEmail').textContent = user.email;
            document.getElementById('avatarText').textContent = (user.displayName || 'C').charAt(0).toUpperCase();

            // Check subscription status
            if (user.subscriptionActive) {
                subStatusBadge.innerHTML = `<span style="width: 8px; height: 8px; background: var(--color-success); border-radius: 50%;"></span> Active Premium (${user.planName || 'Paid'})`;
                subStatusBadge.style.color = 'var(--color-success)';
                activateSubBtn.textContent = 'Subscription Active - No Action Required';
                activateSubBtn.className = 'btn btn-success';
                activateSubBtn.disabled = true;
            } else {
                subStatusBadge.innerHTML = `<span style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;"></span> Inactive / Unpaid`;
                subStatusBadge.style.color = '#f59e0b';
                activateSubBtn.textContent = 'Pay & Activate Subscription';
                activateSubBtn.className = 'btn btn-primary';
                activateSubBtn.disabled = false;
            }
        } else {
            authBtn.textContent = 'Captain Login';
        }
    }

    // Secure database update logic
    async function updateSubscriptionInDatabase() {
        if (!user) return;
        
        try {
            // Determine days to add based on selected plan
            let daysToAdd = 30;
            if (selectedPlan.name === "Day Pass") daysToAdd = 1;
            else if (selectedPlan.name === "Week Pass") daysToAdd = 7;
            else if (selectedPlan.name === "Month Pass") daysToAdd = 30;

            const nowSeconds = Math.floor(Date.now() / 1000);
            
            // Check current expiration to append to it, or start fresh from now
            const checkRows = await executeTursoSQL("SELECT subscription_expires_at FROM users WHERE email = ? OR username = ?;", [user.email, user.email]);
            let currentExpiresAt = nowSeconds;
            
            if (checkRows.length > 0) {
                const dbExpiresVal = checkRows[0][0]?.value;
                if (dbExpiresVal) {
                    const parsed = parseInt(dbExpiresVal, 10);
                    if (parsed > nowSeconds) {
                        currentExpiresAt = parsed;
                    }
                }
            }

            const addedSeconds = daysToAdd * 24 * 60 * 60;
            const newExpiresAt = currentExpiresAt + addedSeconds;

            // Execute actual Turso DB update
            await executeTursoSQL("UPDATE users SET subscription_expires_at = ? WHERE email = ? OR username = ?;", [newExpiresAt, user.email, user.email]);

            user.subscriptionActive = true;
            user.planName = selectedPlan.name;
            localStorage.setItem('triplens_user', JSON.stringify(user));
            updateUIForUser();
            
            alert(`Payment Successful! ${selectedPlan.name} activated securely in Triplens Database.\nYour Android app will sync this status immediately.`);
            closeModal(paymentModal);
            showView('portal');
            
        } catch (error) {
            alert("Payment recorded, but failed to sync to database. Please contact support. Error: " + error.message);
            simPayBtn.textContent = `Pay ₹ ${selectedPlan.price} Securely`;
            simPayBtn.disabled = false;
        }
    }

    // Nav Event Listeners
    logoLink.addEventListener('click', (e) => { e.preventDefault(); showView('landing'); });
    navFeatures.addEventListener('click', (e) => { e.preventDefault(); showView('landing', 'features'); });
    navPricing.addEventListener('click', (e) => { e.preventDefault(); showView('landing', 'pricing'); });
    navAbout.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'aboutSec'); });
    navContact.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'contactSec'); });
    navPolicies.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'privacySec'); });

    // Footer Event Listeners
    if (footHome) footHome.addEventListener('click', (e) => { e.preventDefault(); showView('landing'); });
    if (footFeatures) footFeatures.addEventListener('click', (e) => { e.preventDefault(); showView('landing', 'features'); });
    if (footPricing) footPricing.addEventListener('click', (e) => { e.preventDefault(); showView('landing', 'pricing'); });
    if (footAbout) footAbout.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'aboutSec'); });
    if (footContact) footContact.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'contactSec'); });
    if (footPrivacy) footPrivacy.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'privacySec'); });
    if (footTerms) footTerms.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'termsSec'); });
    if (footRefunds) footRefunds.addEventListener('click', (e) => { e.preventDefault(); showView('policies', 'refundSec'); });

    // Auth Actions
    authBtn.addEventListener('click', () => {
        if (user) {
            showView('portal');
        } else {
            openModal(authModal);
        }
    });

    closeAuth.addEventListener('click', () => closeModal(authModal));
    
    // Logout Action
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (user) {
                firebase.auth().signOut().catch(e => console.log(e));
                user = null;
                localStorage.removeItem('triplens_user');
                updateUIForUser();
                showView('landing');
            }
        });
    }
    
    // Actual Google Login via Firebase
    googleLoginBtn.addEventListener('click', async () => {
        try {
            googleLoginBtn.innerHTML = `<span>Loading...</span>`;
            googleLoginBtn.disabled = true;
            
            const result = await auth.signInWithPopup(provider);
            const fbUser = result.user;
            const userEmail = fbUser.email.toLowerCase();

            // Verify user exists in Turso DB (Android app uses username field often)
            const rows = await executeTursoSQL("SELECT status, free_clicks_remaining, subscription_expires_at FROM users WHERE email = ? OR username = ?;", [userEmail, userEmail]);
            
            if (rows.length === 0) {
                // User doesn't exist in DB
                alert("Account not found in Triplens Database.\nPlease install and register within the Android application first to generate your Captain ID.");
                auth.signOut();
                resetGoogleLoginBtn();
                return;
            }

            // Parse DB values
            const subExpiresAtRaw = rows[0][2]?.value;
            const subExpiresAt = subExpiresAtRaw ? parseInt(subExpiresAtRaw, 10) : 0;
            const nowSeconds = Math.floor(Date.now() / 1000);
            
            const isSubActive = subExpiresAt > nowSeconds;

            user = {
                displayName: fbUser.displayName,
                email: userEmail,
                subscriptionActive: isSubActive,
                planName: isSubActive ? "Premium" : null
            };
            
            localStorage.setItem('triplens_user', JSON.stringify(user));
            updateUIForUser();
            closeModal(authModal);
            showView('portal');
            resetGoogleLoginBtn();

        } catch (error) {
            console.error("Firebase Login Error:", error);
            alert("Google Sign-In failed: " + error.message + "\n\nIf you see a domain error, please add '127.0.0.1' and 'localhost' to your Firebase Console -> Authentication -> Settings -> Authorized domains.");
            resetGoogleLoginBtn();
        }
    });

    function resetGoogleLoginBtn() {
        googleLoginBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>`;
        googleLoginBtn.disabled = false;
    }

    // Setup Plan click handlers
    function initCheckout(planName, price) {
        selectedPlan = { name: planName, price: parseInt(price) };
        document.getElementById('checkoutPlanName').textContent = `Triplens ${selectedPlan.name}`;
        document.getElementById('checkoutPlanPrice').textContent = `₹ ${selectedPlan.price}`;
        simPayBtn.textContent = `Pay ₹ ${selectedPlan.price} Securely`;

        if (!user) {
            alert("Please login with your Google Account before initiating subscription payment.");
            openModal(authModal);
        } else {
            openModal(paymentModal);
        }
    }

    // Payment Actions
    document.querySelectorAll('.buy-btn-plan').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const plan = btn.getAttribute('data-plan');
            const price = btn.getAttribute('data-price');
            initCheckout(plan, price);
        });
    });

    activateSubBtn.addEventListener('click', () => {
        if (user && !user.subscriptionActive) {
            initCheckout("Month Pass", "299");
        }
    });

    closePayment.addEventListener('click', () => closeModal(paymentModal));

    simPayBtn.addEventListener('click', () => {
        const upiVal = document.getElementById('upiIdInput').value;
        if (!upiVal.includes('@')) {
            alert("Please enter a valid UPI ID (e.g., name@okaxis) to process.");
            return;
        }
        
        simPayBtn.textContent = "Processing Payment...";
        simPayBtn.disabled = true;

        // Execute payment simulator and database update
        setTimeout(() => {
            updateSubscriptionInDatabase();
        }, 1500);
    });
});
