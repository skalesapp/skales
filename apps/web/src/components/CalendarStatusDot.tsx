import React from 'react';

export function CalendarStatusDot({
  isConnected,
  t,
}: {
  isConnected: boolean;
  t: (key: string) => string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold">
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`}
      />
      {isConnected
        ? t('settings.calendarConnected')
        : t('settings.calendarNotConnected')}
    </span>
  );
}