// src/app/(main)/parkout/explore/components/countdown.tsx
// Live countdown showing days/hours until move-out date.
// Updates every minute. Shows urgency to incoming tenants.
// Red when under 3 days, amber under 7, green otherwise.

"use client";

import { useState, useEffect } from "react";

type Props = { moveOutDate: string };

function getTimeLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return { days, hours };
}

export default function Countdown({ moveOutDate }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(moveOutDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(moveOutDate));
    }, 60_000);
    return () => clearInterval(interval);
  }, [moveOutDate]);

  if (!timeLeft) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "3px 8px",
        borderRadius: 20, backgroundColor: "#FFEBEE",
        color: "#C62828",
      }}>
        Vacated
      </span>
    );
  }

  const color = timeLeft.days < 3
    ? { bg: "#FFEBEE", text: "#C62828" }
    : timeLeft.days < 7
    ? { bg: "#FFF8E1", text: "#F59E0B" }
    : { bg: "#E8F5E9", text: "#2E7D32" };

  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 8px",
      borderRadius: 20,
      backgroundColor: color.bg,
      color: color.text,
      whiteSpace: "nowrap",
    }}>
      ⏱ {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}{timeLeft.hours}h left
    </span>
  );
}