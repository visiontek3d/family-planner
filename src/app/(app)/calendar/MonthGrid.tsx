"use client";

import type { EventWithColor } from "./page";

type MemberEvents = {
  member: { name: string | null; image: string | null };
  events: EventWithColor[];
  memberColor: string;
};

type Props = {
  memberEvents: MemberEvents[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
};

type EventChip = {
  title: string;
  memberColor: string;
  calendarColor: string;
  startMs: number;
};

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getEventDateKey(event: EventWithColor["event"]) {
  const s = event.start?.dateTime ?? event.start?.date;
  if (!s) return "";
  if (event.start?.date) return event.start.date;
  return toDateKey(new Date(s));
}

function getEventStartMs(event: EventWithColor["event"]) {
  const s = event.start?.dateTime ?? event.start?.date;
  return s ? new Date(s).getTime() : 0;
}

export default function MonthGrid({
  memberEvents,
  selectedDate,
  onSelectDate,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
}: Props) {
  const today = toDateKey(new Date());

  // Build event map
  const eventMap: Record<string, EventChip[]> = {};
  memberEvents.forEach(({ events, memberColor }) => {
    events.forEach(({ event, calendarColor }) => {
      const key = getEventDateKey(event);
      if (!key) return;
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push({
        title: event.summary ?? "(No title)",
        memberColor,
        calendarColor,
        startMs: getEventStartMs(event),
      });
    });
  });
  Object.values(eventMap).forEach((arr) => arr.sort((a, b) => a.startMs - b.startMs));

  // Build 5 weeks of days starting from weekStart
  const weeks: Date[][] = [];
  for (let w = 0; w < 5; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + w * 7 + d);
      week.push(date);
    }
    weeks.push(week);
  }

  const rangeStart = weeks[0][0];
  const rangeEnd = weeks[4][6];
  const rangeLabel =
    rangeStart.getMonth() === rangeEnd.getMonth()
      ? `${rangeStart.toLocaleDateString("en-US", { month: "long" })} ${rangeStart.getDate()} – ${rangeEnd.getDate()}, ${rangeStart.getFullYear()}`
      : `${rangeStart.toLocaleDateString("en-US", { month: "short" })} ${rangeStart.getDate()} – ${rangeEnd.toLocaleDateString("en-US", { month: "short" })} ${rangeEnd.getDate()}, ${rangeEnd.getFullYear()}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={onPrevWeek}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={onNextWeek}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <span className="font-bold text-gray-900 text-lg flex-1">{rangeLabel}</span>
        <button
          onClick={onToday}
          className="px-4 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 font-semibold uppercase tracking-wide py-3">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 flex flex-col divide-y divide-gray-100 min-h-0">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-100 flex-1">
            {week.map((date, di) => {
              const dateKey = toDateKey(date);
              const isToday = dateKey === today;
              const isSelected = dateKey === selectedDate;
              const isCurrentMonth = date.getMonth() === weekStart.getMonth() ||
                date.getMonth() === new Date(weekStart.getTime() + 28 * 86400000).getMonth();
              const chips = eventMap[dateKey] ?? [];
              const MAX_VISIBLE = 4;
              const overflow = chips.length - MAX_VISIBLE;

              return (
                <button
                  key={di}
                  onClick={() => onSelectDate(dateKey)}
                  className={`flex flex-col p-2 text-left transition-colors hover:bg-violet-50/60 ${
                    isSelected ? "bg-violet-50" : ""
                  }`}
                >
                  <span
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold mb-1 flex-shrink-0 ${
                      isToday
                        ? "bg-violet-600 text-white"
                        : isSelected
                        ? "bg-violet-100 text-violet-700"
                        : isCurrentMonth
                        ? "text-gray-700"
                        : "text-gray-300"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                    {chips.slice(0, MAX_VISIBLE).map((chip, i) => (
                      <span key={i} className="flex items-center rounded-md overflow-hidden text-xs font-medium w-full">
                        <span className="w-1.5 self-stretch flex-shrink-0" style={{ backgroundColor: chip.memberColor }} />
                        <span
                          className="flex-1 truncate px-1.5 py-0.5 text-gray-800"
                          style={{ backgroundColor: chip.calendarColor + "26" }}
                        >
                          {chip.title}
                        </span>
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="text-xs text-gray-400 px-1">+{overflow} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
