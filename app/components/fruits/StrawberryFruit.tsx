import * as PIXI from "pixi.js";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const STRAWBERRY_COLORS: FruitColors = {
  main: 0xE74292,
  shadow: 0xAD1457,
  highlight: 0xF48FB1
};

export function createStrawberrySprite(width: number, height: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();

  // Draw main strawberry body
  graphics.beginFill(STRAWBERRY_COLORS.main);
  graphics.drawCircle(0, 0, width / 2);
  graphics.endFill();

  // Add seeds
  graphics.beginFill(0xF4E04D);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = width / 3;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    graphics.drawCircle(x, y, 2);
  }
  graphics.endFill();

  // Add highlight
  graphics.beginFill(0xFFFFFF, 0.4);
  graphics.drawEllipse(-width / 5, -height / 5, width / 5, height / 6);
  graphics.endFill();

  return graphics;
}
