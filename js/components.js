import { store } from './store.js';
import { Utils } from './utils.js';

export function renderDayCell(dayNum, events, isToday, dateStr) {
    const cell = document.createElement('div');
    cell.className = `day-cell ${isToday ? 'today' : ''}`;
    cell.dataset.date = dateStr;

    cell.innerHTML = `<span class="day-number">${dayNum}</span>`;

    // Render max 3 events, or 2 and a "more" button
    const maxDisplay = 3;
    const displayEvents = events.slice(0, maxDisplay);

    displayEvents.forEach(event => {
        const div = document.createElement('div');
        div.className = `event-strip ${event.isVip ? 'vip' : ''}`;
        div.textContent = event.title;
        div.title = event.title; // Tooltip
        cell.appendChild(div);
    });

    if (events.length > maxDisplay) {
        const more = document.createElement('div');
        more.className = 'event-strip more-events';
        more.textContent = `+ ${events.length - maxDisplay} more`;
        cell.appendChild(more);
    }

    // Click handler to open day details
    cell.onclick = () => openDayModal(dateStr, events);

    return cell;
}

function openDayModal(dateStr, events) {
    const modal = document.getElementById('eventModal');
    const container = document.getElementById('eventDetails');
    const user = store.state.currentUser;

    let html = `<h2>Events for ${dateStr}</h2>`;

    // Action Buttons for Logged In Users
    if (user) {
        html += `<button id="openCreateEventBtn" class="cta-btn" style="width:100%; margin-bottom:15px;">+ Create Vibe</button>`;
    } else {
        html += `<p style="color:var(--color-text-muted); margin-bottom:15px;">Sign in to post a vibe!</p>`;
    }

    // List Events
    if (events.length === 0) {
        html += `<p>No vibes yet for this day.</p>`;
    } else {
        html += `<div class="event-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px;">`;
        events.forEach(event => {
            // Admin can delete ANYTHING. User can delete OWN.
            const isOwner = user && (user.username === event.createdBy || user.role === 'admin');
            html += `
                <div class="event-item" style="position:relative; background:rgba(255,255,255,0.05); padding:10px; margin-bottom:10px; border-radius:8px; border-left: 4px solid ${event.isVip ? 'var(--color-accent)' : 'var(--color-primary)'}">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h3 style="color:${event.isVip ? 'var(--color-accent)' : 'white'}; margin-bottom:5px; padding-right:30px;">${event.title} ${event.isVip ? '⭐' : ''}</h3>
                        ${isOwner ? `<button class="delete-event-btn" onclick="event.stopPropagation(); window.deleteEvent('${event._id || event.id}')" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.2); border:none; color:#ff4444; cursor:pointer; font-size:1.2rem; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">&times;</button>` : ''}
                    </div>
                    <p style="font-size:0.9rem; color:#ddd;">From: ${Utils.formatDate(event.startDate)} ${event.startTime || ''}</p>
                    <p style="font-size:0.9rem; color:#ddd;">To: ${Utils.formatDate(event.endDate)} ${event.endTime || ''}</p>
                    <p style="margin-top:5px; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; max-width: 100%;">${event.description}</p>
                    <small style="color:var(--color-text-muted)">Posted by: ${event.createdBy}</small>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    modal.classList.remove('hidden');

    // Attach listener to new button
    const createBtn = document.getElementById('openCreateEventBtn');
    if (createBtn) {
        createBtn.onclick = () => {
            modal.classList.add('hidden'); // Close this modal
            openCreateForm(dateStr); // Open create form
        };
    }

    // Expose delete handler globally since we use onclick string
    window.deleteEvent = (id) => {
        const confirmModal = document.getElementById('confirmationModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const cancelBtn = document.getElementById('cancelDeleteBtn');

        confirmModal.classList.remove('hidden');

        // Handle Confirmation
        confirmBtn.onclick = async () => {
            const result = await store.deleteEvent(id);
            if (result.success) {
                // Refresh modal content (Close day modal to force refresh of calendar)
                modal.classList.add('hidden');
            } else {
                alert(result.message);
            }
            confirmModal.classList.add('hidden');
        };

        // Handle Cancellation
        cancelBtn.onclick = () => {
            confirmModal.classList.add('hidden');
        };
    };
}

function openCreateForm(dateStr) {
    const modal = document.getElementById('createEventModal');
    // Pre-fill date
    document.getElementById('eventStartDate').value = dateStr;
    document.getElementById('eventEndDate').value = dateStr;

    // Calc Limit status
    // Calc Limit status
    const user = store.state.currentUser;
    const limitContainer = document.getElementById('limitStatusContainer') || document.createElement('div');
    limitContainer.id = 'limitStatusContainer';
    limitContainer.style.marginBottom = '15px';

    // Reset any previous state
    const submitBtn = document.querySelector('#createEventForm .cta-btn');
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.textContent = 'Post Vibe';

    let limitHtml = '';

    if (user && user.role !== 'admin') {
        const todayStr = Utils.formatDate(new Date());
        // Enforce limit of 2 events per DAY (based on creation date)
        const userEventsToday = store.state.events.filter(e =>
            e.createdBy === user.username &&
            e.createdAt && Utils.formatDate(e.createdAt) === todayStr
        );
        const used = userEventsToday.length;
        const max = 2;

        limitHtml = `<div style="color:var(--color-secondary); font-weight:bold;">Vibes Posted Today: ${used} / ${max}</div>`;

        if (used >= max) {
            limitHtml += `<div style="color:#ff4444; font-size:0.9rem; margin-top:5px;">You've reached your daily limit of ${max} vibes!</div>`;
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.textContent = 'Limit Reached';
        } else {
            const remaining = max - used;
            limitHtml += `<div style="color:var(--color-text-muted); font-size:0.9rem;">You can post ${remaining} more vibe${remaining !== 1 ? 's' : ''} today.</div>`;
        }
    } else if (user && user.role === 'admin') {
        limitHtml = `<div style="color:var(--color-accent); font-weight:bold;">Daily Vibes: Unlimited (Admin Mode)</div>`;
    }

    // Default Times (Now and Now + 1h, rounded to nearest 10 mins)
    const now = new Date();
    const roundToNearest10 = (date) => {
        const minutes = date.getMinutes();
        const rounded = Math.ceil(minutes / 10) * 10;
        const newDate = new Date(date);
        newDate.setMinutes(rounded, 0, 0);
        return newDate;
    };

    const startTime = roundToNearest10(now);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const formatTime = (date) => {
        return date.getHours().toString().padStart(2, '0') + ':' +
            date.getMinutes().toString().padStart(2, '0');
    };

    document.getElementById('eventStartTime').value = formatTime(startTime);
    document.getElementById('eventEndTime').value = formatTime(endTime);

    limitContainer.innerHTML = limitHtml;

    // Insert message before form start
    const form = document.getElementById('createEventForm');
    if (!document.getElementById('limitStatusContainer')) {
        form.insertBefore(limitContainer, form.querySelector('input'));
    }

    modal.classList.remove('hidden');
}
