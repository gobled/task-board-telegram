"use client";

import { useEffect, useMemo, useState } from "react";
import { retrieveLaunchParams, type LaunchParams } from "@telegram-apps/sdk";
import type { WebApp } from "telegram-web-app";
import { getTelegramWebApp } from "@/app/lib/telegram";
import FruitNinja from "@/app/components/FruitNinja";

export default function HomePage() {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [launchParams, setLaunchParams] = useState<LaunchParams | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    try {
      setLaunchParams(retrieveLaunchParams());
    } catch (error) {
      console.warn("Unable to retrieve launch params outside Telegram.", error);
    }
  }, []);

  useEffect(() => {
    // Prevent pull-to-refresh and overscroll
    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches.length > 1) return;

      const target = e.target as HTMLElement;
      const scrollY = window.scrollY || window.pageYOffset;

      if (scrollY === 0 && e.touches[0].clientY > e.touches[0].pageY) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  useEffect(() => {
    // Wait for Telegram WebApp script to load
    const initTelegram = () => {
      const tg = getTelegramWebApp();
      if (!tg) {
        return;
      }

      tg.ready();
      tg.expand();

      // Request fullscreen mode
      if (tg.requestFullscreen) {
        try {
          tg.requestFullscreen();
        } catch (error) {
          console.warn("Failed to enter fullscreen mode:", error);
        }
      }

      // Enable close confirmation (optional)
      tg.enableClosingConfirmation();

      // Lock orientation to portrait for mobile
      if (tg.lockOrientation) {
        tg.lockOrientation();
      }

      setWebApp(tg);
    };

    // Try immediately
    initTelegram();

    // Also try after a short delay in case script is still loading
    const timer = setTimeout(initTelegram, 100);

    return () => clearTimeout(timer);
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
    if (webApp) {
      webApp.expand();
      webApp.HapticFeedback?.impactOccurred("medium");
    }
    setIsPlaying(true);
  };

  const handleGameOver = (finalScore: number) => {
    if (webApp) {
      webApp.HapticFeedback?.notificationOccurred("success");
    }
  };

  const handleBuySticker = async () => {
    if (!webApp) {
      console.log("Buy Sticker tapped outside Telegram");
      return;
    }

    if (!user?.id) {
      webApp.showAlert("We could not determine your Telegram account. Please try again.");
      return;
    }

    try {
      webApp.HapticFeedback?.impactOccurred("soft");
      const response = await fetch("/api/payments/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "sticker", userId: user.id }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = typeof errorBody?.error === "string" ? errorBody.error : "Unable to start purchase.";
        throw new Error(message);
      }

      const data = (await response.json()) as { invoiceUrl?: string };
      if (!data.invoiceUrl) {
        throw new Error("Invoice URL missing in response.");
      }

      webApp.openInvoice(data.invoiceUrl, (status) => {
        if (status === "paid") {
          webApp.showPopup?.({
            title: "Thanks!",
            message: "Sticker pack purchase confirmed. Check the chat for details.",
            buttons: [{ type: "close", text: "Close" }],
          });
        } else if (status === "failed") {
          webApp.showAlert("Payment failed. Please try again.");
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      if (webApp.showAlert) {
        webApp.showAlert(message);
      } else {
        console.error("Sticker purchase error:", error);
      }
    }
  };

  if (isPlaying) {
    return <FruitNinja onGameOver={handleGameOver} onBack={() => setIsPlaying(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-12 text-slate-100" style={{ overflowY: 'auto', overscrollBehavior: 'none' }}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur" style={{ touchAction: 'pan-y' }}>
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
        {/* <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-400">Limited Drop</p>
              <p className="text-lg font-semibold text-white">Task Board Sticker Pack</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-emerald-300">
              10 Stars
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Grab a holographic sticker trio to celebrate your Task Board progress. Tap buy to
            trigger the in-chat Stars payment flow.
          </p>
          <button
            type="button"
            onClick={handleBuySticker}
            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Buy Sticker Pack 1
          </button>
        </div> */}

        {!webApp && (
          <p className="mt-6 text-xs text-amber-300">
            Open this Mini App inside Telegram to access the full experience.
          </p>
        )}
      </div>
    </div>
  );
}
