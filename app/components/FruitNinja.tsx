"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import * as PIXI from "pixi.js";
import { createFruitSprite as createFruitSpriteModular, fruitColors as fruitColorsModular, type FruitType } from "./fruits";

// Ensure Pixi has the ticker plugin so app.ticker is defined in v8 builds
if (!PIXI.Application._plugins?.includes?.(PIXI.TickerPlugin)) {
  PIXI.extensions.add(PIXI.TickerPlugin);
}

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: FruitType;
  sliced: boolean;
  sliceTime?: number;
  width: number;
  height: number;
  sprite?: PIXI.Graphics;
  particles?: PIXI.Graphics[];
}

interface SliceTrail {
  x: number;
  y: number;
  time: number;
}

export default function FruitNinja({
  onGameOver,
  onBack
}: {
  onGameOver?: (score: number) => void;
  onBack?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isMuted, setIsMuted] = useState(false);
  const [gameStarted, setGameStarted] = useState(true); // Auto-start game
  const [lastScore, setLastScore] = useState(0);

  const appRef = useRef<PIXI.Application | null>(null);
  const fruitsRef = useRef<Fruit[]>([]);
  const sliceTrailRef = useRef<SliceTrail[]>([]);
  const sliceGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isSlicingRef = useRef(false);
  const lastSpawnTimeRef = useRef(Date.now());
  const scoreRef = useRef(score);
  const highScoreRef = useRef(highScore);
  const timeLeftRef = useRef(timeLeft);
  const gameOverRef = useRef(gameOver);
  const livesRef = useRef(lives);
  const onGameOverRef = useRef(onGameOver);
  const gameStartedRef = useRef(true); // Initialize as true to match auto-start
  const isMutedRef = useRef(isMuted);

  // Sound effects using Howler.js
  const soundsRef = useRef<{
    splatter: Howl | null;
    boom: Howl | null;
    over: Howl | null;
    start: Howl | null;
  }>({
    splatter: null,
    boom: null,
    over: null,
    start: null,
  });

  const fruitTypes: Array<Exclude<FruitType, "bomb">> = [
    "apple",
    "banana",
    "peach",
    "strawberry",
    "watermelon",
  ];

  const fruitColors = fruitColorsModular;

  useEffect(() => {
    const savedHighScore = localStorage.getItem("fruitNinjaHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    // Load mute preference
    const savedMutePreference = localStorage.getItem("fruitNinjaMuted");
    if (savedMutePreference) {
      const muteValue = savedMutePreference === "true";
      setIsMuted(muteValue);
      isMutedRef.current = muteValue; // Initialize ref with saved value
    }

    // Initialize sound effects with Howler.js
    try {
      soundsRef.current.splatter = new Howl({
        src: ['/assets/sounds/splatter.mp3'],
        volume: 0.6,
        preload: true,
      });

      soundsRef.current.boom = new Howl({
        src: ['/assets/sounds/boom.mp3'],
        volume: 0.6,
        preload: true,
      });

      soundsRef.current.over = new Howl({
        src: ['/assets/sounds/over.mp3'],
        volume: 0.6,
        preload: true,
      });

      soundsRef.current.start = new Howl({
        src: ['/assets/sounds/start.mp3'],
        volume: 0.6,
        preload: true,
      });
    } catch (error) {
      console.warn('Could not load sound effects:', error);
    }
  }, []);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Play sound effect using Howler
  const playSound = (sound: 'splatter' | 'boom' | 'over' | 'start') => {
    if (isMutedRef.current) return; // Don't play if muted
    try {
      const howl = soundsRef.current[sound];
      if (howl) {
        howl.play();
      }
    } catch (error) {
      // Silently fail if sounds don't work
    }
  };

  // Don't play start sound on auto-start (it will play when user manually restarts)

  // Timer countdown
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (gameOverRef.current) {
          return prev;
        }

        if (prev <= 1) {
          setLastScore(scoreRef.current);
          setGameOver(true);
          gameOverRef.current = true;
          setGameStarted(false);
          gameStartedRef.current = false;
          playSound('over');
          if (scoreRef.current > highScoreRef.current) {
            setHighScore(scoreRef.current);
            highScoreRef.current = scoreRef.current;
            localStorage.setItem("fruitNinjaHighScore", scoreRef.current.toString());
          }
          onGameOverRef.current?.(scoreRef.current);
          timeLeftRef.current = 0;
          return 0;
        }

        const next = prev - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameOver, gameStarted]);

  // Create fruit sprite using modular components
  const createFruitSprite = (fruit: Fruit): PIXI.Graphics => {
    return createFruitSpriteModular(fruit.type, fruit.width, fruit.height);
  };

  // Create explosion particles
  const createExplosionParticles = (fruit: Fruit, app: PIXI.Application): PIXI.Graphics[] => {
    const particles: PIXI.Graphics[] = [];
    const colors = fruitColors[fruit.type];
    const particleCount = fruit.type === "bomb" ? 20 : 10;

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();

      if (fruit.type === "bomb") {
        // Explosion particles
        particle.beginFill(0xFF6400, 0.8);
        particle.drawCircle(0, 0, Math.random() * 8 + 4);
        particle.endFill();
      } else {
        // Fruit juice particles
        particle.beginFill(colors.main);
        particle.drawCircle(0, 0, Math.random() * 5 + 2);
        particle.endFill();
      }

      particle.x = fruit.x;
      particle.y = fruit.y;

      // Random velocity for particles
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      (particle as any).vx = Math.cos(angle) * speed;
      (particle as any).vy = Math.sin(angle) * speed;
      (particle as any).life = 1.0;

      app.stage.addChild(particle);
      particles.push(particle);
    }

    return particles;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let canvas: HTMLCanvasElement | null = null;
    let destroyed = false;

    // Create PixiJS Application
    const app = new PIXI.Application();
    let gridGraphics: PIXI.Graphics | null = null;
    let tickerFn: (() => void) | null = null;

    app
      .init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1e293b,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        if (destroyed || !containerRef.current || !app.canvas) {
          app.destroy(true, { children: true });
          return;
        }

        appRef.current = app;
        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
        canvas = app.canvas as HTMLCanvasElement;

        const sliceGraphics = new PIXI.Graphics();
        app.stage.addChild(sliceGraphics);
        sliceGraphicsRef.current = sliceGraphics;

        startGameLoop();

        canvas.addEventListener("mousedown", handlePointerDown);
        canvas.addEventListener("mousemove", handlePointerMove);
        canvas.addEventListener("mouseup", handlePointerUp);
        canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
        canvas.addEventListener("touchmove", handlePointerMove, { passive: false });
        canvas.addEventListener("touchend", handlePointerUp, { passive: false });
      })
      .catch((error) => {
        console.error("Failed to initialize PixiJS application:", error);
      });

    // Spawn single fruit or bomb
    const spawnSingleFruit = (bombChance: number, offsetX: number = 0) => {
      const isBomb = Math.random() < bombChance;
      const type = isBomb ? "bomb" : fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
      const x = Math.random() * (app.screen.width - 200) + 100 + offsetX;
      const y = app.screen.height + 50;
      const vx = (Math.random() - 0.5) * 8;
      const vy = -(Math.random() * 8 + 18);
      const rotationSpeed = (Math.random() - 0.5) * 0.05;

      const fruit: Fruit = {
        x,
        y,
        vx,
        vy,
        rotation: 0,
        rotationSpeed,
        type,
        sliced: false,
        width: 80,
        height: 80,
      };

      fruit.sprite = createFruitSprite(fruit);
      fruit.sprite.x = fruit.x;
      fruit.sprite.y = fruit.y;
      fruit.sprite.rotation = fruit.rotation;
      app.stage.addChild(fruit.sprite);

      fruitsRef.current.push(fruit);
    };

    // Spawn fruit or bomb
    const spawnFruit = () => {
      const timeElapsed = 60 - timeLeftRef.current;
      let bombChance = 0.15;
      let burstChance = 0.2;

      if (timeElapsed > 45) {
        bombChance = 0.35;
        burstChance = 0.6;
      } else if (timeElapsed > 30) {
        bombChance = 0.28;
        burstChance = 0.5;
      } else if (timeElapsed > 15) {
        bombChance = 0.22;
        burstChance = 0.35;
      }

      const shouldBurst = Math.random() < burstChance;

      if (shouldBurst) {
        const burstCount = Math.floor(Math.random() * 3) + 2;
        const spacing = app.screen.width / (burstCount + 1);

        for (let i = 0; i < burstCount; i++) {
          const offsetX = (i - burstCount / 2) * spacing * 0.3;
          spawnSingleFruit(bombChance, offsetX);
        }
      } else {
        spawnSingleFruit(bombChance);
      }
    };

    // Check if fruit is sliced by trail
    const checkSlice = (fruit: Fruit) => {
      if (fruit.sliced || sliceTrailRef.current.length < 2) return false;

      for (let i = 0; i < sliceTrailRef.current.length; i++) {
        const point = sliceTrailRef.current[i];
        const dx = point.x - fruit.x;
        const dy = point.y - fruit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < fruit.width / 2) {
          return true;
        }
      }
      return false;
    };

    const startGameLoop = () => {
      if (!app.ticker) {
        console.error("Pixi ticker is not available after initialization.");
        return;
      }

      const tick = () => {
        if (gameOverRef.current) return;

        // Draw grid background using shared graphics
        if (!gridGraphics) {
          gridGraphics = new PIXI.Graphics();
          app.stage.addChildAt(gridGraphics, 0);
        }
        gridGraphics.clear();
        gridGraphics.lineStyle(1, 0x334155, 0.5);
        for (let i = 0; i < app.screen.width; i += 50) {
          gridGraphics.moveTo(i, 0);
          gridGraphics.lineTo(i, app.screen.height);
        }
        for (let i = 0; i < app.screen.height; i += 50) {
          gridGraphics.moveTo(0, i);
          gridGraphics.lineTo(app.screen.width, i);
        }

        // Only spawn new fruits if game has started
        if (gameStartedRef.current) {
          const now = Date.now();
          const timeElapsed = 60 - timeLeftRef.current;

          let spawnInterval = 1200;
          if (timeElapsed > 45) {
            spawnInterval = 600;
          } else if (timeElapsed > 30) {
            spawnInterval = 800;
          } else if (timeElapsed > 15) {
            spawnInterval = 1000;
          }

          if (now - lastSpawnTimeRef.current > spawnInterval) {
            spawnFruit();
            lastSpawnTimeRef.current = now;
          }
        }

        // Update and render fruits
        const currentTime = Date.now();
        for (let i = fruitsRef.current.length - 1; i >= 0; i--) {
          const fruit = fruitsRef.current[i];

          if (!fruit.sliced) {
            // Apply gravity
            fruit.vy += 0.5;
            fruit.x += fruit.vx;
            fruit.y += fruit.vy;
            fruit.rotation += fruit.rotationSpeed;

            const sprite = fruit.sprite;
            if (sprite && !sprite.destroyed) {
              sprite.x = fruit.x;
              sprite.y = fruit.y;
              sprite.rotation = fruit.rotation;
            } else if (sprite?.destroyed) {
              fruit.sprite = undefined;
            }

            // Check for slicing
            if (checkSlice(fruit)) {
              fruit.sliced = true;
              fruit.sliceTime = currentTime;

              // Create explosion particles
              fruit.particles = createExplosionParticles(fruit, app);

              // Remove sprite
              if (fruit.sprite) {
                app.stage.removeChild(fruit.sprite);
                fruit.sprite.destroy();
                fruit.sprite = undefined;
              }

              if (fruit.type === "bomb") {
                playSound('boom');
                setLives((prev) => {
                  const newLives = Math.max(prev - 1, 0);
                  if (newLives <= 0) {
                    setLastScore(scoreRef.current);
                    setGameOver(true);
                    gameOverRef.current = true;
                    setGameStarted(false);
                    gameStartedRef.current = false;
                    playSound('over');
                    if (scoreRef.current > highScoreRef.current) {
                      setHighScore(scoreRef.current);
                      highScoreRef.current = scoreRef.current;
                      localStorage.setItem("fruitNinjaHighScore", scoreRef.current.toString());
                    }
                    onGameOverRef.current?.(scoreRef.current);
                  }
                  livesRef.current = newLives;
                  return newLives;
                });
              } else {
                playSound('splatter');
                setScore((prev) => {
                  const next = prev + 10;
                  scoreRef.current = next;
                  return next;
                });
              }
            }

            // Remove if off screen
            if (fruit.y > app.screen.height + 100) {
              if (fruit.sprite) {
                app.stage.removeChild(fruit.sprite);
                fruit.sprite.destroy();
                fruit.sprite = undefined;
              }
              fruitsRef.current.splice(i, 1);
              continue;
            }
          } else if (fruit.sliceTime) {
            // Update particles
            const elapsed = currentTime - fruit.sliceTime;

            if (fruit.particles) {
              for (let j = fruit.particles.length - 1; j >= 0; j--) {
                const particle = fruit.particles[j];
                (particle as any).vy += 0.3; // gravity
                particle.x += (particle as any).vx;
                particle.y += (particle as any).vy;

                (particle as any).life -= 0.02;
                particle.alpha = (particle as any).life;

                if ((particle as any).life <= 0) {
                  app.stage.removeChild(particle);
                  particle.destroy();
                  fruit.particles.splice(j, 1);
                }
              }
            }

            if (elapsed > 1000) {
              fruitsRef.current.splice(i, 1);
            }
          }
        }

        // Draw slice trail using filled circles (guaranteed to work)
        if (sliceGraphicsRef.current && sliceTrailRef.current.length > 0) {
          sliceGraphicsRef.current.clear();

          // Bring trail to front so it's always visible
          app.stage.setChildIndex(sliceGraphicsRef.current, app.stage.children.length - 1);

          // Draw trail as connected circles
          for (let i = 0; i < sliceTrailRef.current.length; i++) {
            const point = sliceTrailRef.current[i];
            const age = currentTime - point.time;
            const maxAge = 300;

            if (age < maxAge) {
              const opacity = 1 - (age / maxAge);

              // Outer glow (yellow)
              sliceGraphicsRef.current.beginFill(0xFFFF00, opacity * 0.4);
              sliceGraphicsRef.current.drawCircle(point.x, point.y, 12);
              sliceGraphicsRef.current.endFill();

              // Middle glow (cyan)
              sliceGraphicsRef.current.beginFill(0x00FFFF, opacity * 0.7);
              sliceGraphicsRef.current.drawCircle(point.x, point.y, 8);
              sliceGraphicsRef.current.endFill();

              // Core (white)
              sliceGraphicsRef.current.beginFill(0xFFFFFF, opacity);
              sliceGraphicsRef.current.drawCircle(point.x, point.y, 4);
              sliceGraphicsRef.current.endFill();
            }
          }

          // Remove old trail points
          sliceTrailRef.current = sliceTrailRef.current.filter(
            (point) => currentTime - point.time < 300
          );
        }
      };

      tickerFn = tick;
      app.ticker.add(tick);
    };

    // Mouse/touch event handlers
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isSlicingRef.current = true;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      mousePositionRef.current = { x, y };
      sliceTrailRef.current = [{ x, y, time: Date.now() }];
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      mousePositionRef.current = { x, y };

      if (isSlicingRef.current) {
        sliceTrailRef.current.push({ x, y, time: Date.now() });
        if (sliceTrailRef.current.length > 30) {
          sliceTrailRef.current.shift();
        }
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isSlicingRef.current = false;
    };

    return () => {
      destroyed = true;

      if (canvas) {
        canvas.removeEventListener("mousedown", handlePointerDown);
        canvas.removeEventListener("mousemove", handlePointerMove);
        canvas.removeEventListener("mouseup", handlePointerUp);
        canvas.removeEventListener("touchstart", handlePointerDown);
        canvas.removeEventListener("touchmove", handlePointerMove);
        canvas.removeEventListener("touchend", handlePointerUp);
        if (canvas.parentElement) {
          canvas.parentElement.removeChild(canvas);
        }
        canvas = null;
      }

      if (tickerFn && app.ticker) {
        app.ticker.remove(tickerFn);
        tickerFn = null;
      }

      if (gridGraphics) {
        app.stage.removeChild(gridGraphics);
        gridGraphics.destroy();
        gridGraphics = null;
      }

      sliceGraphicsRef.current = null;
      const currentApp = appRef.current;
      appRef.current = null;

      if (currentApp) {
        currentApp.destroy(true, { children: true });
      }
    };
  }, []);

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    isMutedRef.current = newMuteState; // Update ref immediately
    localStorage.setItem("fruitNinjaMuted", newMuteState.toString());
  };

  const handleStartOrRestart = () => {
    // Play start sound when manually restarting
    playSound('start');

    scoreRef.current = 0;
    livesRef.current = 3;
    gameOverRef.current = false;
    timeLeftRef.current = 60;
    gameStartedRef.current = true;

    setScore(0);
    setLives(3);
    setGameOver(false);
    setTimeLeft(60);
    setGameStarted(true);

    const app = appRef.current;
    if (app) {
      fruitsRef.current.forEach((fruit) => {
        if (fruit.sprite && !fruit.sprite.destroyed) {
          app.stage.removeChild(fruit.sprite);
          fruit.sprite.destroy();
        }
        if (fruit.particles) {
          fruit.particles.forEach((particle) => {
            if (!particle.destroyed) {
              app.stage.removeChild(particle);
              particle.destroy();
            }
          });
        }
      });
    }

    fruitsRef.current = [];
    sliceTrailRef.current = [];
    sliceGraphicsRef.current?.clear();
    lastSpawnTimeRef.current = Date.now();
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }} />

      {/* Welcome Screen - Shows before game starts and after game over */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center">
            <h1 className="text-5xl font-bold text-white mb-2">Pika Splash</h1>
            <p className="text-slate-400 mb-8">Slice the fruits, avoid the bombs!</p>

            {/* Show last score if game just ended */}
            {gameOver && lastScore > 0 && (
              <div className="mb-6">
                <p className="text-5xl font-bold text-white">{lastScore}</p>
                <p className="mt-2 text-sm text-slate-400">Your Score</p>
              </div>
            )}

            {/* Show high score */}
            {highScore > 0 && (
              <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4">
                <p className="text-xs text-emerald-400">High Score</p>
                <p className="text-3xl font-bold text-emerald-400">{highScore}</p>
              </div>
            )}

            {/* New high score message */}
            {gameOver && lastScore === highScore && lastScore > 0 && (
              <p className="mb-6 text-lg font-semibold text-emerald-400">🎉 New High Score!</p>
            )}

            {/* Mute button */}
            <div className="mb-8 flex justify-center gap-4">
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

            {/* Start/Restart button */}
            <button
              type="button"
              onClick={handleStartOrRestart}
              className="w-full inline-flex items-center justify-center rounded-full bg-emerald-500 px-8 py-4 text-xl font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              {gameOver ? "Play Again" : "Start Game"}
            </button>
          </div>
        </div>
      )}

      {/* HUD - Only show when game is started */}
      {gameStarted && !gameOver && (
        <div className="pointer-events-none absolute inset-0 px-4" style={{ paddingTop: '30px' }}>
          <div className="flex items-end justify-between">
            {/* Lives - Left Corner */}
            <div className="flex gap-1 pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-5 rounded-full ${
                    i < lives ? "bg-red-500" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>

            {/* Score - Center */}
            <div className="rounded-xl bg-black/50 px-6 py-2 backdrop-blur">
              <p className="text-xs text-center text-slate-300">Score</p>
              <p className="text-2xl font-bold text-center text-white">{score}</p>
            </div>

            {/* Time Remaining - Right Corner */}
            <div className="rounded-lg bg-black/50 px-4 py-1 backdrop-blur">
              <p className="text-sm font-bold text-center text-white">{timeLeft}s</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
