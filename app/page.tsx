"use client";

import { useEffect, useMemo, useState } from "react";
import { retrieveLaunchParams, type LaunchParams } from "@telegram-apps/sdk";
import type { WebApp } from "telegram-web-app";
import { getTelegramWebApp } from "@/app/lib/telegram";

export default function HomePage() {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [launchParams, setLaunchParams] = useState<LaunchParams | null>(null);

  useEffect(() => {
    try {
      setLaunchParams(retrieveLaunchParams());
    } catch (error) {
      console.warn("Unable to retrieve launch params outside Telegram.", error);
    }
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) {
      return;
    }

    tg.ready();
    tg.expand();

    // Request fullscreen mode
    if (tg.requestFullscreen) {
      tg.requestFullscreen();
    }

    // Enable close confirmation (optional)
    tg.enableClosingConfirmation();

    setWebApp(tg);
  }, []);

  const user = launchParams?.initData?.user;
  const fullName = useMemo(() => {
    if (!user) {
      return "Guest";
    }
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }, [user]);

  const username = user?.username ? `@${user.username}` : null;

  const handlePlay = () => {
    if (!webApp) {
      console.log("Play tapped");
      return;
    }

    webApp.expand();
    webApp.HapticFeedback?.impactOccurred("medium");
    webApp.showAlert("Launching the game!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {fullName}</h1>
        {username && (
          <p className="mt-2 text-sm text-slate-300">
            {username}
          </p>
        )}
        {user?.id && (
          <p className="mt-1 text-xs text-slate-400">
            ID: {user.id}
          </p>
        )}

        <button
          type="button"
          onClick={handlePlay}
          className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Play
        </button>

        {!webApp && (
          <p className="mt-6 text-xs text-amber-300">
            Open this Mini App inside Telegram to access the full experience.
          </p>
        )}
      </div>
    </div>
  );
}
