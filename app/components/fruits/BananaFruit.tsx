import * as PIXI from "pixi.js";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const BANANA_COLORS: FruitColors = {
  main: 0xF4D03F,
  shadow: 0xD4AC0D,
  highlight: 0xF9E79F
};

export function createBananaSprite(width: number, height: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();

  // Draw banana body (ellipse)
  graphics.beginFill(BANANA_COLORS.main);
  graphics.drawEllipse(0, 0, width / 2, height / 2.5);
  graphics.endFill();

  // Add brown spots
  graphics.beginFill(0x8B4513);
  for (let i = 0; i < 3; i++) {
    const x = (Math.random() - 0.5) * width / 3;
    const y = (Math.random() - 0.5) * height / 3;
    graphics.drawCircle(x, y, 3);
  }
  graphics.endFill();

  // Add highlight
  graphics.beginFill(0xFFFFFF, 0.4);
  graphics.drawEllipse(-width / 5, -height / 5, width / 5, height / 6);
  graphics.endFill();

  return graphics;
}
