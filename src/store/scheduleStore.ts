"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Song {
  songName: string;
  songArtist: string;
  songSrc: string;
  songAvatar: string;
}

interface Schedule {
  id: number;
  scheduleName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  playlist: Song[];
}

interface ScheduleState {
  activeSchedule: Schedule | null;
  setActiveSchedule: (schedule: Schedule | null) => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      activeSchedule: null,
      setActiveSchedule: (schedule) => set({ activeSchedule: schedule }),
    }),
    {
      name: "schedule-storage",
      getStorage: () => (typeof window !== "undefined" ? localStorage : undefined),
    }
  )
);
