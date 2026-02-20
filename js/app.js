import { store } from './store.js';
import { Calendar } from './calendar.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Calendar
    Calendar.init();

    // -- Global UI Elements --
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const userControls = document.getElementById('userControls');
    const authModal = document.getElementById('authModal');
    const authFormsContainer = document.getElementById('authForms');
    const createEventModal = document.getElementById('createEventModal');
    const createEventForm = document.getElementById('createEventForm');

    // -- Navigation --
    prevBtn.addEventListener('click', () => store.changeMonth(-1));
    nextBtn.addEventListener('click', () => store.changeMonth(1));

    // -- User Controls (Header) --
    function renderUserControls() {
        const user = store.state.currentUser;
        if (user) {
            userControls.innerHTML = `
                <span style="margin-right:10px;">Hi, ${user.username} ${user.role === 'vip' ? '⭐' : ''}</span>
                <button id="logoutBtn" class="secondary-btn">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => store.logout());
        } else {
            userControls.innerHTML = `
                <button id="loginBtn" class="secondary-btn">Sign In / Up</button>
            `;
            document.getElementById('loginBtn').addEventListener('click', () => openAuthModal());
        }
    }

    // Initial Render
    renderUserControls();
    store.subscribe(renderUserControls);

    // -- Auth Modal Logic --
    function openAuthModal(mode = 'login') {
        renderAuthForm(mode);
        authModal.classList.remove('hidden');
    }

    function renderAuthForm(mode) {
        const isLogin = mode === 'login';
        authFormsContainer.innerHTML = `
            <h2>${isLogin ? 'Welcome Back' : 'Join the Vibe'}</h2>
            <form id="authForm">
                <input type="text" id="authUsername" placeholder="Username" required>
                ${!isLogin ? '<input type="email" id="authEmail" placeholder="Email Address" required>' : ''}
                <input type="password" id="authPassword" placeholder="Password" required>
                <button type="submit" class="cta-btn" style="width:100%">${isLogin ? 'Sign In' : 'Sign Up'}</button>
                <div id="authError" class="error-msg"></div>
            </form>
            <p class="toggle-auth">${isLogin ? 'New here? Create account' : 'Already have an account? Sign In'}</p>
        `;

        // Listeners for the dynamic form
        const form = document.getElementById('authForm');
        form.addEventListener('submit', (e) => handleAuthSubmit(e, isLogin));

        document.querySelector('.toggle-auth').addEventListener('click', () => {
            renderAuthForm(isLogin ? 'signup' : 'login');
        });
    }

    function handleAuthSubmit(e, isLogin) {
        e.preventDefault();
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;
        const email = !isLogin ? document.getElementById('authEmail').value : null;
        const errorDiv = document.getElementById('authError');

        errorDiv.textContent = '';

        const result = isLogin
            ? store.login(username, password)
            : store.signup(username, email, password);

        if (result.success) {
            authModal.classList.add('hidden');
        } else {
            errorDiv.textContent = result.message;
        }
    }

    // -- Navigation & New Pages --
    // We'll effectively hide the main calendar and show these pages
    const mainContent = document.querySelector('main');
    const pageContainer = document.createElement('div');
    pageContainer.id = 'pageContainer';
    // Insert after main
    mainContent.parentNode.insertBefore(pageContainer, mainContent.nextSibling);

    window.showPage = (pageId) => {
        // Simple routing: Hide main, show page content
        mainContent.style.display = 'none';
        pageContainer.style.display = 'block';
        pageContainer.innerHTML = renderPageContent(pageId);
    };

    window.showCalendar = () => {
        mainContent.style.display = 'block';
        pageContainer.style.display = 'none';
        pageContainer.innerHTML = '';
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
                    <p style="margin-top:20px;"><strong>Username:</strong> ${user?.username}</p>
                    <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
                    <p><strong>Role:</strong> ${user?.role}</p>
                </div>`;
        }
        return content;
    }

    // -- User Controls (Header) --
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
            document.getElementById('logoutBtn').addEventListener('click', () => store.logout());
        } else {
            userControls.innerHTML = `
                <span class="nav-link" onclick="showPage('about')">About</span>
                <span class="nav-link" onclick="showPage('faq')">FAQ</span>
                <button id="loginBtn" class="secondary-btn">Sign In / Up</button>
            `;
            document.getElementById('loginBtn').addEventListener('click', () => openAuthModal());
        }
    }

    // -- Modal Closing --
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    };

    // -- Event Creation --
    createEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const startDate = document.getElementById('eventStartDate').value;
        const endDate = document.getElementById('eventEndDate').value;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;

        // Basic Validation
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

    // -- Admin Tools (Hidden shortcut for demo) --
    // Type 'vip' in console to make current user VIP
    window.makeMeVip = () => {
        if (store.state.currentUser) {
            store.setVipStatus(store.state.currentUser.username, true);
            console.log("You are now a VIP!");
        }
    };
});
