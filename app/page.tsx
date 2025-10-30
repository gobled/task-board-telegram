"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ThemeParams, WebApp } from "telegram-web-app";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { getTelegramWebApp } from "@/app/lib/telegram";

type LogTone = "info" | "success" | "error";
type LogEntry = {
  id: number;
  message: string;
  tone: LogTone;
  timestamp: string;
};

type FeatureCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

type SecondaryPosition = "left" | "right" | "top" | "bottom";

function FeatureCard({ title, description, children }: FeatureCardProps) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur transition dark:border-white/10 dark:bg-slate-900/70">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </header>
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
        {children}
      </div>
    </section>
  );
}

const buttonBase =
  "inline-flex items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  buttonBase +
  " bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:ring-emerald-300";
const secondaryButton =
  buttonBase +
  " bg-transparent text-emerald-500 ring-1 ring-emerald-400/60 hover:bg-emerald-50/70 dark:text-emerald-300 dark:hover:bg-emerald-300/10";

const inputClasses =
  "w-full rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100";

const codeClasses =
  "rounded-lg border border-black/10 bg-black/5 px-3 py-2 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-200";

const themeColor = (params: ThemeParams | null, key: keyof ThemeParams) => {
  const value = params?.[key];
  if (!value || typeof value !== "string" || !value.startsWith("#")) {
    return undefined;
  }
  return value;
};

