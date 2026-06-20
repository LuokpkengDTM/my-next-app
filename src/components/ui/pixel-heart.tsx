import React from "react";

interface PixelHeartProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  pixelColor?: string;
}

export function PixelHeart({ size = 24, pixelColor = "currentColor", ...props }: PixelHeartProps) {
  // Symmetrical 17x17 pixel art layout (center column is 8)
  const pixels = [
    // === OUTER BORDER ===
    // Top humps (y=2)
    { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
    { x: 11, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 },

    // Row 3 (y=3)
    { x: 2, y: 3 }, { x: 6, y: 3 }, { x: 10, y: 3 }, { x: 14, y: 3 },

    // Row 4 (y=4)
    { x: 1, y: 4 }, { x: 7, y: 4 }, { x: 9, y: 4 }, { x: 15, y: 4 },

    // Row 5 (y=5)
    { x: 1, y: 5 }, { x: 8, y: 5 }, { x: 15, y: 5 },

    // Row 6 (y=6)
    { x: 1, y: 6 }, { x: 15, y: 6 },

    // Row 7 (y=7)
    { x: 1, y: 7 }, { x: 15, y: 7 },

    // Bottom outer slope (y=8 to y=14)
    { x: 2, y: 8 }, { x: 14, y: 8 },
    { x: 3, y: 9 }, { x: 13, y: 9 },
    { x: 4, y: 10 }, { x: 12, y: 10 },
    { x: 5, y: 11 }, { x: 11, y: 11 },
    { x: 6, y: 12 }, { x: 10, y: 12 },
    { x: 7, y: 13 }, { x: 9, y: 13 },
    { x: 8, y: 14 },

    // === INNER BORDER (Makes outline 2-dots thick) ===
    // Top humps inner (y=3)
    { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
    { x: 11, y: 3 }, { x: 12, y: 3 }, { x: 13, y: 3 },

    // Row 4 inner (y=4)
    { x: 2, y: 4 }, { x: 6, y: 4 }, { x: 10, y: 4 }, { x: 14, y: 4 },

    // Row 5 inner (y=5)
    { x: 2, y: 5 }, { x: 7, y: 5 }, { x: 9, y: 5 }, { x: 14, y: 5 },

    // Row 6 inner (y=6)
    { x: 2, y: 6 }, { x: 8, y: 6 }, { x: 14, y: 6 },

    // Row 7 inner (y=7)
    { x: 2, y: 7 }, { x: 14, y: 7 },

    // Bottom inner slope (y=8 to y=13)
    { x: 3, y: 8 }, { x: 13, y: 8 },
    { x: 4, y: 9 }, { x: 12, y: 9 },
    { x: 5, y: 10 }, { x: 11, y: 10 },
    { x: 6, y: 11 }, { x: 10, y: 11 },
    { x: 7, y: 12 }, { x: 9, y: 12 },
    { x: 8, y: 13 },

    // === SHIELD OUTLINE ===
    { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
    { x: 6, y: 7 }, { x: 10, y: 7 },
    { x: 6, y: 8 }, { x: 10, y: 8 },
    { x: 6, y: 9 }, { x: 10, y: 9 },
    { x: 7, y: 10 }, { x: 9, y: 10 },
    { x: 8, y: 11 },

    // === SHIELD INNER CORE ===
    { x: 8, y: 8 }, { x: 8, y: 9 },

  ];

  // Remove duplicates
  const uniquePixels = Array.from(new Set(pixels.map((p) => `${p.x},${p.y}`)))
    .map((str) => {
      const [x, y] = str.split(",").map(Number);
      return { x, y };
    });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {uniquePixels.map((p, idx) => (
        <rect
          key={idx}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          fill={pixelColor}
        />
      ))}
    </svg>
  );
}
