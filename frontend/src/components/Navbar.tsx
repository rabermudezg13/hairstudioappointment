"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ScissorsIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/appointments", label: "Citas", icon: CalendarDaysIcon },
  { href: "/services", label: "Servicios", icon: ScissorsIcon },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-pink-600 to-purple-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">💇‍♀️</span>
            <span className="text-xl font-bold tracking-tight">Ludy Hair Studio</span>
          </div>

          {/* Navigation links */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
