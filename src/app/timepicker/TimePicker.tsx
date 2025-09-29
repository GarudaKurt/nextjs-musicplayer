"use client";
import { useState, useEffect, useRef } from "react";

interface TimePickerProps {
  value: string; // format "HH:MM:SS"
  onChange: (val: string) => void;
}

const TimePicker = ({ value, onChange }: TimePickerProps) => {
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const initialized = useRef(false);

  // Initialize only once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (value) {
      let [h, m, s] = value.split(":");
      let hourNum = parseInt(h, 10);

      if (hourNum >= 12) {
        setPeriod("PM");
        if (hourNum > 12) hourNum -= 12;
      } else {
        setPeriod("AM");
        if (hourNum === 0) hourNum = 12;
      }

      setHours(hourNum.toString().padStart(2, "0"));
      setMinutes(m);
      setSeconds(s || "00");
    } else {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();

      if (h >= 12) {
        setPeriod("PM");
        if (h > 12) h -= 12;
      } else {
        setPeriod("AM");
        if (h === 0) h = 12;
      }

      setHours(h.toString().padStart(2, "0"));
      setMinutes(m.toString().padStart(2, "0"));
      setSeconds(s.toString().padStart(2, "0"));
    }
  }, [value]);

  // Update parent whenever local state changes
  useEffect(() => {
    let hourNum = parseInt(hours, 10);
    if (period === "PM" && hourNum < 12) hourNum += 12;
    if (period === "AM" && hourNum === 12) hourNum = 0;

    const hourStr = hourNum.toString().padStart(2, "0");
    onChange(`${hourStr}:${minutes}:${seconds}`);
  }, [hours, minutes, seconds, period, onChange]);

  return (
    <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 w-full">
      {/* Hours */}
      <select
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className="border rounded p-2 flex-1"
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const val = (i + 1).toString().padStart(2, "0");
          return (
            <option key={val} value={val}>
              {val} h
            </option>
          );
        })}
      </select>

      {/* Minutes */}
      <select
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        className="border rounded p-2 flex-1"
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const val = i.toString().padStart(2, "0");
          return (
            <option key={val} value={val}>
              {val} m
            </option>
          );
        })}
      </select>

      {/* Seconds */}
      <select
        value={seconds}
        onChange={(e) => setSeconds(e.target.value)}
        className="border rounded p-2 flex-1"
      >
        {Array.from({ length: 60 }).map((_, i) => {
          const val = i.toString().padStart(2, "0");
          return (
            <option key={val} value={val}>
              {val} s
            </option>
          );
        })}
      </select>

      {/* AM/PM */}
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
        className="border rounded p-2 flex-1"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

export default TimePicker;
