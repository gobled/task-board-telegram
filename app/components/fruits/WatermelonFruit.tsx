import * as PIXI from "pixi.js";

export interface FruitColors {
  main: number;
  shadow: number;
  highlight: number;
}

export const WATERMELON_COLORS: FruitColors = {
  main: 0x58D68D,
  shadow: 0x229954,
  highlight: 0xABEBC6
};

export function createWatermelonSprite(width: number, height: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();

  // Draw main watermelon body
  graphics.beginFill(WATERMELON_COLORS.main);
  graphics.drawCircle(0, 0, width / 2);
  graphics.endFill();

  // Add dark green stripes
  graphics.lineStyle(3, WATERMELON_COLORS.shadow);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const x1 = Math.cos(angle) * width / 4;
    const y1 = Math.sin(angle) * width / 4;
    const x2 = Math.cos(angle) * width / 2;
    const y2 = Math.sin(angle) * width / 2;
    graphics.moveTo(x1, y1);
    graphics.lineTo(x2, y2);
  }

  // Add highlight
  graphics.beginFill(0xFFFFFF, 0.4);
  graphics.drawEllipse(-width / 5, -height / 5, width / 5, height / 6);
  graphics.endFill();

  return graphics;
}
