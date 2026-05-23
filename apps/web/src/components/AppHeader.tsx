"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronDown,
  FileText,
  Grid2X2,
  Home,
  LogOut,
  PanelTop,
  Settings,
  Sparkles,
  UserRound,
  Users
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Grid2X2 },
  { href: "/groups", label: "My Groups", icon: Users },
  { href: "/assignments", label: "Assignments", icon: FileText },
  { href: "/toolkit", label: "AI Teacher's Toolkit", icon: PanelTop },
  { href: "/library", label: "My Library", icon: BookOpen }
];

const pageLabels: Record<string, string> = {
  "/": "Create New",
  "/dashboard": "Home",
  "/groups": "My Groups",
  "/assignments": "Assignment",
  "/toolkit": "AI Teacher's Toolkit",
  "/library": "My Library",
  "/settings": "Settings"
};

export function AppHeader() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const title = pageLabels[pathname] ?? (pathname.startsWith("/assignment/") ? "Assignment" : "Workspace");

  return (
    <>
      <aside className="app-sidebar" aria-label="Workspace navigation">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark">V</span>
          <strong>VedaAI</strong>
        </Link>

        <Link className={pathname === "/" ? "toolkit-cta active" : "toolkit-cta"} href="/">
          <Sparkles size={17} />
          Create Assignment
        </Link>

        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link className={isActive("/settings") ? "active" : ""} href="/settings">
            <Settings size={18} />
            Settings
          </Link>
          <div className="school-card">
            <span className="school-avatar">D</span>
            <div>
              <strong>Delhi Public School</strong>
              <small>Bokaro Steel City</small>
            </div>
          </div>
        </div>
      </aside>

      <header className="app-header">
        <div className="topbar-left">
          <Link className="back-circle" href={pathname === "/" ? "/assignments" : "/"}>
            <ChevronDown size={22} />
          </Link>
          <Home size={18} />
          <span>{title}</span>
        </div>
        <div className="topbar-actions">
          <Link className="icon-button notify-button" href="/dashboard" title="Notifications">
            <Bell size={22} />
          </Link>
          <Link className="user-chip" href="/settings" title={user.name}>
            <span>
              <UserRound size={18} />
            </span>
            <strong>{user.name}</strong>
            <ChevronDown size={18} />
          </Link>
          <button className="icon-button" type="button" onClick={() => void logout()} title="Sign out">
            <LogOut size={19} />
          </button>
        </div>
      </header>
    </>
  );
}
