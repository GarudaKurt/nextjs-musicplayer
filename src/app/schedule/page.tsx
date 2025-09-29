"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import TimePicker from "../timepicker/TimePicker";

interface Song {
  songName: string;
  songArtist: string;
  songSrc: string;
}

const SchedulePage = () => {
  const router = useRouter();

  const [scheduleName, setScheduleName] = useState("");
  const [startDateValue, setStartDateValue] = useState<Date | undefined>();
  const [endDateValue, setEndDateValue] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [saving, setSaving] = useState(false);
  const [songDurations, setSongDurations] = useState<Record<string, string>>(
    {}
  );
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatType, setRepeatType] = useState<"none" | "weekly" | "monthly">(
    "none"
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [availableMusics, setAvailableMusics] = useState<Song[]>([]);
  const [message, setMessage] = useState("");

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds || isNaN(seconds)) return "N/A";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${min}:${sec}`;
  };

  const fetchAvailableMusics = async () => {
    try {
      const res = await axios.get<Song[]>("http://localhost:5000/songs-list");
      const songs = res.data;
      setAvailableMusics(songs);

      const durations: Record<string, string> = {};
      const promises = songs.map(
        (song) =>
          new Promise<void>((resolve) => {
            const audio = new Audio(`http://localhost:5000${song.songSrc}`);
            audio.addEventListener("loadedmetadata", () => {
              durations[song.songSrc] = formatDuration(audio.duration);
              resolve();
            });
            audio.addEventListener("error", () => {
              durations[song.songSrc] = "N/A";
              resolve();
            });
          })
      );

      await Promise.all(promises);
      setSongDurations(durations);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setMessage("Failed to fetch songs.");
    }
  };

  const toggleSongSelection = (song: Song) => {
    const exists = selectedSongs.find((s) => s.songSrc === song.songSrc);
    if (exists) {
      setSelectedSongs(selectedSongs.filter((s) => s.songSrc !== song.songSrc));
    } else {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const openModal = () => {
    fetchAvailableMusics();
    setShowModal(true);
  };

  const handleDeleteSong = async (song: Song) => {
    if (!confirm(`Are you sure you want to delete "${song.songName}"?`)) return;

    try {
      const filename = song.songSrc.split("/").pop();
      await axios.delete(`http://localhost:5000/songs/${filename}`);
      setAvailableMusics((prev) =>
        prev.filter((s) => s.songSrc !== song.songSrc)
      );
      setSelectedSongs((prev) =>
        prev.filter((s) => s.songSrc !== song.songSrc)
      );
      setMessage(`🗑️ Deleted: ${song.songName}`);
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("Failed to delete song.");
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => router.push("/"), 30000);
    };

    ["mousemove", "keydown", "mousedown", "touchstart"].forEach((event) =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer();

    return () => {
      ["mousemove", "keydown", "mousedown", "touchstart"].forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [router]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !scheduleName ||
      !startDateValue ||
      !endDateValue ||
      !startTime ||
      !endTime ||
      selectedSongs.length === 0
    ) {
      setMessage("⚠️ Please fill in all fields and select at least one music");
      return;
    }

    try {
      setSaving(true);

      const schedulePayload = {
        scheduleName,
        startDate: format(startDateValue, "yyyy-MM-dd"),
        endDate: format(endDateValue, "yyyy-MM-dd"),
        startTime,
        endTime,
        songs: selectedSongs,
        repeatType,
        weekdays: repeatType === "weekly" ? selectedDays : [],
        monthDates: repeatType === "monthly" ? selectedDates : [],
      };

      await axios.post("http://localhost:5000/schedules", schedulePayload, {
        headers: { "Content-Type": "application/json" },
      });

      setMessage("Schedule saved successfully!");
      setScheduleName("");
      setStartDateValue(undefined);
      setEndDateValue(undefined);
      setStartTime("");
      setEndTime("");
      setSelectedSongs([]);
      setSelectedDays([]);
      setSelectedDates([]);
      setRepeatType("none");

      setTimeout(() => router.push("/"), 5000);
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.response?.status === 409) {
        setMessage("⚠️ Schedule conflict: overlaps with an existing schedule.");
      } else {
        setMessage("Failed to save schedule.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl p-4 sm:p-6 bg-white shadow-lg rounded-lg overflow-auto max-h-[70vh]">
        <h2 className="text-2xl font-bold mb-6 text-center">
          ⏰ Schedule Music
        </h2>

        {message && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-4 text-center">
            {message}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleScheduleSubmit}>
          {/* Schedule Name */}
          <div className="flex flex-col">
            <Label htmlFor="scheduleName" className="text-lg font-semibold">
              Schedule Name
            </Label>
            <Input
              id="scheduleName"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Dates & Times Card */}
          <div className="bg-white shadow rounded-lg p-6 flex flex-col space-y-6">
            <div className="flex flex-col">
              <Label htmlFor="startTime" className="text-lg font-semibold">
                Start Time
              </Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="endTime" className="text-lg font-semibold">
                End Time
              </Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>

            {/* Date Inputs using Shadcn Calendar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col">
                <Label className="text-lg font-semibold">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {startDateValue
                        ? format(startDateValue, "PPP")
                        : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      className="bg-white"
                      mode="single"
                      selected={startDateValue}
                      onSelect={setStartDateValue}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col">
                <Label className="text-lg font-semibold">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-left">
                      {endDateValue
                        ? format(endDateValue, "PPP")
                        : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      className="bg-white"
                      mode="single"
                      selected={endDateValue}
                      onSelect={setEndDateValue}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Repeat Section */}
          <div className="flex flex-col">
            <Label className="text-lg font-semibold">Repeat</Label>
            <select
              className="border bg-white rounded p-2 w-full"
              value={repeatType}
              onChange={(e) => {
                const val = e.target.value as "none" | "weekly" | "monthly";
                setRepeatType(val);
                setShowRepeatModal(val !== "none");
              }}
            >
              <option value="none">No Repeat</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Music Selection Button */}
          <Button
            type="button"
            onClick={openModal}
            className="bg-green-500 text-white hover:bg-black font-semibold text-lg"
          >
            {selectedSongs.length > 0
              ? `🎵 ${selectedSongs.length} song(s) selected`
              : "Select Music"}
          </Button>

          {/* Submit Button */}
          <Button
            type="submit"
            className="text-lg font-semibold bg-blue-500 hover:bg-black text-white"
            disabled={saving}
          >
            {saving ? "Saving..." : "Set Schedule"}
          </Button>
        </form>
        {/* Repeat Modal */}
        <Dialog open={showRepeatModal} onOpenChange={setShowRepeatModal}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Repeat Schedule</DialogTitle>
            </DialogHeader>

            {repeatType === "weekly" && (
              <div className="flex flex-wrap gap-2 mt-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <label key={day} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() =>
                          setSelectedDays((prev) =>
                            prev.includes(day)
                              ? prev.filter((d) => d !== day)
                              : [...prev, day]
                          )
                        }
                      />
                      {day}
                    </label>
                  )
                )}
              </div>
            )}

            {repeatType === "monthly" && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[...Array(31)].map((_, i) => {
                  const day = i + 1;
                  return (
                    <label key={day} className="flex items-center gap-1 w-10">
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(day)}
                        onChange={() =>
                          setSelectedDates((prev) =>
                            prev.includes(day)
                              ? prev.filter((d) => d !== day)
                              : [...prev, day]
                          )
                        }
                      />
                      {day}
                    </label>
                  );
                })}
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                className="bg-black text-white font-semibold text-md hover:bg-blue-300"
                onClick={() => setShowRepeatModal(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Music Selection Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-xl bg-white">
            <DialogHeader>
              <DialogTitle>Select Music Files</DialogTitle>
            </DialogHeader>

            <ul className="space-y-2 mt-2 p-2 bg-white rounded">
              {availableMusics.map((song) => (
                <li
                  key={song.songSrc}
                  className="flex justify-between items-center hover:bg-gray-300 p-2 rounded"
                >
                  <label className="flex items-center gap-2 bg-white w-full">
                    <input
                      type="checkbox"
                      checked={selectedSongs.some(
                        (s) => s.songSrc === song.songSrc
                      )}
                      onChange={() => toggleSongSelection(song)}
                    />
                    <span>
                      🎵 {song.songName} — <em>{song.songArtist}</em>
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({songDurations[song.songSrc] || "..."} )
                    </span>
                  </label>

                  <button
                    onClick={() => handleDeleteSong(song)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>

            <DialogFooter className="mt-4 bg-white">
              <Button
                className="bg-black text-white hover:bg-black-500"
                onClick={() => setShowModal(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SchedulePage;
