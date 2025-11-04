"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { createFruitSprite, fruitColors, type FruitType } from "../components/fruits";

// Ensure Pixi has the ticker plugin
if (!PIXI.Application._plugins?.includes?.(PIXI.TickerPlugin)) {
  PIXI.extensions.add(PIXI.TickerPlugin);
}

export default function FruitsReferencePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;
    const app = new PIXI.Application();

    app
      .init({
        width: 1200,
        height: 400,
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

        containerRef.current.appendChild(app.canvas as HTMLCanvasElement);

        // Define all fruit types
        const fruitTypes: FruitType[] = [
          "apple",
          "banana",
          "peach",
          "strawberry",
          "watermelon",
          "bomb",
        ];

        // Display each fruit
        fruitTypes.forEach((type, index) => {
          const x = 150 + index * 180;
          const y = 200;
          const size = 80;

          // Create fruit sprite
          const sprite = createFruitSprite(type, size, size);
          sprite.x = x;
          sprite.y = y;
          app.stage.addChild(sprite);

          // Add label
          const text = new PIXI.Text({
            text: type.charAt(0).toUpperCase() + type.slice(1),
            style: {
              fontFamily: "Arial",
              fontSize: 18,
              fill: 0xffffff,
              align: "center",
            },
          });
          text.anchor.set(0.5);
          text.x = x;
          text.y = y + 70;
          app.stage.addChild(text);

          // Add color info
          const colors = fruitColors[type];
          const colorText = new PIXI.Text({
            text: `#${colors.main.toString(16).toUpperCase()}`,
            style: {
              fontFamily: "monospace",
              fontSize: 12,
              fill: 0x94a3b8,
              align: "center",
            },
          });
          colorText.anchor.set(0.5);
          colorText.x = x;
          colorText.y = y + 95;
          app.stage.addChild(colorText);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize PixiJS application:", error);
      });

    return () => {
      destroyed = true;
      if (app) {
        app.destroy(true, { children: true });
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Fruit Reference</h1>
          <p className="text-slate-400">
            Visual reference for all fruit sprites in Pika Splash
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            All Fruits (80x80px)
          </h2>
          <div
            ref={containerRef}
            className="overflow-x-auto"
            style={{ minHeight: "400px" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Apple 🍎</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Red circle with stem and leaf</li>
              <li>• Main: #E74C3C</li>
              <li>• Shadow: #C0392B</li>
              <li>• Points: 10</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Banana 🍌</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Yellow ellipse with brown spots</li>
              <li>• Main: #F4D03F</li>
              <li>• Shadow: #D4AC0D</li>
              <li>• Points: 10</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">Peach 🍑</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Peach-colored circle</li>
              <li>• Main: #F8B88B</li>
              <li>• Shadow: #DC7633</li>
              <li>• Points: 10</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-pink-400 mb-2">
              Strawberry 🍓
            </h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Pink circle with yellow seeds</li>
              <li>• Main: #E74292</li>
              <li>• Shadow: #AD1457</li>
              <li>• Points: 10</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              Watermelon 🍉
            </h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Green circle with dark stripes</li>
              <li>• Main: #58D68D</li>
              <li>• Shadow: #229954</li>
              <li>• Points: 10</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Bomb 💣</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Black circle with fuse and spark</li>
              <li>• Main: #2C3E50</li>
              <li>• Shadow: #17202A</li>
              <li>• Points: -1 Life</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Navigation</h3>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            ← Back to Game
          </a>
        </div>
      </div>
    </div>
  );
}
