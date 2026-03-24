// Common IANA timezones for the settings dropdown
// Grouped by region for easier navigation
export const timezoneGroups = [
  {
    region: 'Americas',
    timezones: [
      { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
      { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
      { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
      { value: 'America/Anchorage', label: 'Alaska' },
      { value: 'Pacific/Honolulu', label: 'Hawaii' },
      { value: 'America/Toronto', label: 'Toronto' },
      { value: 'America/Vancouver', label: 'Vancouver' },
      { value: 'America/Mexico_City', label: 'Mexico City' },
      { value: 'America/Sao_Paulo', label: 'Sao Paulo' },
      { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
    ]
  },
  {
    region: 'Europe',
    timezones: [
      { value: 'Europe/London', label: 'London' },
      { value: 'Europe/Paris', label: 'Paris' },
      { value: 'Europe/Berlin', label: 'Berlin' },
      { value: 'Europe/Madrid', label: 'Madrid' },
      { value: 'Europe/Rome', label: 'Rome' },
      { value: 'Europe/Amsterdam', label: 'Amsterdam' },
      { value: 'Europe/Brussels', label: 'Brussels' },
      { value: 'Europe/Vienna', label: 'Vienna' },
      { value: 'Europe/Stockholm', label: 'Stockholm' },
      { value: 'Europe/Warsaw', label: 'Warsaw' },
      { value: 'Europe/Moscow', label: 'Moscow' },
    ]
  },
  {
    region: 'Asia',
    timezones: [
      { value: 'Asia/Tokyo', label: 'Tokyo' },
      { value: 'Asia/Shanghai', label: 'Shanghai' },
      { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
      { value: 'Asia/Singapore', label: 'Singapore' },
      { value: 'Asia/Seoul', label: 'Seoul' },
      { value: 'Asia/Dubai', label: 'Dubai' },
      { value: 'Asia/Kolkata', label: 'India (Kolkata)' },
      { value: 'Asia/Bangkok', label: 'Bangkok' },
      { value: 'Asia/Jakarta', label: 'Jakarta' },
    ]
  },
  {
    region: 'Pacific',
    timezones: [
      { value: 'Australia/Sydney', label: 'Sydney' },
      { value: 'Australia/Melbourne', label: 'Melbourne' },
      { value: 'Australia/Brisbane', label: 'Brisbane' },
      { value: 'Australia/Perth', label: 'Perth' },
      { value: 'Pacific/Auckland', label: 'Auckland' },
    ]
  },
  {
    region: 'Other',
    timezones: [
      { value: 'UTC', label: 'UTC' },
      { value: 'Africa/Cairo', label: 'Cairo' },
      { value: 'Africa/Johannesburg', label: 'Johannesburg' },
      { value: 'Africa/Lagos', label: 'Lagos' },
    ]
  }
];

// Flatten for use in select dropdown
export const allTimezones = timezoneGroups.flatMap(group =>
  group.timezones.map(tz => ({ ...tz, group: group.region }))
);