"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import axios from "axios";
import { useScheduleStore } from "@/store/scheduleStore";

const fetchActiveSchedule = async () => {
  const res = await axios.get("http://localhost:5000/schedules/active");
  return res.data;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Zustand store: local copy of active schedule
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const lastActiveIdRef = useRef<number | null>(null);

  // Mark as mounted
  useEffect(() => setMounted(true), []);

  // Sync Zustand store after mount
  useEffect(() => {
    if (!mounted) return;

    const unsub = useScheduleStore.subscribe(
      (state) => state.activeSchedule,
      (value) => setActiveSchedule(value)
    );

    return () => unsub();
  }, [mounted]);

  // Clock updater every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(async () => {
      const now = new Date();
      console.log(
        `[Frontend][${now.toLocaleString()}] Polling active schedule...`
      );

      try {
        const data = await fetchActiveSchedule();
        const active = data.active ? data.schedule : null;

        if (active?.id !== lastActiveIdRef.current) {
          if (active) {
            console.log(
              `[Frontend][${now.toLocaleString()}] Schedule "${
                active.scheduleName
              }" STARTED, navigating to /playlist`
            );
          } else if (lastActiveIdRef.current) {
            console.log(
              `[Frontend][${now.toLocaleString()}] Previous schedule ENDED, navigating back to /`
            );
          }

          lastActiveIdRef.current = active?.id || null;
          useScheduleStore.getState().setActiveSchedule(active);

          const currentPath = window.location.pathname;
          if (active && currentPath !== "/playlist") router.push("/playlist");
          else if (!active && currentPath === "/playlist") router.push("/");
        }
      } catch (err) {
        console.error(`[Frontend][${now.toLocaleString()}] Fetch error:`, err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mounted, router]);

  // Navigate safely after store updates
  useEffect(() => {
    if (!mounted) return;

    const currentPath = window.location.pathname;

    if (activeSchedule && currentPath !== "/playlist") {
      router.push("/playlist");
    } else if (!activeSchedule && currentPath === "/playlist") {
      router.push("/");
    }
  }, [activeSchedule, mounted, router]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <Card className="mb-8 bg-black bg-opacity-30 backdrop-blur-md shadow-2xl rounded-2xl p-6 text-center w-[90%] sm:w-[400px]">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">
            {currentTime.toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl sm:text-3xl font-semibold text-white">
            {currentTime.toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
