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

  // --- Draw the Apple ---
      // We'll draw the apple centered around (0, 0) and then
      // move the entire graphics object to the center of the screen.
      const appleRadius = 60;
      const topIndent = 12;
      const bottomIndent = 6;

      // 4. Draw the Apple Body (Red)
      graphics.beginFill(0xDE3249); // A nice apple red
      graphics.moveTo(0, -appleRadius + topIndent); // Start at the top indent

      // Right side
      graphics.quadraticCurveTo(
        appleRadius, -appleRadius, // control point
        appleRadius, 0             // destination point
      );
      graphics.quadraticCurveTo(
        appleRadius, appleRadius,
        0, appleRadius - bottomIndent
      );

      // Left side
      graphics.quadraticCurveTo(
        -appleRadius, appleRadius,
        -appleRadius, 0
      );
      graphics.quadraticCurveTo(
        -appleRadius, -appleRadius,
        0, -appleRadius + topIndent
      );
      graphics.endFill();

      // 5. Draw the Stem (Brown)
      graphics.beginFill(0x7B4F2A); // Brown
      // (x, y, width, height)
      graphics.drawRect(-4, -appleRadius - 18 + topIndent, 8, 20);
      graphics.endFill();

      // 6. Draw the Leaf (Green)
      graphics.beginFill(0x799E23); // Green
      graphics.moveTo(4, -appleRadius); // Start near the stem
      graphics.quadraticCurveTo(25, -appleRadius - 15, 40, -appleRadius - 5);
      graphics.quadraticCurveTo(20, -appleRadius, 4, -appleRadius);
      graphics.endFill();

      // --- Positioning ---
      
      

  return graphics;
}
