// app/addmusic/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react"; // <-- Lucide icon

const AddMusicPage = () => {
  const [songName, setSongName] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songFile, setSongFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songName || !songArtist || !songFile) {
      setMessage("Please fill in all fields");
      return;
    }

    const formData = new FormData();
    formData.append("songName", songName);
    formData.append("songArtist", songArtist);
    formData.append("songFile", songFile);

    try {
      setUploading(true);
      await axios.post("http://localhost:5000/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Music uploaded successfully!");
      setSongName("");
      setSongArtist("");
      setSongFile(null);

      setTimeout(() => router.push("/playlist"), 10000);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload music.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            🎵 Add New Music
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 text-center text-green-600 font-medium">
              {message}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <Label htmlFor="songName" className="font-semibold text-lg">
                Song Name
              </Label>
              <Input
                id="songName"
                type="text"
                placeholder="Enter song name"
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="songArtist" className="font-semibold text-lg">
                Song Artist
              </Label>
              <Input
                id="songArtist"
                type="text"
                placeholder="Enter artist name"
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="songFile" className="font-semibold text-lg">
                Upload File
              </Label>
              <label
                htmlFor="songFile"
                className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:bg-gray-100 transition"
              >
                <Upload className="w-6 h-6 text-gray-500" />
                {songFile
                  ? songFile.name
                  : "Click to select or drag file (.mp3)"}
              </label>
              <Input
                id="songFile"
                type="file"
                accept=".mp3"
                className="hidden"
                onChange={(e) =>
                  setSongFile(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="mt-2 bg-pink-500 text-lg text-white hover:bg-black"
            >
              {uploading ? "Uploading..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMusicPage;
