"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  occurrences?: { date: string; startTime: string; endTime: string }[];
}

const SchedulesMusic = () => {
  const [scheduledPlaylist, setScheduledPlaylist] = useState<Schedule[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availableMusics, setAvailableMusics] = useState<Song[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState<number | null>(null);
  const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const getWeekRange = (offset: number) => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday };
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get<Schedule[]>(
        "http://localhost:5000/schedules"
      );
      const { monday, sunday } = getWeekRange(weekOffset);

      const filtered = res.data.filter((schedule) => {
        const start = new Date(schedule.startDate);
        const end = new Date(schedule.endDate);
        return start <= sunday && end >= monday;
      });

      const sorted = filtered.sort(
        (a, b) =>
          new Date(`${a.startDate}T${a.startTime}`).getTime() -
          new Date(`${b.startDate}T${b.startTime}`).getTime()
      );

      setScheduledPlaylist(sorted);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [weekOffset]);

  const handleEdit = async (schedule: Schedule) => {
    try {
      const res = await axios.get<Song[]>("http://localhost:5000/songs-list");
      setAvailableMusics(res.data);
      setSelectedSchedule(schedule);
      setSelectedSongs(schedule.playlist);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error("Error loading songs:", err);
    }
  };

  const toggleSongSelection = (song: Song) => {
    setSelectedSongs((prev) =>
      prev.some((s) => s.songSrc === song.songSrc)
        ? prev.filter((s) => s.songSrc !== song.songSrc)
        : [...prev, song]
    );
  };

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      const updatedSchedule = { ...selectedSchedule, playlist: selectedSongs };
      await axios.put(
        `http://localhost:5000/schedules/${selectedSchedule.id}`,
        updatedSchedule
      );
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      setSelectedSongs([]);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to update schedule:", err);
    }
  };

  const confirmDelete = (schedule: Schedule) => {
    setDeleteScheduleId(schedule.id);
    setSelectedSchedule(schedule);
    setSelectedSongs([]);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async (
    mode: "all" | "selected" | "occurrence",
    deleteAll = false
  ) => {
    try {
      let url = `http://localhost:5000/schedules/${
        deleteAll ? "all" : deleteScheduleId
      }?mode=${mode}`;
      await axios.delete(url);
      fetchSchedules();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteScheduleId(null);
      setSelectedSongs([]);
    }
  };

  const { monday, sunday } = getWeekRange(weekOffset);
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="p-6 w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">
          Scheduled Music
        </h2>

        <div className="flex justify-between items-center mb-4">
          <Button
            className="bg-blue-500 text-white rounded-full hover:bg-black"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            ← Previous
          </Button>
          <span className="text-white">
            Week of {formatDate(monday)} to {formatDate(sunday)}
          </span>
          <Button
            className="bg-pink-500 rounded-full hover:bg-black text-white"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            Next →
          </Button>
        </div>

        <div className="space-y-4">
          {scheduledPlaylist.length === 0 ? (
            <p className="text-white font-semibold text-xl text-center">
              No scheduled music for this week.
            </p>
          ) : (
            scheduledPlaylist.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-gray-800 p-4 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-semibold">
                    {schedule.scheduleName}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(schedule)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-white">
                  <strong>Date:</strong> {schedule.startDate} -{" "}
                  {schedule.endDate}
                </p>
                <p className="text-white">
                  <strong>Time:</strong> {schedule.startTime} -{" "}
                  {schedule.endTime}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {schedule.playlist.map((song, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-700 p-2 rounded flex items-center gap-2"
                    >
                      <img
                        src={song.songAvatar}
                        alt="avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-white text-center">
                        <p className="font-medium">{song.songName}</p>
                        <p className="text-sm">{song.songArtist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modals remain the same */}
      </div>
    </div>
  );
};

export default SchedulesMusic;
