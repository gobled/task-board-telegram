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
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playsLeft, setPlaysLeft] = useState<number>(3);
  const [shareBonusClaimed, setShareBonusClaimed] = useState<boolean>(false);

  useEffect(() => {
    try {
      setLaunchParams(retrieveLaunchParams());
    } catch (error) {
      console.warn("Unable to retrieve launch params outside Telegram.", error);
    }

    // Load high score from localStorage
    const savedHighScore = localStorage.getItem("fruitNinjaHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    // Load mute preference from localStorage
    const savedMutePreference = localStorage.getItem("fruitNinjaMuted");
    if (savedMutePreference) {
      setIsMuted(savedMutePreference === "true");
    }

    // Initialize remaining plays (default 3 on first load)
    const savedPlays = localStorage.getItem("fruitNinjaPlaysLeft");
    if (savedPlays === null) {
      localStorage.setItem("fruitNinjaPlaysLeft", "3");
      setPlaysLeft(3);
    } else {
      const parsed = parseInt(savedPlays, 10);
      setPlaysLeft(Number.isNaN(parsed) ? 3 : parsed);
    }

    const savedShare = localStorage.getItem("fruitNinjaShareBonusClaimed");
    if (savedShare) {
      setShareBonusClaimed(savedShare === "true");
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

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem("fruitNinjaMuted", newMuteState.toString());
    if (webApp) {
      webApp.HapticFeedback?.impactOccurred("soft");
    }
  };

  const handlePlay = () => {
    if (playsLeft <= 0) {
      if (webApp?.showAlert) {
        webApp.showAlert("No plays left. Please come back later.");
      }
      return;
    }
    if (webApp) {
      webApp.expand();
      webApp.HapticFeedback?.impactOccurred("medium");
    }
    // Consume a play when starting from the main screen
    setPlaysLeft((prev) => {
      const next = Math.max(prev - 1, 0);
      localStorage.setItem("fruitNinjaPlaysLeft", String(next));
      return next;
    });
    setIsPlaying(true);
  };

  const handleGameOver = (finalScore: number) => {
    if (webApp) {
      webApp.HapticFeedback?.notificationOccurred("success");
    }
    // Return to the main screen so there is only one main view
    setIsPlaying(false);
  };

  const handleShareForPlay = async () => {
    const botUsername = process.env.BOT_USERNAME;
    if (!webApp) {
      console.log("Share tapped outside Telegram");
      return;
    }
    if (!botUsername) {
      webApp?.showAlert?.('Sharing unavailable: bot username is not configured. Set BOT_USERNAME.');
      return;
    }

    const text = 'Join me in Pika Splash! Tap to play our Telegram Mini App.';
    // Use startapp deep link so recipients add/open the bot Mini App directly
    const startappPayload = user?.id ? `invite_${user.id}` : 'play';
    const miniAppLink = `https://t.me/${botUsername}?startapp=${encodeURIComponent(startappPayload)}`;
    const tgShare = `https://t.me/share/url?url=${encodeURIComponent(miniAppLink)}&text=${encodeURIComponent(text)}`;

    try {
      if (webApp && typeof webApp.openTelegramLink === 'function') {
        webApp.openTelegramLink(tgShare);
      } else if (typeof window !== 'undefined') {
        // Fallback: try opening Telegram share link directly
        window.open(tgShare, '_blank');
      }
    } catch (e) {
      // Ignore share errors; user may still share manually
    }

    if (!shareBonusClaimed) {
      setPlaysLeft((prev) => {
        const next = prev + 1;
        localStorage.setItem("fruitNinjaPlaysLeft", String(next));
        return next;
      });
      setShareBonusClaimed(true);
      localStorage.setItem("fruitNinjaShareBonusClaimed", "true");
      webApp?.HapticFeedback?.impactOccurred("soft");
      webApp?.showPopup?.({ title: 'Bonus Unlocked', message: 'Thanks for sharing! You got +1 play.', buttons: [{ type: 'close', text: 'Great' }] });
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
    return (
      <FruitNinja
        onGameOver={handleGameOver}
        onBack={() => setIsPlaying(false)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black px-6 py-12 text-slate-100" style={{ overflowY: 'auto', overscrollBehavior: 'none' }}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur" style={{ touchAction: 'pan-y' }}>
        <h1 className="text-4xl font-bold text-white mb-2">Pika Splash</h1>
        <p className="text-slate-400">Slice the fruits, avoid the bombs!</p>
        <p className="mt-2 mb-8 text-sm text-slate-300">
          Welcome, {fullName}{username ? ` (${username})` : ''}
        </p>

        {/* High Score Display */}
        {highScore > 0 && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4">
            <p className="text-xs text-emerald-400">High Score</p>
            <p className="text-3xl font-bold text-emerald-400">{highScore}</p>
          </div>
        )}

        {/* Plays Left */}
        <div className="mb-4">
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200 border border-white/10">
            Plays left: {playsLeft}
          </span>
        </div>

        {/* Mute Button */}
        <div className="mb-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-lg bg-black/50 px-6 py-3 backdrop-blur transition hover:bg-black/70 border border-white/10"
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            <span className="text-2xl">
              {isMuted ? "🔇" : "🔊"}
            </span>
            <p className="text-xs text-slate-300 mt-1">
              {isMuted ? "Muted" : "Sound On"}
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={handlePlay}
          disabled={playsLeft <= 0}
          className={`mt-2 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-lg font-semibold text-white shadow-lg transition focus:outline-none focus-visible:ring-2 ${
            playsLeft > 0
              ? "bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-400 focus-visible:ring-emerald-300"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          {playsLeft > 0 ? "Play" : "No plays left"}
        </button>

        <button
          type="button"
          onClick={handleShareForPlay}
          className={`mt-3 inline-flex w-full items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition border ${
            !shareBonusClaimed
              ? 'bg-blue-500/90 text-white border-blue-400 hover:bg-blue-500'
              : 'bg-blue-600/70 text-white border-blue-500 hover:bg-blue-600'
          }`}
        >
          {shareBonusClaimed ? 'Share in Telegram (bonus claimed)' : 'Share in Telegram for +1 play'}
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
