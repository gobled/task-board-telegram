import * as PIXI from "pixi.js";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const PEACH_COLORS: FruitColors = {
  main: 0xF8B88B,
  shadow: 0xDC7633,
  highlight: 0xFADBD8
};

export function createPeachSprite(width: number, height: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();

  // Draw main peach body (simple circle)
  graphics.beginFill(PEACH_COLORS.main);
  graphics.drawCircle(0, 0, width / 2);
  graphics.endFill();

  // Add highlight
  graphics.beginFill(0xFFFFFF, 0.4);
  graphics.drawEllipse(-width / 5, -height / 5, width / 5, height / 6);
  graphics.endFill();

  return graphics;
}
