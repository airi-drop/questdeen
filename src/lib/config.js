/**
 * Application configuration constants
 */

// Default timezone for formatting dates and times
// Users can override this in settings
export const DEFAULT_TIMEZONE = "Asia/Jakarta";

// API endpoints
export const API_ENDPOINTS = {
  NOMINATIM_REVERSE_GEOCODE: "https://nominatim.openstreetmap.org/reverse",
};

// Service worker cache
export const CACHE_CONFIG = {
  VERSION: "3",
  NAME: "questdeen-v3",
};

/**
 * Get timezone from settings or return default
 */
export function getTimezone(settings = null) {
  return settings?.timezone || DEFAULT_TIMEZONE;
}
