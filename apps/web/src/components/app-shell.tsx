'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';
import BootstrapGuard from './bootstrap-guard';
import { getDashboardData } from '@/actions/dashboard';
import { Menu, Mail, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const Icon = ({ icon: I, ...props }: { icon: any;[key: string]: any }) => {
    const Component = I;
    return <Component {...props} />;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { t } = useTranslation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dashData, setDashData] = useState<any>(null);

    // ─── Email Poll Notifications ────────────────────────────
    // Only shown on dashboard (/). ONE bar with total count + most recent email.
    // Stays dismissed until a NEW email arrives (server state is cleared on dismiss,
    // so any notifications returned afterwards are genuinely new).
    const [emailNotifs, setEmailNotifs] = useState<Array<{ from: string; subject: string; date: string }>>([]);
    // Ref prevents a race: if a poll response arrives within 5s of dismiss,
    // it won't re-show the old (already-cleared-on-server) notifications.
    const dismissCooldown = useRef(false);

    useEffect(() => {
        const checkEmail = async () => {
            // Skip while tab is hidden — prevents fetch errors on OS wake-up
            if (document.hidden) return;
            try {
                const res = await fetch('/api/email/poll');
                if (!res.ok) return;
                const data = await res.json();
                if (data.notifications?.length > 0 && !dismissCooldown.current) {
                    setEmailNotifs(data.notifications);
                }
            } catch { /* network error — silent */ }
        };

        // Initial check after a short delay (don't hammer on boot)
        const timeout  = setTimeout(checkEmail, 15_000);
        // Recurring check every 60s
        const interval = setInterval(checkEmail, 60_000);

        // Re-check immediately when tab becomes visible again after suspension
        const onVisibility = () => { if (!document.hidden) checkEmail(); };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dismissEmailNotifs = async () => {
        // Start cooldown so a delayed poll response doesn't immediately re-show
        dismissCooldown.current = true;
        setEmailNotifs([]);
        try { await fetch('/api/email/poll', { method: 'DELETE' }); } catch { }
        // After DELETE, server state is cleared. Allow new notifications after 5s.
        setTimeout(() => { dismissCooldown.current = false; }, 5_000);
    };

    // Buddy window: frameless, transparent — no sidebar, no shell, no email poll
    const isBuddy = pathname === '/buddy';

    // Hide sidebar on bootstrap page
    const isBootstrap = pathname === '/bootstrap';

    useEffect(() => {
        getDashboardData()
            .then(setDashData)
            .catch(console.error);
    }, []);

    // Refresh dashboard data when navigating
    useEffect(() => {
        if (!isBootstrap) {
            getDashboardData()
                .then(setDashData)
                .catch(console.error);
        }
    }, [pathname, isBootstrap]);

    // ── Telemetry: fire 'app_start' once per app launch ──────────────────────
    // Calls the server-side route which checks settings.telemetry_enabled
    // before sending anything. Fire-and-forget, never blocks the UI.
    useEffect(() => {
        fetch('/api/telemetry/ping').catch(() => {});
        // Also report UI language on startup
        const lang = document.documentElement.lang || navigator.language?.slice(0, 2) || 'en';
        fetch(`/api/telemetry/ping?event=language&lang=${lang}`).catch(() => {});
    }, []);

    const toggleSidebar = useCallback(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setMobileOpen(prev => {
                // When opening the sidebar on mobile, always expand it fully
                // (sidebarCollapsed may have been set true by /code page auto-collapse)
                if (!prev) setSidebarCollapsed(false);
                return !prev;
            });
        } else {
            setSidebarCollapsed(prev => !prev);
        }
    }, []);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Auto-collapse sidebar on /code for full-screen building experience
    // On mobile we never collapse via state — the sidebar is an overlay controlled by mobileOpen
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        if (pathname === '/code' && !isMobile) {
            setSidebarCollapsed(true);
        }
        // When navigating away from /code, re-expand the sidebar (desktop only)
        if (pathname !== '/code' && !isMobile) {
            // Only auto-expand if it was /code that collapsed it
            // (if user manually collapsed it we don't want to expand it on every nav)
            // We can't know that here — so we leave it as-is for manual collapses
        }
    }, [pathname]);

    // Buddy window: fully transparent canvas — no sidebar, no topbar, no guards
    if (isBuddy) {
        return (
            <main style={{ width: '100vw', height: '100vh', background: 'transparent', overflow: 'hidden', position: 'relative', color: 'white' }}>
                {children}
            </main>
        );
    }

    // Bootstrap page: no sidebar, no guard
    if (isBootstrap) {
        return <>{children}</>;
    }

    return (
        <BootstrapGuard>
            <div className="app-shell">
                {/* Mobile overlay */}
                {mobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                <Sidebar
                    connected={dashData?.connected || false}
                    activeProvider={dashData?.activeProvider || 'openrouter'}
                    persona={dashData?.persona || 'default'}
                    collapsed={sidebarCollapsed}
                    mobileOpen={mobileOpen}
                    onToggle={toggleSidebar}
                />

                <main id="main-content" className={`main-content ${sidebarCollapsed ? 'main-content-expanded' : ''}`}>
                    {/* Mobile header — shrink-0 so it never gets squeezed out */}
                    <div className="md:hidden shrink-0 flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-[var(--surface-light)]"
                            aria-label={t('appShell.openNavMenu')}
                        >
                            <Icon icon={Menu} size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🦎</span>
                            <span className="font-bold text-sm bg-gradient-to-r from-lime-400 to-green-600 bg-clip-text text-transparent">
                                Skales
                            </span>
                        </div>
                    </div>

                    {/* Scrollable content area — fills remaining height, scrolls internally */}
                    <div className="main-content-scroll">
                        {/* Email notification banner — dashboard only, single row */}
                        {pathname === '/' && emailNotifs.length > 0 && (
                            <div className="px-6 lg:px-8 mt-3">
                                <div className="p-3 rounded-xl flex items-center gap-3 animate-fadeIn"
                                    style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)' }}>
                                    <Icon icon={Mail} size={15} className="text-blue-400 shrink-0" />
                                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-xs font-semibold text-blue-400 shrink-0">
                                            {emailNotifs.length === 1 ? t('appShell.email.oneNew') : t('appShell.email.manyNew', { count: emailNotifs.length })}
                                        </span>
                                        {emailNotifs[0] && (
                                            <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                                                {'— '}
                                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                    {emailNotifs[0].from.split('<')[0].trim() || emailNotifs[0].from}
                                                </span>
                                                {' · '}{emailNotifs[0].subject}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={dismissEmailNotifs}
                                        className="p-1 rounded-lg hover:bg-blue-500/10 transition-colors shrink-0"
                                        title={t('appShell.email.dismiss')}
                                        aria-label={t('appShell.email.dismissAria')}>
                                        <Icon icon={X} size={14} className="text-blue-400" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {children}
                    </div>
                </main>
            </div>
        </BootstrapGuard>
    );
}