export default function HomePage() {
  const launchParams = useLaunchParams();
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [colorScheme, setColorScheme] = useState<WebApp["colorScheme"]>("light");
  const [themeParams, setThemeParams] = useState<ThemeParams | null>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [closingConfirmation, setClosingConfirmation] = useState(false);
  const [backButtonVisible, setBackButtonVisible] = useState(false);
  const [secondaryButtonConfig, setSecondaryButtonConfig] = useState({
    text: "Open docs",
    position: "right" as SecondaryPosition,
    isVisible: false,
  });
  const [mainButtonConfig, setMainButtonConfig] = useState({
    text: "Main button demo",
    color: "#2ca57a",
    textColor: "#ffffff",
    hasShineEffect: true,
    isVisible: true,
    isEnabled: true,
  });
  const [mainButtonBusy, setMainButtonBusy] = useState(false);
  const [cloudKey, setCloudKey] = useState("demo_key");
  const [cloudValue, setCloudValue] = useState("");
  const [cloudReadValue, setCloudReadValue] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [biometricStatus, setBiometricStatus] = useState("Not initialised");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const addLog = useCallback(
    (message: string, tone: LogTone = "info") => {
      setLogEntries((prev) => {
        const entry: LogEntry = {
          id: Date.now(),
          message,
          tone,
          timestamp: new Date().toLocaleTimeString(),
        };
        return [...prev.slice(-19), entry];
      });
    },
    [],
  );

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg) {
      return;
    }

    tg.ready();
    tg.expand();

    setWebApp(tg);
    setColorScheme(tg.colorScheme);
    setThemeParams({ ...tg.themeParams });
    setViewportHeight(Math.round(tg.viewportHeight));
    setClosingConfirmation(tg.isClosingConfirmationEnabled);
    setBackButtonVisible(tg.BackButton?.isVisible ?? false);

    const handleThemeChange = () => {
      setColorScheme(tg.colorScheme);
      setThemeParams({ ...tg.themeParams });
      addLog(`Theme changed to ${tg.colorScheme}`);
    };

    const handleViewport = () => {
      setViewportHeight(Math.round(tg.viewportHeight));
    };

    tg.onEvent("themeChanged", handleThemeChange);
    tg.onEvent("viewportChanged", handleViewport);

    return () => {
      tg.offEvent("themeChanged", handleThemeChange);
      tg.offEvent("viewportChanged", handleViewport);
    };
  }, [addLog]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    const handleBack = () => {
      addLog("Back button pressed");
      webApp.HapticFeedback?.impactOccurred("soft");
      webApp.showAlert("Back button callback triggered.");
    };

    webApp.BackButton.onClick(handleBack);
    return () => {
      webApp.BackButton.offClick(handleBack);
      webApp.BackButton.hide();
    };
  }, [webApp, addLog]);

  const backgroundColor = useMemo(() => {
    return (
      themeColor(themeParams, "secondary_bg_color") ??
      themeColor(themeParams, "bg_color") ??
      (colorScheme === "dark" ? "#0f172a" : "#f8fafc")
    );
  }, [colorScheme, themeParams]);

  const foregroundColor = useMemo(() => {
    return (
      themeColor(themeParams, "text_color") ??
      (colorScheme === "dark" ? "#e2e8f0" : "#0f172a")
    );
  }, [colorScheme, themeParams]);

  const chipClasses =
    "inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:border-emerald-300/40 dark:bg-emerald-300/10 dark:text-emerald-200";

  const isTelegramEnv = Boolean(webApp);

  const handleToggleBackButton = () => {
    if (!webApp) {
      addLog("Telegram WebApp context missing", "error");
      return;
    }

    if (backButtonVisible) {
      webApp.BackButton.hide();
      setBackButtonVisible(false);
      addLog("Back button hidden");
    } else {
      webApp.BackButton.show();
      setBackButtonVisible(true);
      addLog("Back button shown");
    }
  };

  const handleToggleClosingConfirmation = () => {
    if (!webApp) {
      addLog("Telegram WebApp context missing", "error");
      return;
    }

    if (closingConfirmation) {
      webApp.disableClosingConfirmation();
      setClosingConfirmation(false);
      addLog("Closing confirmation disabled");
    } else {
      webApp.enableClosingConfirmation();
      setClosingConfirmation(true);
      addLog("Closing confirmation enabled");
    }
  };

  const handleSetHeaderColor = (variant: "bg" | "secondary") => {
    if (!webApp) {
      addLog("Telegram WebApp context missing", "error");
      return;
    }

    const value = variant === "bg" ? "bg_color" : "secondary_bg_color";
    webApp.setHeaderColor(value);
    addLog(`Header color -> ${value}`, "success");
  };

  const handleMainButtonConfigChange = <T,>(
    key: keyof typeof mainButtonConfig,
    value: T,
  ) => {
    setMainButtonConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSecondaryButtonConfigChange = <T,>(
    key: keyof typeof secondaryButtonConfig,
    value: T,
  ) => {
    setSecondaryButtonConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleCloudSave = () => {
    if (!webApp) {
      addLog("Cloud storage works only inside Telegram", "error");
      return;
    }

    if (!cloudKey.trim()) {
      addLog("Provide a key for cloud storage", "error");
      return;
    }

    webApp.CloudStorage.setItem(cloudKey.trim(), cloudValue, (err) => {
      if (err) {
        addLog(`CloudStorage error: ${err}`, "error");
        return;
      }
      addLog(`Saved value for ${cloudKey.trim()}`, "success");
    });
  };

  const handleCloudLoad = () => {
    if (!webApp) {
      addLog("Cloud storage works only inside Telegram", "error");
      return;
    }

    if (!cloudKey.trim()) {
      addLog("Provide a key for cloud storage", "error");
      return;
    }

    webApp.CloudStorage.getItem(cloudKey.trim(), (err, value) => {
      if (err) {
        addLog(`CloudStorage error: ${err}`, "error");
        setCloudReadValue(null);
        return;
      }

      if (typeof value === "string") {
        setCloudReadValue(value);
        addLog(`Loaded value for ${cloudKey.trim()}`, "success");
      } else {
        setCloudReadValue(null);
        addLog("No value stored for that key");
      }
    });
  };

  const handleTriggerPopup = () => {
    if (!webApp) {
      addLog("Native popups require Telegram context", "error");
      return;
    }

    webApp.showPopup(
      {
        title: "Native popup",
        message: "Buttons below are native Telegram UI.",
        buttons: [
          { type: "default", id: "docs", text: "Docs" },
          { type: "destructive", id: "close", text: "Close" },
        ],
      },
      (buttonId) => {
        addLog(`Popup closed via ${buttonId}`);
        if (buttonId === "docs") {
          webApp.openTelegramLink("https://core.telegram.org/bots/webapps");
        }
      },
    );
  };

  const handleScanQr = () => {
    if (!webApp) {
      addLog("QR scanner requires Telegram context", "error");
      return;
    }

    if (!webApp.isVersionAtLeast("6.4")) {
      addLog("QR scanner needs Telegram 6.4+", "error");
      return;
    }

    webApp.showScanQrPopup({ text: "Scan any QR code" }, (data) => {
      setQrResult(data);
      addLog(`QR result: ${data}`, "success");
      webApp.closeScanQrPopup();
    });
  };

  const handleHaptic = (type: "light" | "medium" | "heavy" | "rigid" | "soft") => {
    if (!webApp) {
      addLog("Haptic feedback requires Telegram context", "error");
      return;
    }

    webApp.HapticFeedback?.impactOccurred(type);
    addLog(`Impact haptic: ${type}`);
  };

  const handleHapticNotification = (
    type: "success" | "warning" | "error",
  ) => {
    if (!webApp) {
      addLog("Haptic feedback requires Telegram context", "error");
      return;
    }

    webApp.HapticFeedback?.notificationOccurred(type);
    addLog(`Notification haptic: ${type}`);
  };

  const handleBiometricInit = () => {
    if (!webApp?.BiometricManager) {
      addLog("Biometrics not supported on this device", "error");
      return;
    }

    webApp.BiometricManager.init(() => {
      const manager = webApp.BiometricManager;
      setBiometricStatus(
        manager.isBiometricAvailable
          ? `Available: ${manager.biometricType}`
          : "Biometrics unavailable",
      );
      addLog("Biometric manager initialised", "success");
    });
  };

  const handleBiometricAuth = () => {
    if (!webApp?.BiometricManager) {
      addLog("Biometrics not supported on this device", "error");
      return;
    }

    webApp.BiometricManager.authenticate(
      {
        reason: "Demo authentication",
      },
      (success, token) => {
        if (success) {
          addLog("Biometric authentication success", "success");
          setBiometricStatus(`Authenticated. Token: ${token ?? ""}`);
        } else {
          addLog("Biometric authentication failed or cancelled", "error");
        }
      },
    );
  };

  useEffect(() => {
    if (!webApp?.BiometricManager) {
      return;
    }

    const manager = webApp.BiometricManager;
    setBiometricStatus(
      manager.isBiometricAvailable
        ? `Available: ${manager.biometricType}`
        : "Biometrics unavailable",
    );
  }, [webApp]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    webApp.SecondaryButton.setParams({
      text: secondaryButtonConfig.text,
      position: secondaryButtonConfig.position,
      is_visible: secondaryButtonConfig.isVisible,
    });

    if (secondaryButtonConfig.isVisible) {
      webApp.SecondaryButton.show();
    } else {
      webApp.SecondaryButton.hide();
    }
  }, [webApp, secondaryButtonConfig]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    const handleSecondary = () => {
      addLog("Secondary button click");
      webApp.HapticFeedback?.selectionChanged();
      webApp.openTelegramLink("https://core.telegram.org/bots/webapps");
    };

    webApp.onEvent("secondaryButtonClicked", handleSecondary);
    return () => {
      webApp.offEvent("secondaryButtonClicked", handleSecondary);
    };
  }, [webApp, addLog]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    webApp.MainButton.setParams({
      text: mainButtonConfig.text,
      color: mainButtonConfig.color,
      text_color: mainButtonConfig.textColor,
      has_shine_effect: mainButtonConfig.hasShineEffect,
      is_visible: mainButtonConfig.isVisible,
      is_active: mainButtonConfig.isEnabled,
    });

    if (mainButtonConfig.isVisible) {
      webApp.MainButton.show();
    } else {
      webApp.MainButton.hide();
    }
  }, [webApp, mainButtonConfig]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    const handleClick = () => {
      addLog("Main button click", "success");
      webApp.HapticFeedback?.impactOccurred("medium");
      setMainButtonBusy(true);
      webApp.MainButton.showProgress();
      setTimeout(() => {
        webApp.MainButton.hideProgress();
        setMainButtonBusy(false);
        addLog("Demo action completed", "success");
      }, 1000);
    };

    webApp.MainButton.onClick(handleClick);
    return () => {
      webApp.MainButton.offClick(handleClick);
      webApp.MainButton.hideProgress();
    };
  }, [webApp, addLog]);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor,
        color: foregroundColor,
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 md:py-12 lg:py-16">
        <header className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-8 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className={chipClasses}>Telegram Mini App demo</span>
            <span className={chipClasses}>
              {isTelegramEnv ? "Inside Telegram" : "Preview mode"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold md:text-3xl">
              Recommended WebApp features in one place
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Trigger the buttons below to exercise the native capabilities Telegram recommends for
              Mini Apps.
            </p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">
                Platform
              </dt>
              <dd className="text-slate-600 dark:text-slate-300">
                {webApp?.platform ?? "Outside Telegram"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">
                Bot API version
              </dt>
              <dd className="text-slate-600 dark:text-slate-300">
                {webApp?.version ?? "Unknown"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">
                Color scheme
              </dt>
              <dd className="text-slate-600 dark:text-slate-300">{colorScheme}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">
                Viewport height
              </dt>
              <dd className="text-slate-600 dark:text-slate-300">
                {viewportHeight ? `${viewportHeight}px` : "Not available"}
              </dd>
            </div>
          </dl>
        </header>

        {!isTelegramEnv && (
          <p className="text-sm text-amber-600 dark:text-amber-300">
            Open this page from the bot inside Telegram to activate the native APIs.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            title="Launch data & theme"
            description="Inspect launch payload and the live Telegram palette."
          >
            <div className="space-y-2">
              <p>Start parameter: {launchParams?.startParam ?? "—"}</p>
              <p>User: {launchParams?.initData?.user?.firstName ?? "—"}</p>
              <p>Chat type: {launchParams?.initData?.chat?.type ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Theme palette</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ["bg_color", themeParams?.bg_color],
                  ["secondary_bg_color", themeParams?.secondary_bg_color],
                  ["button_color", themeParams?.button_color],
                  ["button_text_color", themeParams?.button_text_color],
                  ["accent_text_color", themeParams?.accent_text_color],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-900/60"
                    >
                      <span className="font-semibold">{key}</span>
                      <span className="font-mono">{value}</span>
                      <span
                        aria-hidden
                        className="h-5 w-5 rounded-full border border-black/10 dark:border-white/10"
                        style={{ backgroundColor: value as string }}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => handleSetHeaderColor("bg")}
                disabled={!isTelegramEnv}
              >
                Header → bg_color
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => handleSetHeaderColor("secondary")}
                disabled={!isTelegramEnv}
              >
                Header → secondary_bg
              </button>
            </div>
            <pre className={codeClasses}>
              {JSON.stringify(launchParams ?? {}, null, 2)}
            </pre>
          </FeatureCard>

          <FeatureCard
            title="Main button"
            description="Apply text, colours, shine and async loader."
          >
            <div className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Button text
                <input
                  className={`${inputClasses} mt-1`}
                  value={mainButtonConfig.text}
                  onChange={(event) =>
                    handleMainButtonConfigChange("text", event.target.value)
                  }
                  placeholder="Main button demo"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide">
                  Color
                  <input
                    className={`${inputClasses} mt-1`}
                    value={mainButtonConfig.color}
                    onChange={(event) =>
                      handleMainButtonConfigChange("color", event.target.value)
                    }
                    placeholder="#2ca57a"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide">
                  Text colour
                  <input
                    className={`${inputClasses} mt-1`}
                    value={mainButtonConfig.textColor}
                    onChange={(event) =>
                      handleMainButtonConfigChange("textColor", event.target.value)
                    }
                    placeholder="#ffffff"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() =>
                    handleMainButtonConfigChange(
                      "hasShineEffect",
                      !mainButtonConfig.hasShineEffect,
                    )
                  }
                  disabled={!isTelegramEnv}
                >
                  Shine: {mainButtonConfig.hasShineEffect ? "on" : "off"}
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() =>
                    handleMainButtonConfigChange(
                      "isVisible",
                      !mainButtonConfig.isVisible,
                    )
                  }
                  disabled={!isTelegramEnv}
                >
                  {mainButtonConfig.isVisible ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() =>
                    handleMainButtonConfigChange(
                      "isEnabled",
                      !mainButtonConfig.isEnabled,
                    )
                  }
                  disabled={!isTelegramEnv}
                >
                  {mainButtonConfig.isEnabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => {
                    if (!isTelegramEnv) {
                      addLog("Main button requires Telegram context", "error");
                      return;
                    }
                    setMainButtonBusy(true);
                    webApp?.MainButton.showProgress();
                    setTimeout(() => {
                      webApp?.MainButton.hideProgress();
                      setMainButtonBusy(false);
                    }, 900);
                  }}
                  disabled={!isTelegramEnv || mainButtonBusy}
                >
                  Show loader
                </button>
              </div>
            </div>
          </FeatureCard>

          <FeatureCard
            title="Back & secondary buttons"
            description="Use Telegram chrome for navigation shortcuts."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButton}
                onClick={handleToggleBackButton}
                disabled={!isTelegramEnv}
              >
                {backButtonVisible ? "Hide back button" : "Show back button"}
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() =>
                  handleSecondaryButtonConfigChange(
                    "isVisible",
                    !secondaryButtonConfig.isVisible,
                  )
                }
                disabled={!isTelegramEnv}
              >
                {secondaryButtonConfig.isVisible ? "Hide secondary" : "Show secondary"}
              </button>
            </div>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Secondary text
              <input
                className={`${inputClasses} mt-1`}
                value={secondaryButtonConfig.text}
                onChange={(event) =>
                  handleSecondaryButtonConfigChange("text", event.target.value)
                }
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Position
              <select
                className={`${inputClasses} mt-1`}
                value={secondaryButtonConfig.position}
                onChange={(event) =>
                  handleSecondaryButtonConfigChange(
                    "position",
                    event.target.value as SecondaryPosition,
                  )
                }
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
              </select>
            </label>
          </FeatureCard>

          <FeatureCard
            title="Popups & QR scanner"
            description="Open alert, confirm or scan codes with native UI."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButton}
                onClick={handleTriggerPopup}
                disabled={!isTelegramEnv}
              >
                Show popup
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  if (!webApp) {
                    addLog("Alerts require Telegram context", "error");
                    return;
                  }
                  webApp.showConfirm("Do you like these APIs?", (ok) => {
                    addLog(`Confirm result: ${ok}`, ok ? "success" : "info");
                  });
                }}
                disabled={!isTelegramEnv}
              >
                Show confirm
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  if (!webApp) {
                    addLog("Alerts require Telegram context", "error");
                    return;
                  }
                  webApp.showAlert("Hello from native alert!");
                }}
                disabled={!isTelegramEnv}
              >
                Show alert
              </button>
            </div>
            <button
              type="button"
              className={primaryButton}
              onClick={handleScanQr}
              disabled={!isTelegramEnv}
            >
              Open QR scanner
            </button>
            <p>
              Last result:{" "}
              <span className="break-words font-mono text-xs">{qrResult ?? "—"}</span>
            </p>
          </FeatureCard>

          <FeatureCard
            title="Viewport & closing"
            description="Manage safe areas, swipes and exit confirmation."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={handleToggleClosingConfirmation}
                disabled={!isTelegramEnv}
              >
                {closingConfirmation ? "Disable confirmation" : "Enable confirmation"}
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  if (!webApp) {
                    addLog("Viewport controls require Telegram context", "error");
                    return;
                  }
                  webApp.expand();
                  addLog("Requested viewport expansion");
                }}
                disabled={!isTelegramEnv}
              >
                Expand viewport
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  if (!webApp) {
                    addLog("Swipe controls require Telegram context", "error");
                    return;
                  }
                  if (webApp.isVerticalSwipesEnabled) {
                    webApp.disableVerticalSwipes();
                    addLog("Vertical swipes disabled");
                  } else {
                    webApp.enableVerticalSwipes();
                    addLog("Vertical swipes enabled");
                  }
                }}
                disabled={!isTelegramEnv}
              >
                Toggle swipes
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p>
                Safe area:{" "}
                {webApp
                  ? `${webApp.safeAreaInset.top}/${webApp.safeAreaInset.right}/${webApp.safeAreaInset.bottom}/${webApp.safeAreaInset.left}`
                  : "—"}
              </p>
              <p>
                Content safe area:{" "}
                {webApp
                  ? `${webApp.contentSafeAreaInset.top}/${webApp.contentSafeAreaInset.right}/${webApp.contentSafeAreaInset.bottom}/${webApp.contentSafeAreaInset.left}`
                  : "—"}
              </p>
            </div>
          </FeatureCard>

          <FeatureCard
            title="Cloud storage"
            description="Persist small payloads in Telegram CloudStorage."
          >
            <label className="text-xs font-semibold uppercase tracking-wide">
              Key
              <input
                className={`${inputClasses} mt-1`}
                value={cloudKey}
                onChange={(event) => setCloudKey(event.target.value)}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide">
              Value
              <textarea
                className={`${inputClasses} mt-1 min-h-[100px] resize-y`}
                value={cloudValue}
                onChange={(event) => setCloudValue(event.target.value)}
                placeholder="Type content to save…"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButton}
                onClick={handleCloudSave}
                disabled={!isTelegramEnv}
              >
                Save
              </button>
              <button
                type="button"
                className={secondaryButton}
                onClick={handleCloudLoad}
                disabled={!isTelegramEnv}
              >
                Load
              </button>
            </div>
            <p className="break-words text-xs text-slate-600 dark:text-slate-300">
              Loaded value:{" "}
              {cloudReadValue !== null ? (
                <span className="font-mono">{cloudReadValue}</span>
              ) : (
                "—"
              )}
            </p>
          </FeatureCard>

          <FeatureCard
            title="Haptic feedback"
            description="Trigger tactile feedback patterns."
          >
            <div className="flex flex-wrap gap-3">
              {["light", "medium", "heavy", "rigid", "soft"].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={secondaryButton}
                  onClick={() => handleHaptic(level as Parameters<typeof handleHaptic>[0])}
                  disabled={!isTelegramEnv}
                >
                  Impact {level}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {["success", "warning", "error"].map((notif) => (
                <button
                  key={notif}
                  type="button"
                  className={secondaryButton}
                  onClick={() =>
                    handleHapticNotification(
                      notif as Parameters<typeof handleHapticNotification>[0],
                    )
                  }
                  disabled={!isTelegramEnv}
                >
                  Notify {notif}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                if (!webApp) {
                  addLog("Haptic feedback requires Telegram context", "error");
                  return;
                }
                webApp.HapticFeedback?.selectionChanged();
                addLog("Selection haptic");
              }}
              disabled={!isTelegramEnv}
            >
              Selection change
            </button>
          </FeatureCard>

          <FeatureCard
            title="Biometric manager"
            description="Request biometric auth when available."
          >
            <p>{biometricStatus}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={handleBiometricInit}
                disabled={!isTelegramEnv}
              >
                Init
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={handleBiometricAuth}
                disabled={!isTelegramEnv}
              >
                Authenticate
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Gracefully falls back when biometrics are missing.
            </p>
          </FeatureCard>

          <FeatureCard
            title="Event log"
            description="Recent actions captured by the demo."
          >
            <ul className="space-y-2 text-xs">
              {logEntries.length === 0 && <li>No events yet.</li>}
              {logEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-black/10 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60"
                >
                  <div>
                    <p
                      className={
                        entry.tone === "success"
                          ? "font-medium text-emerald-600 dark:text-emerald-300"
                          : entry.tone === "error"
                            ? "font-medium text-rose-600 dark:text-rose-300"
                            : "font-medium"
                      }
                    >
                      {entry.message}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-slate-500 dark:text-slate-300">
                    {entry.timestamp}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setLogEntries([])}
            >
              Clear log
            </button>
          </FeatureCard>
        </div>
      </div>
    </div>
  );
}
