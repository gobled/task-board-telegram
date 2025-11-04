import * as PIXI from "pixi.js";
import { createAppleSprite, APPLE_COLORS } from "./AppleFruit";
import { createBananaSprite, BANANA_COLORS } from "./BananaFruit";
import { createPeachSprite, PEACH_COLORS } from "./PeachFruit";
import { createStrawberrySprite, STRAWBERRY_COLORS } from "./StrawberryFruit";
import { createWatermelonSprite, WATERMELON_COLORS } from "./WatermelonFruit";
import { createBombSprite, BOMB_COLORS } from "./BombFruit";

export type FruitType = "apple" | "banana" | "peach" | "strawberry" | "watermelon" | "bomb";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const fruitColors: Record<FruitType, FruitColors> = {
  apple: APPLE_COLORS,
  banana: BANANA_COLORS,
  peach: PEACH_COLORS,
  strawberry: STRAWBERRY_COLORS,
  watermelon: WATERMELON_COLORS,
  bomb: BOMB_COLORS,
};

export function createFruitSprite(type: FruitType, width: number, height: number): PIXI.Graphics {
  switch (type) {
    case "apple":
      return createAppleSprite(width, height);
    case "banana":
      return createBananaSprite(width, height);
    case "peach":
      return createPeachSprite(width, height);
    case "strawberry":
      return createStrawberrySprite(width, height);
    case "watermelon":
      return createWatermelonSprite(width, height);
    case "bomb":
      return createBombSprite(width, height);
  }
}

export { createAppleSprite, APPLE_COLORS } from "./AppleFruit";
export { createBananaSprite, BANANA_COLORS } from "./BananaFruit";
export { createPeachSprite, PEACH_COLORS } from "./PeachFruit";
export { createStrawberrySprite, STRAWBERRY_COLORS } from "./StrawberryFruit";
export { createWatermelonSprite, WATERMELON_COLORS } from "./WatermelonFruit";
export { createBombSprite, BOMB_COLORS } from "./BombFruit";
