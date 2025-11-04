import * as PIXI from "pixi.js";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const BOMB_COLORS: FruitColors = {
  main: 0x2C3E50,
  shadow: 0x17202A,
  highlight: 0x566573
};

export function createBombSprite(width: number, height: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();

  // Draw bomb body
  graphics.beginFill(BOMB_COLORS.main);
  graphics.drawCircle(0, 0, width / 2);
  graphics.endFill();

  // Add highlight
  graphics.beginFill(0xFFFFFF, 0.3);
  graphics.drawEllipse(-width / 5, -height / 5, width / 6, height / 8);
  graphics.endFill();

  // Add fuse
  graphics.lineStyle(5, 0x8B4513);
  graphics.moveTo(0, -height / 2);
  graphics.lineTo(0, -height / 2 - 15);

  // Add spark at fuse tip
  graphics.beginFill(0xFF4500);
  graphics.drawCircle(0, -height / 2 - 15, 4);
  graphics.endFill();

  return graphics;
}
