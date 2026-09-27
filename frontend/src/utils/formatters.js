/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date
 */
export function formatDate(dateString, includeTime = false) {
    if (!dateString) return "N/A";

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        if (includeTime) {
            return date.toLocaleString("en-US", {
                year:  "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid date";
    }
}

/**
 * Format date to short string (e.g., "Jan 17")
 * @param {string} dateString - ISO date string
 * @returns {string} Short formatted date
 */
export function formatDateShort(dateString) {
    if (!dateString) return "No date";

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });
    } catch (error) {
        return "Invalid date";
    }
}

/**
 * Format date and time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time
 */
export function formatDateTime(dateString) {
    return formatDate(dateString, true);
}

/**
 * Get user initials from first and last name
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} User initials (e.g., "JD")
 */
export function getInitials(firstName, lastName) {
    if (!firstName && !lastName) return "?? ";

    const first = firstName?.[0]?.toUpperCase() || "";
    const last = lastName?.[0]?.toUpperCase() || "";

    return `${first}${last}` || "? ";
}

/**
 * Calculate progress percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {number} Progress percentage (0-100)
 */
export function calculateProgress(completed, total) {
    if (total === 0) return 0;
    if (completed > total) return 100;

    return Math.round((completed / total) * 100);
}

/**
 * Format status to readable text
 * @param {string} status - Status enum value
 * @returns {string} Readable status text
 */
export function formatStatus(status) {
    if (!status) return "Unknown";

    const statusMap = {
        'NEW': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'REVIEW': 'Review',
        'DONE': 'Done'
    };

    return statusMap[status] || status;
}

/**
 * Format priority to readable text
 * @param {string} priority - Priority enum value
 * @returns {string} Readable priority text
 */
export function formatPriority(priority) {
    if (!priority) return "Normal";

    const priorityMap = {
        'HIGH':  'High',
        'NORMAL': 'Normal',
        'LOW':  'Low'
    };

    return priorityMap[priority] || priority;
}

/**
 * Get status color class
 * @param {string} status - Status value
 * @returns {string} Tailwind color class
 */
export function getStatusColor(status) {
    const colorMap = {
        'DONE': 'bg-green-500',
        'IN_PROGRESS': 'bg-blue-500',
        'REVIEW': 'bg-purple-500',
        'NEW': 'bg-gray-500'
    };

    return colorMap[status] || 'bg-gray-500';
}

/**
 * Get priority variant for Badge component
 * @param {string} priority - Priority value
 * @returns {string} Badge variant
 */
export function getPriorityVariant(priority) {
    const variantMap = {
        'HIGH': 'destructive',
        'NORMAL': 'secondary',
        'LOW': 'outline'
    };

    return variantMap[priority] || 'secondary';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength = 50) {
    if (!text) return "";
    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength) + "...";
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateString) {
    if (!dateString) return "Unknown";

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return "just now";
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ?  's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' :  ''} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay > 1 ?  's' : ''} ago`;
        if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;

        return formatDate(dateString);
    } catch (error) {
        return "Unknown";
    }
}

/**
 * Convert enum to display text (lowercase to Title Case)
 * @param {string} enumValue - Enum value (e.g., "IN_PROGRESS")
 * @returns {string} Display text (e.g., "In Progress")
 */
export function enumToDisplay(enumValue) {
    if (!enumValue) return "";

    return enumValue
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}