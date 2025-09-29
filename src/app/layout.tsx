"use client";

import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import Link from "next/link";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Play, Plus, Calendar, Clock, Menu } from "lucide-react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/playlist", label: "Playlist", icon: Play },
    { href: "/addmusic", label: "Add Music", icon: Plus },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/schedulemusic", label: "Music Sched", icon: Clock },
  ];

  return (
    <html lang="en">
      <body className="relative min-h-screen">
        {/* Background */}
        <div
          className="fixed inset-0 z-[-1] bg-cover bg-center"
          style={{ backgroundImage: `url('/images/bg.jpg')` }}
        />

        <QueryClientProvider client={queryClient}>
          <div className="relative z-10">{children}</div>

          {/* Desktop Menubar */}
          <Menubar className="hidden sm:flex fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl px-6 py-7 space-x-6 z-50">
            {menuItems.map((item, index) => (
              <MenubarMenu key={index}>
                <MenubarTrigger asChild>
                  <Link
                    href={item.href}
                    className="flex flex-col items-center px-4 py-2 rounded-xl transition-colors duration-300 hover:bg-pink-500 hover:text-white"
                  >
                    <item.icon className="w-6 h-6 mb-1" />
                    <span className="text-sm sm:text-base font-bold">
                      {item.label}
                    </span>
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>
            ))}
          </Menubar>

          {/* Mobile Menu */}
          <div className="sm:hidden fixed top-6 left-6 z-50">
            <Sheet>
              <SheetTrigger className="bg-white/90 backdrop-blur-md shadow-xl p-4 rounded-full">
                <Menu className="h-8 w-8 text-pink-600" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-white/95 backdrop-blur-lg"
              >
                <div className="flex flex-col space-y-4">
                  {menuItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center space-x-2 px-6 py-4 rounded-lg transition-colors duration-300 hover:bg-pink-500 hover:text-white text-lg sm:text-xl font-bold"
                    >
                      <item.icon className="w-6 h-6" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
