import * as PIXI from "pixi.js";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const APPLE_COLORS: FruitColors = {
  main: 0xE74C3C,
  shadow: 0xC0392B,
  highlight: 0xFF6B6B
};

export function createAppleSprite(width: number, height: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();

  // Draw main apple body
  graphics.beginFill(APPLE_COLORS.main);
  graphics.drawCircle(0, 0, width / 2);
  graphics.endFill();

  // Add stem
  graphics.beginFill(0x8B4513);
  graphics.drawRect(-2, -height / 2, 4, 10);
  graphics.endFill();

  // Add leaf
  graphics.beginFill(0x228B22);
  graphics.drawEllipse(5, -height / 2 + 5, 8, 5);
  graphics.endFill();

  // Add highlight
  graphics.beginFill(0xFFFFFF, 0.4);
  graphics.drawEllipse(-width / 5, -height / 5, width / 5, height / 6);
  graphics.endFill();

  return graphics;
}
