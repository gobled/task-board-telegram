"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import * as PIXI from "pixi.js";

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
  type: "apple" | "banana" | "peach" | "strawberry" | "watermelon" | "bomb";
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

  const fruitTypes: Array<"apple" | "banana" | "peach" | "strawberry" | "watermelon"> = [
    "apple",
    "banana",
    "peach",
    "strawberry",
    "watermelon",
  ];

  const fruitColors: Record<string, { main: number; shadow: number; highlight: number }> = {
    apple: { main: 0xE74C3C, shadow: 0xC0392B, highlight: 0xFF6B6B },
    banana: { main: 0xF4D03F, shadow: 0xD4AC0D, highlight: 0xF9E79F },
    peach: { main: 0xF8B88B, shadow: 0xDC7633, highlight: 0xFADBD8 },
    strawberry: { main: 0xE74292, shadow: 0xAD1457, highlight: 0xF48FB1 },
    watermelon: { main: 0x58D68D, shadow: 0x229954, highlight: 0xABEBC6 },
    bomb: { main: 0x2C3E50, shadow: 0x17202A, highlight: 0x566573 },
  };

  useEffect(() => {
    const savedHighScore = localStorage.getItem("fruitNinjaHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
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

  // Play sound effect using Howler
  const playSound = (sound: 'splatter' | 'boom' | 'over' | 'start') => {
    try {
      const howl = soundsRef.current[sound];
      if (howl) {
        howl.play();
      }
    } catch (error) {
      // Silently fail if sounds don't work
    }
  };

  // Play start sound on mount
  useEffect(() => {
    const timer = setTimeout(() => playSound('start'), 200);
    return () => clearTimeout(timer);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (gameOverRef.current) {
          return prev;
        }

        if (prev <= 1) {
          setGameOver(true);
          gameOverRef.current = true;
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
  }, [gameOver]);

  // Create fruit sprite
  const createFruitSprite = (fruit: Fruit): PIXI.Graphics => {
    const graphics = new PIXI.Graphics();
    const colors = fruitColors[fruit.type];

    if (fruit.type === "bomb") {
      // Draw bomb
      graphics.beginFill(colors.main);
      graphics.drawCircle(0, 0, fruit.width / 2);
      graphics.endFill();

      // Add highlight
      graphics.beginFill(0xFFFFFF, 0.3);
      graphics.drawEllipse(-fruit.width / 5, -fruit.height / 5, fruit.width / 6, fruit.height / 8);
      graphics.endFill();

      // Add fuse
      graphics.lineStyle(5, 0x8B4513);
      graphics.moveTo(0, -fruit.height / 2);
      graphics.lineTo(0, -fruit.height / 2 - 15);

      // Add spark
      graphics.beginFill(0xFF4500);
      graphics.drawCircle(0, -fruit.height / 2 - 15, 4);
      graphics.endFill();
    } else if (fruit.type === "watermelon") {
      // Draw watermelon
      graphics.beginFill(colors.main);
      graphics.drawCircle(0, 0, fruit.width / 2);
      graphics.endFill();

      // Add stripes
      graphics.lineStyle(3, colors.shadow);
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x1 = Math.cos(angle) * fruit.width / 4;
        const y1 = Math.sin(angle) * fruit.width / 4;
        const x2 = Math.cos(angle) * fruit.width / 2;
        const y2 = Math.sin(angle) * fruit.width / 2;
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
      }

      // Add highlight
      graphics.beginFill(0xFFFFFF, 0.4);
      graphics.drawEllipse(-fruit.width / 5, -fruit.height / 5, fruit.width / 5, fruit.height / 6);
      graphics.endFill();
    } else if (fruit.type === "strawberry") {
      // Draw strawberry
      graphics.beginFill(colors.main);
      graphics.drawCircle(0, 0, fruit.width / 2);
      graphics.endFill();

      // Add seeds
      graphics.beginFill(0xF4E04D);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const radius = fruit.width / 3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        graphics.drawCircle(x, y, 2);
      }
      graphics.endFill();

      // Add highlight
      graphics.beginFill(0xFFFFFF, 0.4);
      graphics.drawEllipse(-fruit.width / 5, -fruit.height / 5, fruit.width / 5, fruit.height / 6);
      graphics.endFill();
    } else if (fruit.type === "banana") {
      // Draw banana
      graphics.beginFill(colors.main);
      graphics.drawEllipse(0, 0, fruit.width / 2, fruit.height / 2.5);
      graphics.endFill();

      // Add spots
      graphics.beginFill(0x8B4513);
      for (let i = 0; i < 3; i++) {
        const x = (Math.random() - 0.5) * fruit.width / 3;
        const y = (Math.random() - 0.5) * fruit.height / 3;
        graphics.drawCircle(x, y, 3);
      }
      graphics.endFill();

      // Add highlight
      graphics.beginFill(0xFFFFFF, 0.4);
      graphics.drawEllipse(-fruit.width / 5, -fruit.height / 5, fruit.width / 5, fruit.height / 6);
      graphics.endFill();
    } else {
      // Apple, Peach - standard
      graphics.beginFill(colors.main);
      graphics.drawCircle(0, 0, fruit.width / 2);
      graphics.endFill();

      // Add stem for apple
      if (fruit.type === "apple") {
        graphics.beginFill(0x8B4513);
        graphics.drawRect(-2, -fruit.height / 2, 4, 10);
        graphics.endFill();

        // Add leaf
        graphics.beginFill(0x228B22);
        graphics.drawEllipse(5, -fruit.height / 2 + 5, 8, 5);
        graphics.endFill();
      }

      // Add highlight
      graphics.beginFill(0xFFFFFF, 0.4);
      graphics.drawEllipse(-fruit.width / 5, -fruit.height / 5, fruit.width / 5, fruit.height / 6);
      graphics.endFill();
    }

    return graphics;
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
          if (!app.destroyed) {
            app.destroy(true, { children: true });
          }
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

        // Spawn new fruits
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
                    setGameOver(true);
                    gameOverRef.current = true;
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

        // Draw slice trail
        if (sliceGraphicsRef.current) {
          sliceGraphicsRef.current.clear();

          if (sliceTrailRef.current.length > 0) {
            sliceGraphicsRef.current.lineStyle(3, 0xFFFFFF, 1);
            sliceGraphicsRef.current.moveTo(sliceTrailRef.current[0].x, sliceTrailRef.current[0].y);

            for (let i = 1; i < sliceTrailRef.current.length; i++) {
              const point = sliceTrailRef.current[i];
              const opacity = Math.max(0, 1 - (currentTime - point.time) / 200);
              sliceGraphicsRef.current.lineStyle(3, 0xFFFFFF, opacity);
              sliceGraphicsRef.current.lineTo(point.x, point.y);
            }

            // Remove old trail points
            sliceTrailRef.current = sliceTrailRef.current.filter(
              (point) => currentTime - point.time < 200
            );
          }
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
        if (sliceTrailRef.current.length > 20) {
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

      if (currentApp && !currentApp.destroyed) {
        currentApp.destroy(true, { children: true });
      }
    };
  }, []);

  const handleRestart = () => {
    scoreRef.current = 0;
    livesRef.current = 3;
    gameOverRef.current = false;
    timeLeftRef.current = 60;

    setScore(0);
    setLives(3);
    setGameOver(false);
    setTimeLeft(60);

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
    lastSpawnTimeRef.current = Date.now();
    sliceGraphicsRef.current?.clear();

    setTimeout(() => playSound('start'), 100);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }} />

      {/* HUD */}
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

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center">
            <h2 className="text-4xl font-bold text-red-500">Time's Up!</h2>

            <div className="mt-6">
              <p className="text-6xl font-bold text-white">{score}</p>
              <p className="mt-2 text-sm text-slate-400">Your Score</p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4">
              <p className="text-xs text-emerald-400">High Score</p>
              <p className="text-3xl font-bold text-emerald-400">{highScore}</p>
            </div>

            {score === highScore && score > 0 && (
              <p className="mt-4 text-lg font-semibold text-emerald-400">🎉 New High Score!</p>
            )}

            <button
              type="button"
              onClick={handleRestart}
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
