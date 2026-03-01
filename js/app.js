import { store } from './store.js';
import { Calendar } from './calendar.js';

document.addEventListener('DOMContentLoaded', () => {
    Calendar.init();

    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const userControls = document.getElementById('userControls');
    const authModal = document.getElementById('authModal');
    const authFormsContainer = document.getElementById('authForms');
    const createEventModal = document.getElementById('createEventModal');
    const createEventForm = document.getElementById('createEventForm');

    const mainContent = document.querySelector('main');
    const pageContainer = document.createElement('div');
    pageContainer.id = 'pageContainer';
    mainContent.parentNode.insertBefore(pageContainer, mainContent.nextSibling);

    prevBtn.addEventListener('click', () => store.changeMonth(-1));
    nextBtn.addEventListener('click', () => store.changeMonth(1));

    function showCalendar() {
        mainContent.style.display = 'block';
        pageContainer.style.display = 'none';
        pageContainer.innerHTML = '';
    }

    function handleLogout() {
        store.logout();
        authModal.classList.add('hidden');
        createEventModal.classList.add('hidden');
        showCalendar();
        renderUserControls();
    }

    function renderUserControls() {
        const user = store.state.currentUser;

        if (user) {
            userControls.innerHTML = `
                <span class="nav-link" onclick="showPage('about')">About</span>
                <span class="nav-link" onclick="showPage('faq')">FAQ</span>
                <span class="nav-link" onclick="showPage('account')" style="margin-right:15px;">My Account</span>
                <span style="margin-right:10px;">Hi, ${user.username} ${user.role === 'vip' ? '⭐' : ''}</span>
                <button id="logoutBtn" class="secondary-btn">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', handleLogout);
        } else {
            userControls.innerHTML = `
                <span class="nav-link" onclick="showPage('about')">About</span>
                <span class="nav-link" onclick="showPage('faq')">FAQ</span>
                <button id="loginBtn" class="secondary-btn">Sign In / Up</button>
            `;
            document.getElementById('loginBtn').addEventListener('click', () => openAuthModal());
        }
    }

    function openAuthModal(mode = 'login') {
        renderAuthForm(mode);
        authModal.classList.remove('hidden');
    }

    function renderAuthForm(mode) {
        const isLogin = mode === 'login';
        const isSignup = mode === 'signup';
        const isVerify = mode === 'verify';
        const isForgot = mode === 'forgot';
        const isReset = mode === 'reset';

        let html = `<h2>`;
        if (isLogin) html += 'Welcome Back';
        if (isSignup) html += 'Join the Vibe';
        if (isVerify) html += 'Verify Email';
        if (isForgot) html += 'Forgot Password';
        if (isReset) html += 'Reset Password';
        html += `</h2><form id="authForm">`;

        if (isLogin || isSignup || isVerify) {
            html += `<input type="text" id="authUsername" placeholder="Username" required ${isVerify ? 'readonly' : ''}>`;
        }
        if (isSignup || isForgot || isReset) {
            html += `<input type="email" id="authEmail" placeholder="Email Address" required ${isReset ? 'readonly' : ''}>`;
        }
        if (isVerify) {
            html += `<input type="text" id="authOTP" placeholder="Verification Token" required>`;
        }
        if (isForgot) {
            // Only email needed
        }
        if (isReset) {
            html += `<input type="text" id="authOTP" placeholder="OTP from Email" required>`;
        }
        if (isLogin || isSignup || isReset) {
            html += `<input type="password" id="authPassword" placeholder="${isReset ? 'New Password' : 'Password'}" required>`;
        }

        let btnText = 'Submit';
        if (isLogin) btnText = 'Sign In';
        if (isSignup) btnText = 'Sign Up';
        if (isVerify) btnText = 'Verify';
        if (isForgot) btnText = 'Send OTP';
        if (isReset) btnText = 'Update Password';

        html += `<button type="submit" class="cta-btn" style="width:100%">${btnText}</button>
                <div id="authError" class="error-msg"></div>
                <div id="authSuccess" class="success-msg" style="color:var(--color-accent); margin-top:10px; font-size:0.9rem;"></div>
            </form>`;

        if (isLogin) {
            html += `<p class="toggle-auth">New here? <span class="link-btn" onclick="window.renderAuthForm('signup')">Create account</span></p>`;
            html += `<p class="toggle-auth"><span class="link-btn" onclick="window.renderAuthForm('forgot')">Forgot password?</span></p>`;
        } else if (isSignup) {
            html += `<p class="toggle-auth">Already have an account? <span class="link-btn" onclick="window.renderAuthForm('login')">Sign In</span></p>`;
        } else {
            html += `<p class="toggle-auth"><span class="link-btn" onclick="window.renderAuthForm('login')">Back to Login</span></p>`;
        }

        authFormsContainer.innerHTML = html;

        const form = document.getElementById('authForm');
        form.addEventListener('submit', (e) => handleAuthSubmit(e, mode));
    }

    // Expose for internal onclicks
    window.renderAuthForm = renderAuthForm;

    async function handleAuthSubmit(e, mode) {
        e.preventDefault();
        const errorDiv = document.getElementById('authError');
        const successDiv = document.getElementById('authSuccess');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        errorDiv.textContent = '';
        successDiv.textContent = '';
        submitBtn.disabled = true;

        let result;
        const username = document.getElementById('authUsername')?.value?.trim();
        const password = document.getElementById('authPassword')?.value;
        const email = document.getElementById('authEmail')?.value?.trim();
        const otp = document.getElementById('authOTP')?.value?.trim();

        if (mode === 'login') {
            result = await store.login(username, password);
        } else if (mode === 'signup') {
            result = await store.signup(username, email, password);
            if (result.success) {
                renderAuthForm('verify');
                document.getElementById('authUsername').value = username;
                document.getElementById('authSuccess').textContent = result.message;
                return;
            }
        } else if (mode === 'verify') {
            result = await store.verifyEmail(username, otp);
            if (result.success) {
                renderAuthForm('login');
                document.getElementById('authUsername').value = username;
                document.getElementById('authSuccess').textContent = result.message;
                return;
            }
        } else if (mode === 'forgot') {
            result = await store.forgotPassword(email);
            if (result.success) {
                renderAuthForm('reset');
                document.getElementById('authEmail').value = email;
                document.getElementById('authSuccess').textContent = result.message;
                return;
            }
        } else if (mode === 'reset') {
            result = await store.resetPassword(email, otp, password);
            if (result.success) {
                renderAuthForm('login');
                document.getElementById('authSuccess').textContent = result.message;
                return;
            }
        }

        submitBtn.disabled = false;

        if (result.success) {
            authModal.classList.add('hidden');
            authFormsContainer.innerHTML = '';
            showCalendar();
            renderUserControls();
        } else {
            errorDiv.textContent = result.message;
            if (result.needsVerification) {
                const verifyLink = document.createElement('p');
                verifyLink.className = 'toggle-auth';
                verifyLink.innerHTML = `<span class="link-btn" style="color:var(--color-accent)">Verify your email now</span>`;
                verifyLink.onclick = () => {
                    renderAuthForm('verify');
                    document.getElementById('authUsername').value = username;
                };
                errorDiv.appendChild(verifyLink);
            }
        }
    }

    window.showPage = (pageId) => {
        mainContent.style.display = 'none';
        pageContainer.style.display = 'block';
        pageContainer.innerHTML = renderPageContent(pageId);
    };

    window.showCalendar = () => {
        showCalendar();
    };

    function renderPageContent(pageId) {
        let content = `<button onclick="window.showCalendar()" class="secondary-btn" style="margin-bottom:20px;">&larr; Back to Calendar</button>`;

        if (pageId === 'about') {
            content += `
                <div class="glass" style="padding:40px; border-radius:20px;">
                    <h1>About Happening Vibe</h1>
                    <p style="margin-top:20px; line-height:1.6;">We are the coolest calendar app in town! Designed for the young and young at heart, we make planning events fun and vibrant.</p>
                </div>`;
        } else if (pageId === 'faq') {
            content += `
                <div class="glass" style="padding:40px; border-radius:20px;">
                    <h1>FAQ</h1>
                    <ul style="margin-top:20px; list-style:none;">
                        <li style="margin-bottom:15px;"><strong>Q: How many events can I post?</strong><br>A: You can post up to 2 events per day! VIPs get more.</li>
                        <li style="margin-bottom:15px;"><strong>Q: Can I delete my event?</strong><br>A: Yes, just click on your event and hit delete.</li>
                    </ul>
                </div>`;
        } else if (pageId === 'account') {
            const user = store.state.currentUser;
            content += `
                <div class="glass" style="padding:40px; border-radius:20px;">
                    <h1>My Account</h1>
                    <p style="margin-top:20px;"><strong>Username:</strong> ${user?.username || 'N/A'}</p>
                    <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                    <p><strong>Role:</strong> ${user?.role || 'N/A'}</p>
                </div>`;
        }

        return content;
    }

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    // window.onclick removed to prevent closing on backdrop click as per user request

    createEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const startDate = document.getElementById('eventStartDate').value;
        const endDate = document.getElementById('eventEndDate').value;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;

        if (new Date(startDate) > new Date(endDate)) {
            document.getElementById('eventError').textContent = 'End date cannot be before start date';
            return;
        }

        const result = await store.addEvent({
            title, description, startDate, endDate, startTime, endTime
        });

        if (result.success) {
            createEventModal.classList.add('hidden');
            createEventForm.reset();
        } else {
            document.getElementById('eventError').textContent = result.message;
        }
    });

    window.makeMeVip = () => {
        console.warn('makeMeVip demo shortcut is not implemented on this build.');
    };

    renderUserControls();
    store.subscribe(() => {
        renderUserControls();
        if (!store.state.currentUser && pageContainer.style.display === 'block') {
            showCalendar();
        }
    });
});
