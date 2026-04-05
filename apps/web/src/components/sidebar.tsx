'use client';

import Link from 'next/link';
import { APP_VERSION } from '@/lib/meta';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MessageCircle,
    ListTodo,
    Clock,
    Bot,
    ScrollText,
    Settings,
    BookOpen,
    Wifi,
    WifiOff,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Sun,
    Moon,
    Power,
    Brain,
    Download,
    Puzzle,
    Users,
    Wand2,
    Star,
    Network,
    // Lucide icons for custom skills (mapped by name string)
    Wrench, Code, Image, Quote, Music, Globe, Search, FileText, BarChart3, Zap,
    Shield, Camera, Heart, Briefcase, Database, Mail, Bell, Bookmark, Calculator,
    Calendar, Compass, Cpu, Film, Hash, Headphones, Key, Layers, Link as LinkIcon, Lock,
    Map, Monitor, Package, PenTool, Rocket, Server, Terminal, TrendingUp, Tv,
    Video, Palette, Gamepad2, Lightbulb, Megaphone, Eye, Activity, Bug,
} from 'lucide-react';
import { isEmoji } from '@/lib/skill-icons';
import { shutdownServer } from '@/actions/system';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import BugReportModal from '@/components/bug-report-modal';

interface SidebarProps {
    connected?: boolean;
    activeProvider?: string;
    persona?: string;
    collapsed?: boolean;
    mobileOpen?: boolean;
    onToggle?: () => void;
}

