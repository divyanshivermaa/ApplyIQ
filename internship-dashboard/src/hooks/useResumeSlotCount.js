import { useEffect, useState } from "react";

const DEFAULT_COUNT = 3;
const MIN_COUNT = 1;
const MAX_COUNT = 10;

export default function useResumeSlotCount() {
  const [resumeSlotCount, setResumeSlotCount] = useState(() => {
    const saved = Number(localStorage.getItem("resume_slot_count") || DEFAULT_COUNT);
    if (Number.isNaN(saved)) return DEFAULT_COUNT;
    return Math.min(Math.max(saved, MIN_COUNT), MAX_COUNT);
  });

  useEffect(() => {
    localStorage.setItem("resume_slot_count", String(resumeSlotCount));
  }, [resumeSlotCount]);

  const slotOptions = Array.from({ length: resumeSlotCount }, (_, i) => i + 1);

  return {
    resumeSlotCount,
    setResumeSlotCount,
    slotOptions,
    MIN_COUNT,
    MAX_COUNT,
  };
}
