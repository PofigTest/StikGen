import React, { useState } from 'react';

export default function App() {
  const [objects, setObjects] = useState(["stack of books", "laptop"]);

  const buildPrompt = () => {
    return `Generate exactly ${objects.length * 3} separate die-cut stickers in one image. Canvas: A6, transparent PNG, 10% safety margin. Each sticker: isolated, no overlap, white border 8–12 px. Realistic soft watercolor, subtle paper grain. Warm autumn palette: beige, ochre, muted browns.\n\n${objects
      .map(obj => `Object: ${obj}\nVersion 1: clean version.\nVersion 2: with props.\nVersion 3: with different arrangement.`)
      .join("\n\n")}\n\nNegative prompts: no merged elements, no solid or gradient backgrounds, no artifacts.`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '10px' }}>Sora Sticker Prompt Builder</h1>
      <textarea
        readOnly
        value={buildPrompt()}
        rows={20}
        cols={80}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px' }}
      />
    </div>
  );
}
