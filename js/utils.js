export const Utils = {
    // Get total days in a month
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    // Get padding days for the start of the month (grid alignment)
    getPaddingDays(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        return firstDay; // 0 (Sun) - 6 (Sat)
    },

    // Format date as YYYY-MM-DD
    formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    },

    // Check if a date is within a range (inclusive)
    isDateInRange(checkDateStr, startDateStr, endDateStr) {
        const check = new Date(checkDateStr).setHours(0, 0, 0, 0);
        const start = new Date(startDateStr).setHours(0, 0, 0, 0);
        const end = new Date(endDateStr).setHours(0, 0, 0, 0);
        return check >= start && check <= end;
    },

    // Sort events: VIP first, then by time
    sortEvents(events) {
        return events.sort((a, b) => {
            if (a.isVip && !b.isVip) return -1;
            if (!a.isVip && b.isVip) return 1;
            return a.startTime.localeCompare(b.startTime);
        });
    }
};
