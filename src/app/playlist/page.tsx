"use client";

import { global } from "styled-jsx/css";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Song {
  songName: string;
  songArtist: string;
  songSrc: string;
  songAvatar?: string;
}

const PlaylistPage = () => {
  const [musicAPI, setMusicAPI] = useState<Song[]>([]);
  const [currentMusicDetails, setCurrentMusicDetails] = useState<Song>({
    songName: "",
    songArtist: "",
    songSrc: "",
    songAvatar: "/images/profiles.png",
  });
  const [scheduledPlaylist, setScheduledPlaylist] = useState<Song[]>([]);
  const [scheduledSongIndex, setScheduledSongIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [musicIndex, setMusicIndex] = useState(0);
  const [musicTotalLength, setMusicTotalLength] = useState("00 : 00");
  const [musicCurrentTime, setMusicCurrentTime] = useState("00 : 00");
  const [avatarClassIndex, setAvatarClassIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [pausedScheduledDetails, setPausedScheduledDetails] =
    useState<Song | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const router = useRouter();
  const currentAudio = useRef<HTMLAudioElement>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedTimestampRef = useRef<number>(Date.now());
  const isScheduledPlaying = useRef(false);

  const avatarClass = ["object-cover", "object-contain", "none"];

  // Fetch songs
  useEffect(() => {
    axios
      .get("http://localhost:5000/songs-list")
      .then((res) => {
        setMusicAPI(res.data);
        if (res.data.length > 0 && !isScheduledPlaying.current) {
          const firstSong = res.data[0];
          setCurrentMusicDetails(firstSong);
          if (currentAudio.current) {
            currentAudio.current.src = `http://localhost:5000${firstSong.songSrc}`;
            currentAudio.current.load();
          }
        }
      })
      .catch((err) => console.error("Failed to fetch songs:", err));
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle audio progress
  const handleMusicProgressBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = currentAudio.current;
    if (!audio) return;
    setAudioProgress(Number(e.target.value));
    audio.currentTime = (Number(e.target.value) * audio.duration) / 100;
  };

  const handleAvatar = () => {
    setAvatarClassIndex((prev) => (prev + 1) % avatarClass.length);
  };

  const handleAudioPlay = () => {
    const audio = currentAudio.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setIsAudioPlaying(true);
      lastPlayedTimestampRef.current = Date.now();
    } else {
      audio.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleNextSong = () => {
    const nextIndex = (musicIndex + 1) % musicAPI.length;
    setMusicIndex(nextIndex);
    updateCurrentMusicDetails(nextIndex);
  };

  const handlePrevSong = () => {
    const prevIndex = (musicIndex - 1 + musicAPI.length) % musicAPI.length;
    setMusicIndex(prevIndex);
    updateCurrentMusicDetails(prevIndex);
  };

  const updateCurrentMusicDetails = (index: number) => {
    const music = musicAPI[index];
    if (!music) return;

    setCurrentMusicDetails(music);
    if (currentAudio.current) {
      currentAudio.current.src = `http://localhost:5000${music.songSrc}`;
      currentAudio.current.load();
      currentAudio.current.play();
      setIsAudioPlaying(true);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 text-white font-poppins relative">
      {/* Audio element */}
      <audio
        ref={currentAudio}
        onEnded={handleNextSong}
        onTimeUpdate={() => {
          const audio = currentAudio.current;
          if (!audio) return;
          const duration = audio.duration || 0;
          const current = audio.currentTime || 0;
          setMusicTotalLength(
            `${Math.floor(duration / 60)
              .toString()
              .padStart(2, "0")} : ${Math.floor(duration % 60)
              .toString()
              .padStart(2, "0")}`
          );
          setMusicCurrentTime(
            `${Math.floor(current / 60)
              .toString()
              .padStart(2, "0")} : ${Math.floor(current % 60)
              .toString()
              .padStart(2, "0")}`
          );
          setAudioProgress((current / duration) * 100);
        }}
      />

      {/* Date/Time */}
      <div className="date-time-display fixed top-5 right-5 flex flex-col items-end gap-1 bg-black bg-opacity-40 px-3 py-2 rounded-xl text-sm z-50">
        <span>{currentTime.toLocaleDateString()}</span>
        <span>{currentTime.toLocaleTimeString()}</span>
      </div>

      {/* Music Player */}
      <div className="music-Container bg-black bg-opacity-30 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center w-full max-w-md text-center shadow-lg">
        <p className="text-gray-300 mb-2 font-semibold">Music Player</p>
        <p className="text-xl font-semibold">{currentMusicDetails.songName}</p>
        <p className="text-gray-400">{currentMusicDetails.songArtist}</p>
        <Image
          src={currentMusicDetails.songAvatar || "/images/profiles.png"}
          alt="song Avatar"
          width={200}
          height={200}
          className={`rounded-full cursor-pointer animate-pulseAvatar ${avatarClass[avatarClassIndex]}`}
          onClick={handleAvatar}
        />

        <div className="musicTimerDiv w-full flex justify-between mt-2 font-semibold">
          <p>{musicCurrentTime}</p>
          <p>{musicTotalLength}</p>
        </div>
        <input
          type="range"
          value={audioProgress}
          onChange={handleMusicProgressBar}
          className="w-full h-2 rounded-lg mt-2 accent-pink-500"
        />
        <div className="flex items-center justify-center gap-6 mt-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevSong}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition"
          >
            <span className="text-white text-xl select-none">◀</span>
          </button>

          {/* Play / Pause Button */}
          <button
            onClick={handleAudioPlay}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white bg-pink-500 hover:bg-pink-600 transition"
          >
            <span className="text-white text-2xl select-none">
              {isAudioPlaying ? "⏸" : "▶"}
            </span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNextSong}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-40 transition"
          >
            <span className="text-white text-xl select-none">▶</span>
          </button>
        </div>

        <Button
          className="mt-4 bg-pink-500 hover:bg-pink-600 rounded-full text-xl font-semibold"
          onClick={() => setIsModalOpen(true)}
        >
          {isOverrideMode ? "Resume Scheduled Music" : "Override Music"}
        </Button>
      </div>

      {/* Override Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white w-full p-6">
          <DialogHeader>
            <DialogTitle>Select Override Music</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mt-2">
            {musicAPI.map((song, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start text-lg font-semibold hover:bg-pink-500 hover:text-white"
                onClick={() => {
                  setCurrentMusicDetails(song);
                  setIsOverrideMode(true);
                  setIsModalOpen(false);
                }}
              >
                {song.songName} - {song.songArtist}
              </Button>
            ))}
          </div>
          <Button
            className="mt-4 hover:bg-black hover:text-white font-bold text-xl"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistPage;
