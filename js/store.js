import { Utils } from './utils.js';

const API_URL = '/api';

class Store {
    constructor() {
        this.state = {
            currentUser: JSON.parse(localStorage.getItem('hv_user')) || null,
            events: [],
            currentDate: new Date()
        };

        this.listeners = [];
        this.init();
    }

    async init() {
        if (this.state.currentUser) {
            await this.fetchEvents();
            this.notify(); // ensure UI sync on page load
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // ---------------- AUTH ----------------

    async login(username, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || 'Server error' };
            }

            if (data.success) {
                this.state.currentUser = data.user;
                localStorage.setItem('hv_user', JSON.stringify(data.user));

                await this.fetchEvents();
                this.notify();

                return { success: true };
            }

            return { success: false, message: data.message };
        } catch (err) {
            console.error(err);
            return { success: false, message: 'Network error' };
        }
    }

    async signup(username, email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), email: email.trim(), password })
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, message: data.message || 'Server error' };
            }

            return { success: true, message: data.message };
        } catch (err) {
            console.error(err);
            return { success: false, message: 'Network error' };
        }
    }

    async verifyEmail(username, token) {
        try {
            const res = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, token })
            });
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    async forgotPassword(email) {
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    async resetPassword(email, otp, newPassword) {
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            return await res.json();
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    logout() {
        this.state.currentUser = null;
        this.state.events = [];
        localStorage.removeItem('hv_user');
        this.notify();
    }

    // ---------------- EVENTS ----------------

    async fetchEvents() {
        try {
            const res = await fetch(`${API_URL}/events`);

            if (!res.ok) {
                console.error('Failed to fetch events');
                return;
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                this.state.events = data.map(e => ({
                    ...e,
                    startDate: new Date(e.startDate),
                    endDate: new Date(e.endDate),
                    createdAt: e.createdAt ? new Date(e.createdAt) : null
                }));

                this.notify();
            }
        } catch (err) {
            console.error('Failed to fetch events', err);
        }
    }

    async addEvent(eventData) {
        const user = this.state.currentUser;
        if (!user) return { success: false, message: 'Must be logged in' };

        try {
            const res = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...eventData,
                    createdBy: user.username
                })
            });

            const data = await res.json();

            if (data.success) {
                await this.fetchEvents();
                return { success: true };
            }

            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    async deleteEvent(eventId) {
        const user = this.state.currentUser;
        if (!user) return { success: false, message: 'Must be logged in' };

        try {
            const res = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });

            const data = await res.json();

            if (data.success) {
                await this.fetchEvents();
                return { success: true };
            }

            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    getEventsForDate(dateStr) {
        return this.state.events.filter(event =>
            Utils.isDateInRange(dateStr, event.startDate, event.endDate)
        );
    }

    // ---------------- CALENDAR ----------------

    changeMonth(direction) {
        const d = new Date(
            this.state.currentDate.getFullYear(),
            this.state.currentDate.getMonth() + direction,
            1
        );

        this.state.currentDate = d;
        this.notify();
    }
}

export const store = new Store();
