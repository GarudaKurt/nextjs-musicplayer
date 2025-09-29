"use client";

import { useEffect, useState } from "react";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { Menu } from "lucide-react";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Date & Time Card */}
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
