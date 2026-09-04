/**
 * Human-readable formatting utilities for SiBo frontend
 * Translates technical backend enums into user-friendly labels
 */

/**
 * Format exception type from technical enum to readable label
 * @param {string} type - Technical exception type from backend
 * @returns {string} Human-readable label
 */
export function formatExceptionType(type) {
  const typeMap = {
    'COMPONENT_MISMATCH': 'Component mismatch',
    'MISSING_SETTLEMENT': 'Missing settlement',
    'UNEXPLAINED_DIFFERENCE': 'Unexplained difference',
    'DUPLICATE_TRANSACTION': 'Duplicate transaction',
    'AMOUNT_MISMATCH': 'Amount mismatch',
  };

  return typeMap[type] || type;
}

/**
 * Format investigation status to user-friendly label
 * @param {string} status - Technical status from backend
 * @returns {string} Human-readable status
 */
export function formatInvestigationStatus(status) {
  const statusMap = {
    'PENDING': 'Needs investigation',
    'IN_PROGRESS': 'Investigating',
    'COMPLETED': 'Investigated',
    'MANUAL_REVIEW': 'Needs review',
    'EXPLAINED': 'Resolved',
    'UNRESOLVED': 'Needs review',
  };

  return statusMap[status] || status;
}

/**
 * Format exception category for display
 * @param {string} category - Exception category
 * @returns {string} Formatted category
 */
export function formatCategory(category) {
  if (!category) return 'Unknown';

  // Convert SCREAMING_SNAKE_CASE to Title Case
  return category
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format monetary amount
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} Formatted amount
 */
export function formatAmount(amount, currency = '₹') {
  if (amount === null || amount === undefined) return `${currency}0.00`;

  const num = parseFloat(amount);
  if (isNaN(num)) return `${currency}0.00`;

  return `${currency}${num.toFixed(2)}`;
}

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return 'N/A';

  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return date;
  }
}

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time
 */
export function formatDateTime(date) {
  if (!date) return 'N/A';

  try {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return date;
  }
}

/**
 * Format reconciliation status badge
 * @param {string} status - Status value
 * @returns {object} Badge configuration {className, label}
 */
export function getStatusBadge(status) {
  const badges = {
    'MATCHED': { className: 'badge-success', label: 'Matched' },
    'EXCEPTION': { className: 'badge-error', label: 'Exception' },
    'PENDING': { className: 'badge-neutral', label: 'Pending' },
    'IN_PROGRESS': { className: 'badge-info', label: 'In Progress' },
    'COMPLETED': { className: 'badge-success', label: 'Completed' },
  };

  return badges[status] || { className: 'badge-neutral', label: status };
}

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
}
