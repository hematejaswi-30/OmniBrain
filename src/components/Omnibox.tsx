// components/Omnibox.tsx
"use client";

import React, { useState } from 'react';
import { ingestRouter } from '../lib/ingest-router';

export default function Omnibox() {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = ingestRouter(input);
    console.log("Routed input:", result);
    // Add subsequent processing here
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="flex-1 border border-gray-300 rounded-md p-2"
        placeholder="Type a URL, task, or question..."
      />
      <button 
        type="submit" 
        // Strict adherence: rounded-md (6px radius). No pill buttons or neon purple gradients.
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Submit
      </button>
    </form>
  );
}
