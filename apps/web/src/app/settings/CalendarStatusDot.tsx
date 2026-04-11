'use client';

import { useTranslation } from '@/lib/i18n';

export default function CalendarStatusDot({ isConnected }: { isConnected: boolean }) {
    const { t } = useTranslation();

    if (isConnected) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-bold ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                {t('settings.calendarConnected')}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {t('settings.calendarNotConnected')}
        </span>
    );
}