// ─── Section: MENU ────────────────────────────────────────────
const MENU_ITEMS = [
    { href: '/',          label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & Status' },
    { href: '/chat',      label: 'Chat',      icon: MessageCircle,   description: 'Talk to Skales' },
    { href: '/planner',   label: 'Planner',   icon: Calendar,        description: 'AI-Powered Daily Schedule', beta: true },
    { href: '/autopilot', label: 'Autopilot', icon: Star,            description: 'Autonomous Chief of Staff', premium: true },
    { href: '/agents',    label: 'Agents',    icon: Bot,             description: 'Sub-Agents' },
    { href: '/memory',    label: 'Memory',    icon: Brain,           description: 'What Skales Remembers' },
];

// ─── Section: SKILLS — core items always shown ────────────────
const CORE_SKILL_ITEMS = [
    { href: '/schedule', label: 'Schedule', icon: Clock,    description: 'Cron Jobs & Automation' },
    { href: '/tasks',    label: 'Tasks',    icon: ListTodo, description: 'Jobs & Workflows' },
];

// ─── Section: SKILLS — dynamic items (gated by skill toggle) ─
// Add new skill-nav entries here; they appear automatically when enabled.

// Lio AI uses an emoji as its "icon" — wrap it so NavLink can render it uniformly.
const LioIcon = ({ size = 18 }: { size?: number }) => (
    <span style={{ fontSize: size, lineHeight: 1, display: 'flex', alignItems: 'center' }}>🦁</span>
);

const SKILL_NAV_ITEMS = [
    { skillId: 'group_chat',      href: '/group-chat', label: 'Group Chat',        icon: Users,   description: 'Multi-AI Discussion' },
    { skillId: 'lio_ai',         href: '/code',       label: 'Lio AI',            icon: LioIcon, description: 'Code Builder' },
    { skillId: 'network_scanner', href: '/network',    label: 'Network & Devices', icon: Network, description: 'Scanner + DLNA Cast', beta: true },
] as const;

// ─── Section: SYSTEM ─────────────────────────────────────────
const SYSTEM_ITEMS = [
    { href: '/skills',        label: 'Skills',        icon: Puzzle,     description: 'Capabilities & Tools' },
    { href: '/custom-skills', label: 'Custom Skills', icon: Wand2,      description: 'AI-Generated & Uploaded' },
    { href: '/settings',      label: 'Settings',      icon: Settings,   description: 'Configuration' },
    { href: '/logs',          label: 'Logs',           icon: ScrollText, description: 'Activity & Usage' },
    { href: '/update',        label: 'Update',         icon: Download,   description: 'Check for Updates' },
];

// ─── Helper ───────────────────────────────────────────────────
// Fixes React 18 vs 19 types mismatch for lucide icons.
const Icon = ({ icon: I, ...props }: { icon: any; [key: string]: any }) => {
    const Component = I;
    return <Component {...props} />;
};

// Custom skill nav item (hasUI skills loaded at runtime)
interface CustomSkillNavItem {
    id:        string;
    menuName:  string;
    menuRoute: string;
    icon:      string; // Lucide icon name (e.g. "Wrench") or legacy emoji
}

// ── Lucide icon name → component map for custom skills ──
const SKILL_ICON_MAP: Record<string, any> = {
    Wrench, Code, Image, Quote, Music, Globe, Search, FileText, BarChart3, Zap,
    Shield, Camera, Heart, Star, Briefcase, Database, Mail, Bell, Bookmark, Calculator,
    Calendar, Compass, Cpu, Film, Hash, Headphones, Key, Layers, Link: LinkIcon, Lock,
    Map, Monitor, Package, PenTool, Rocket, Server, Terminal, TrendingUp, Tv,
    Video, Bot, Palette, Gamepad2, Lightbulb, Megaphone, Settings, Users, Eye, Activity,
};

/** Render a custom skill icon — Lucide component by name, or fallback to emoji/text */
const SkillIcon = ({ icon, size = 18 }: { icon: string; size?: number }) => {
    // If icon name matches a Lucide component, render it
    const LucideComp = SKILL_ICON_MAP[icon];
    if (LucideComp) {
        return <LucideComp size={size} />;
    }
    // Legacy emoji fallback
    if (isEmoji(icon)) {
        return <span style={{ fontSize: size, lineHeight: 1, display: 'flex', alignItems: 'center' }}>{icon}</span>;
    }
    // Unknown string — render Wrench as safe default
    return <Wrench size={size} />;
};

export default function Sidebar({
    connected = false,
    activeProvider = 'openrouter',
    persona = 'default',
    collapsed = false,
    mobileOpen = false,
    onToggle,
}: SidebarProps) {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
    const [customSkillItems, setCustomSkillItems] = useState<CustomSkillNavItem[]>([]);
    // bugReportOpen state removed — sidebar now links to /feedback page
    const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
    const [shutdownMessage, setShutdownMessage] = useState('');
    const { t } = useTranslation();

    // Translated nav labels (keyed by href)
    const NAV_LABELS: Record<string, string> = {
        '/':              t('nav.dashboard'),
        '/chat':          t('nav.chat'),
        '/planner':       t('nav.planner'),
        '/autopilot':     t('nav.autopilot'),
        '/agents':        t('nav.agents'),
        '/memory':        t('nav.memory'),
        '/schedule':      t('nav.schedule'),
        '/tasks':         t('nav.tasks'),
        '/group-chat':    t('nav.groupChat'),
        '/code':          t('nav.code'),
        '/network':       t('nav.network'),
        '/skills':        t('nav.skills'),
        '/custom-skills': t('nav.customSkills'),
        '/settings':      t('nav.settings'),
        '/logs':          t('nav.logs'),
        '/update':        t('nav.update'),
    };

    useEffect(() => setMounted(true), []);

    // ── Built-in skill items ───────────────────────────────────
    const fetchActiveSkills = () => {
        fetch('/api/skills/active')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data.skills)) setActiveSkills(new Set(data.skills));
            })
            .catch(() => { /* silently ignore — skill items just won't show */ });
    };

    // ── Custom skill sidebar items (hasUI=true) ────────────────
    const fetchCustomSkillNav = () => {
        fetch('/api/custom-skills/active')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data.skills)) setCustomSkillItems(data.skills);
            })
            .catch(() => { /* ignore */ });
    };

    // Fetch on mount and on every route change
    useEffect(() => {
        fetchActiveSkills();
        fetchCustomSkillNav();
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch when skills are toggled:
    //   same tab → CustomEvent 'skalesSkillsChanged'
    //   other tabs → StorageEvent (localStorage key)
    //   window regain focus → check for changes made in another tab
    useEffect(() => {
        const onSkillsChanged = () => { fetchActiveSkills(); fetchCustomSkillNav(); };
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'skalesSkillsChanged') onSkillsChanged();
        };
        window.addEventListener('skalesSkillsChanged', onSkillsChanged);
        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', onSkillsChanged);
        return () => {
            window.removeEventListener('skalesSkillsChanged', onSkillsChanged);
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', onSkillsChanged);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dynamicSkillItems = SKILL_NAV_ITEMS.filter(item => activeSkills.has(item.skillId));

    const handleShutdown = async () => {
        setShowShutdownConfirm(true);
    };

    const confirmShutdown = async () => {
        setShowShutdownConfirm(false);
        try {
            await shutdownServer();
            setShutdownMessage(t('sidebar.shutdown.alert'));
            setTimeout(() => window.close(), 1500);
        } catch (e) {
            console.error('Shutdown failed:', e);
            setShutdownMessage('Shutdown failed: ' + String(e));
        }
    };

    // ── Shared nav-link renderer ──────────────────────────────
    const NavLink = ({
        href,
        label,
        icon,
        exact   = false,
        premium = false,
        beta    = false,
    }: {
        href:     string;
        label:    string;
        icon:     any;
        exact?:   boolean;
        premium?: boolean;
        beta?:    boolean;
    }) => {
        const isActive = exact
            ? pathname === href
            : pathname === href || (href !== '/' && pathname.startsWith(href));

        const premiumGold = '#f59e0b'; // amber-400

        return (
            <Link
                href={href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${collapsed ? 'justify-center' : ''} ${isActive ? 'text-lime-600 dark:text-lime-400' : 'hover:bg-[var(--sidebar-hover)]'} ${premium ? 'font-bold' : 'font-medium'}`}
                style={{
                    background:  isActive
                        ? premium ? 'rgba(245,158,11,0.10)' : 'var(--sidebar-active)'
                        : premium && !isActive ? 'rgba(245,158,11,0.04)' : undefined,
                    color:       isActive
                        ? premium ? premiumGold : undefined
                        : premium ? premiumGold : 'var(--text-secondary)',
                    borderLeft:  isActive && !collapsed
                        ? premium ? `3px solid ${premiumGold}` : '3px solid #84cc16'
                        : '3px solid transparent',
                }}
                title={label}
                aria-label={premium ? `${label} (Premium)` : beta ? `${label} (Beta)` : label}
                aria-current={isActive ? 'page' : undefined}
            >
                <Icon
                    icon={icon}
                    size={collapsed ? 20 : 18}
                    className="transition-transform group-hover:scale-110"
                    style={{ color: premium ? premiumGold : isActive ? '#84cc16' : undefined }}
                />
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <span>{label}</span>
                        {beta && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold ml-auto">BETA</span>}
                    </div>
                )}
            </Link>
        );
    };

    const SectionLabel = ({ label }: { label: string }) =>
        !collapsed ? (
            <p className="px-3 mb-1 mt-4 first:mt-0 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {label}
            </p>
        ) : (
            // Collapsed: thin horizontal divider instead of text label
            <div className="mx-3 my-2 h-px" style={{ background: 'var(--sidebar-border)' }} />
        );

    return (
        <aside
            className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
            aria-label={t('sidebar.ariaLabel')}
        >

            {/* ── Logo / Brand ─────────────────────────────── */}
            <div
                className={`p-4 border-b flex ${collapsed ? 'flex-col justify-center gap-4' : 'flex-row items-center justify-between'}`}
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                {collapsed ? (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center text-xl shadow-lg shadow-lime-500/20">
                            🦎
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors flex justify-center"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={t('sidebar.expandSidebar')}
                        >
                            <Icon icon={ChevronRight} size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center text-xl shadow-lg shadow-lime-500/20 animate-float">
                                🦎
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg font-bold bg-gradient-to-r from-lime-400 to-green-600 bg-clip-text text-transparent leading-tight">
                                    Skales
                                </h1>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`status-dot ${connected ? 'online' : 'offline'}`} />
                                    <span className="text-[11px] font-medium capitalize" style={{ color: 'var(--text-muted)' }}>
                                        {persona}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            aria-label={t('sidebar.collapseSidebar')}
                        >
                            <Icon icon={ChevronLeft} size={20} />
                        </button>
                    </>
                )}
            </div>

            {/* ── Connection Status ─────────────────────────── */}
            <div
                className={`px-4 py-3 mx-3 mt-3 rounded-xl transition-all duration-300 ${collapsed ? 'flex justify-center p-2 mx-2' : ''}`}
                style={{
                    background: connected ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                    border: `1px solid ${connected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                }}
            >
                {collapsed ? (
                    connected
                        ? <Icon icon={Wifi} size={18} className="text-green-500" />
                        : <Icon icon={WifiOff} size={18} className="text-red-400" />
                ) : (
                    <div className="flex items-center gap-2.5">
                        {connected
                            ? <Icon icon={Wifi} size={14} className="text-green-500" />
                            : <Icon icon={WifiOff} size={14} className="text-red-400" />}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: connected ? '#22c55e' : '#ef4444' }}>
                                {connected ? t('sidebar.status.connected') : t('sidebar.status.notConnected')}
                            </p>
                            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                                {activeProvider === 'ollama'
                                    ? (connected ? t('sidebar.status.localAI') : t('sidebar.status.startOllama'))
                                    : activeProvider}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Navigation ───────────────────────────────── */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5" aria-label="Main navigation">

                {/* MENU */}
                <SectionLabel label={t('nav.sections.menu')} />
                {MENU_ITEMS.map(item => (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        label={NAV_LABELS[item.href] || item.label}
                        icon={item.icon}
                        exact={item.href === '/'}
                        premium={(item as any).premium === true}
                        beta={(item as any).beta === true}
                    />
                ))}

                {/* SKILLS — core items always visible */}
                <SectionLabel label={t('nav.sections.skills')} />
                {CORE_SKILL_ITEMS.map(item => (
                    <NavLink key={item.href} href={item.href} label={NAV_LABELS[item.href] || item.label} icon={item.icon} />
                ))}
                {/* Dynamic built-in skill items — only when the corresponding skill is enabled */}
                {dynamicSkillItems.map(item => (
                    <NavLink key={item.href} href={item.href} label={NAV_LABELS[item.href] || item.label} icon={item.icon} beta={(item as any).beta === true} />
                ))}
                {/* Dynamic custom skill items — only when custom skills have hasUI=true and are enabled */}
                {customSkillItems.map(item => (
                    <Link
                        key={item.id}
                        href={item.menuRoute}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''} ${pathname === item.menuRoute ? 'text-lime-600 dark:text-lime-400' : 'hover:bg-[var(--sidebar-hover)]'}`}
                        style={{
                            background: pathname === item.menuRoute ? 'var(--sidebar-active)' : undefined,
                            color: pathname === item.menuRoute ? undefined : 'var(--text-secondary)',
                            borderLeft: pathname === item.menuRoute && !collapsed ? '3px solid #84cc16' : '3px solid transparent',
                        }}
                        title={item.menuName}
                        aria-label={item.menuName}
                        aria-current={pathname === item.menuRoute ? 'page' : undefined}
                    >
                        <SkillIcon icon={item.icon} size={collapsed ? 20 : 18} />
                        {!collapsed && <span>{item.menuName}</span>}
                    </Link>
                ))}

                {/* SYSTEM */}
                <SectionLabel label={t('nav.sections.system')} />
                {SYSTEM_ITEMS.map(item => (
                    <NavLink key={item.href} href={item.href} label={NAV_LABELS[item.href] || item.label} icon={item.icon} />
                ))}
                {/* Docs — external link, stays inside System section */}
                <a
                    href="https://docs.skales.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-[var(--sidebar-hover)] ${collapsed ? 'justify-center' : ''}`}
                    style={{
                        color: 'var(--text-secondary)',
                        borderLeft: '3px solid transparent',
                    }}
                    title={collapsed ? t('nav.docs') : undefined}
                    aria-label={t('sidebar.docsTitle')}
                >
                    <Icon icon={BookOpen} size={collapsed ? 20 : 18} className="transition-transform group-hover:scale-110" />
                    {!collapsed && (
                        <>
                            <span>{t('nav.docs')}</span>
                            <Icon icon={Sparkles} size={12} className="ml-auto text-lime-500/50" />
                        </>
                    )}
                </a>

            </nav>

            {/* ── Fixed Bottom — Dark Mode + Stop Server ────── */}
            <div className="px-3 pb-2 pt-3 border-t space-y-0.5" style={{ borderColor: 'var(--sidebar-border)' }}>

                {/* Dark Mode Toggle */}
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-[var(--sidebar-hover)] w-full ${collapsed ? 'justify-center' : ''}`}
                        style={{ color: 'var(--text-muted)' }}
                        title={collapsed ? (theme === 'dark' ? t('sidebar.theme.light') : t('sidebar.theme.dark')) : undefined}
                        aria-label={theme === 'dark' ? t('sidebar.theme.switchToLight') : t('sidebar.theme.switchToDark')}
                    >
                        {theme === 'dark'
                            ? <Icon icon={Sun} size={collapsed ? 20 : 18} />
                            : <Icon icon={Moon} size={collapsed ? 20 : 18} />}
                        {!collapsed && <span>{theme === 'dark' ? t('sidebar.theme.light') : t('sidebar.theme.dark')}</span>}
                    </button>
                )}

                {/* Report Bug / Feedback */}
                <Link
                    href="/feedback"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-[var(--sidebar-hover)] w-full ${collapsed ? 'justify-center' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                    title={collapsed ? t('bugReport.sidebar') : undefined}
                    aria-label={t('bugReport.sidebar')}
                >
                    <Icon icon={Bug} size={collapsed ? 20 : 18} />
                    {!collapsed && <span>{t('bugReport.sidebar')}</span>}
                </Link>

                {/* Stop Server */}
                <button
                    onClick={handleShutdown}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-500/10 text-red-500 w-full ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? t('sidebar.stopServer') : undefined}
                    aria-label={t('sidebar.stopServer')}
                >
                    <Icon icon={Power} size={collapsed ? 20 : 18} />
                    {!collapsed && <span>{t('sidebar.stopServer')}</span>}
                </button>
            </div>

            {/* ── Version Footer ───────────────────────────── */}
            {!collapsed && (
                <div className="px-5 py-3 border-t text-center" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {`Skales v${APP_VERSION}`}
                    </p>
                </div>
            )}

            {/* Bug Report Modal removed — sidebar now links to /feedback page */}

            {/* Shutdown Confirmation Modal */}
            {showShutdownConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-red-400">{t('sidebar.shutdown.confirm')}</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {t('sidebar.shutdown.desc') || 'Are you sure you want to shut down the server? Close and reopen the app to restart.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowShutdownConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--sidebar-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmShutdown}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-red-400 bg-red-500/20 border border-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                            >
                                Shutdown
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shutdown Status Message */}
            {shutdownMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--surface)] border border-green-500/30 rounded-2xl p-6 max-w-sm mx-4 text-center space-y-4">
                        <p className="text-sm font-medium text-green-400">{shutdownMessage}</p>
                    </div>
                </div>
            )}
        </aside>
    );
}
