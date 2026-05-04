"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm transition-colors whitespace-nowrap"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
