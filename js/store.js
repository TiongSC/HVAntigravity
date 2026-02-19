import { Utils } from './utils.js';

const API_URL = 'http://localhost:3000/api'; // Adjust based on environment

class Store {
    constructor() {
        this.state = {
            currentUser: JSON.parse(localStorage.getItem('hv_user')) || null, // Keep user in LS for session persistence
            events: [],
            currentDate: new Date()
        };
        this.listeners = [];
        this.init();
    }

    async init() {
        if (this.state.currentUser) {
            await this.fetchEvents();
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Auth Actions ---
    async login(username, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                this.state.currentUser = data.user;
                localStorage.setItem('hv_user', JSON.stringify(data.user));
                await this.fetchEvents();
                this.notify();
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    async signup(username, email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (data.success) {
                // Auto login after signup
                return this.login(username, password);
            }
            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Network error' };
        }
    }

    logout() {
        this.state.currentUser = null;
        localStorage.removeItem('hv_user');
        this.notify();
        window.location.reload();
    }

    // --- Event Actions ---
    async fetchEvents() {
        try {
            const res = await fetch(`${API_URL}/events`);
            const data = await res.json();
            if (Array.isArray(data)) {
                this.state.events = data.map(e => ({
                    ...e,
                    startDate: new Date(e.startDate), // Convert strings back to Date objects
                    endDate: new Date(e.endDate)
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
                await this.fetchEvents(); // Refresh list
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

    // --- Calendar Navigation ---
    changeMonth(direction) {
        const d = new Date(this.state.currentDate);
        d.setMonth(d.getMonth() + direction);
        this.state.currentDate = d;
        this.notify();
    }
}

export const store = new Store();
