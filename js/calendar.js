import { store } from './store.js';
import { Utils } from './utils.js';
import { renderDayCell } from './components.js';

export const Calendar = {
    init() {
        this.grid = document.getElementById('calendarGrid');
        this.monthLabel = document.getElementById('currentMonthYear');

        // Subscribe to store changes to re-render
        store.subscribe(() => this.render());

        this.render();
    },

    render() {
        if (!this.grid) return;

        this.grid.innerHTML = '';
        const date = store.state.currentDate;
        const year = date.getFullYear();
        const month = date.getMonth();

        // Update Header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        this.monthLabel.textContent = `${monthNames[month]} ${year}`;

        // Calculations
        const paddingDays = Utils.getPaddingDays(year, month);
        const daysInMonth = Utils.getDaysInMonth(year, month);

        // Render Padding Days (Previous Month)
        // We can just render empty cells or faded numbers. Let's do faded numbers.
        const prevMonthDays = Utils.getDaysInMonth(year, month - 1);
        for (let i = paddingDays; i > 0; i--) {
            const dayNum = prevMonthDays - i + 1;
            const cell = document.createElement('div');
            cell.className = 'day-cell other-month';
            cell.innerHTML = `<span class="day-number">${dayNum}</span>`;
            this.grid.appendChild(cell);
        }

        // Render Current Month Days
        const today = new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const currentDayStr = Utils.formatDate(new Date(year, month, i));
            const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());

            // Get events for this day
            const dayEvents = store.getEventsForDate(currentDayStr);
            const sortedEvents = Utils.sortEvents(dayEvents);

            const cell = renderDayCell(i, sortedEvents, isToday, currentDayStr);
            this.grid.appendChild(cell);
        }
    }
};
