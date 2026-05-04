"use client";

import { useEffect, useRef } from "react";
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

type TimedEvent = {
  title: string;
  memberColor: string;
  calendarColor: string;
  startMin: number;
  durationMin: number;
  lane: number;
  totalLanes: number;
};

type AllDayEvent = {
  title: string;
  memberColor: string;
  calendarColor: string;
};

const HOUR_HEIGHT = 56; // px per hour
const LABEL_WIDTH = 52; // px for time labels column

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHour(h: number) {
  if (h === 0) return "";
  const period = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${period}`;
}

function assignLanes(events: Omit<TimedEvent, "lane" | "totalLanes">[]): TimedEvent[] {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin);
  const lanes: number[] = []; // each entry = end minute of last event in that lane

  const withLanes = sorted.map((ev) => {
    let lane = lanes.findIndex((end) => end <= ev.startMin);
    if (lane === -1) { lane = lanes.length; lanes.push(0); }
    lanes[lane] = ev.startMin + ev.durationMin;
    return { ...ev, lane, totalLanes: 0 };
  });

  // Pass 2: for each event find how many lanes it actually competes with
  // Simple: total lanes = max lane index + 1 among overlapping events
  withLanes.forEach((ev) => {
    const competing = withLanes.filter(
      (other) =>
        other.startMin < ev.startMin + ev.durationMin &&
        other.startMin + other.durationMin > ev.startMin
    );
    ev.totalLanes = Math.max(...competing.map((c) => c.lane)) + 1;
  });

  return withLanes;
}

export default function WeekGrid({
  memberEvents,
  selectedDate,
  onSelectDate,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = toDateKey(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // Scroll to 7am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT - 16;
    }
  }, []);

  // Build events per day
  const timedByDay: Record<string, Omit<TimedEvent, "lane" | "totalLanes">[]> = {};
  const allDayByDay: Record<string, AllDayEvent[]> = {};

  memberEvents.forEach(({ events, memberColor }) => {
    events.forEach(({ event, calendarColor }) => {
      const isAllDay = !!event.start?.date && !event.start?.dateTime;
      const dateStr = isAllDay ? event.start!.date! : event.start?.dateTime;
      if (!dateStr) return;
      const key = isAllDay ? dateStr : toDateKey(new Date(dateStr));

      if (isAllDay) {
        if (!allDayByDay[key]) allDayByDay[key] = [];
        allDayByDay[key].push({ title: event.summary ?? "(No title)", memberColor, calendarColor });
      } else {
        const start = new Date(dateStr);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endStr = event.end?.dateTime;
        const endMin = endStr
          ? new Date(endStr).getHours() * 60 + new Date(endStr).getMinutes()
          : startMin + 60;
        const durationMin = Math.max(endMin - startMin, 30);

        if (!timedByDay[key]) timedByDay[key] = [];
        timedByDay[key].push({ title: event.summary ?? "(No title)", memberColor, calendarColor, startMin, durationMin });
      }
    });
  });

  const timedWithLanes: Record<string, TimedEvent[]> = {};
  Object.entries(timedByDay).forEach(([key, evs]) => {
    timedWithLanes[key] = assignLanes(evs);
  });

  const hasAnyAllDay = days.some((d) => (allDayByDay[toDateKey(d)]?.length ?? 0) > 0);

  const rangeStart = days[0];
  const rangeEnd = days[6];
  const rangeLabel =
    rangeStart.getMonth() === rangeEnd.getMonth()
      ? `${rangeStart.toLocaleDateString("en-US", { month: "long" })} ${rangeStart.getDate()} – ${rangeEnd.getDate()}, ${rangeStart.getFullYear()}`
      : `${rangeStart.toLocaleDateString("en-US", { month: "short" })} ${rangeStart.getDate()} – ${rangeEnd.toLocaleDateString("en-US", { month: "short" })} ${rangeEnd.getDate()}, ${rangeEnd.getFullYear()}`;

  // Current time indicator
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayKey = today;
  const todayInView = days.some((d) => toDateKey(d) === todayKey);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full min-h-0">
      {/* Navigation header */}
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

      {/* Day column headers */}
      <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0" />
        {days.map((day) => {
          const key = toDateKey(day);
          const isToday = key === today;
          const isSelected = key === selectedDate;
          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={`flex-1 py-3 flex flex-col items-center transition-colors hover:bg-violet-50/60 ${isSelected ? "bg-violet-50" : ""}`}
            >
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={`mt-1 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  isToday
                    ? "bg-violet-600 text-white"
                    : isSelected
                    ? "bg-violet-100 text-violet-700"
                    : "text-gray-700"
                }`}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAnyAllDay && (
        <div className="flex border-b border-gray-100 flex-shrink-0 bg-gray-50/40">
          <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0 flex items-center justify-end pr-2">
            <span className="text-[10px] text-gray-400 font-medium">all day</span>
          </div>
          {days.map((day) => {
            const key = toDateKey(day);
            const evs = allDayByDay[key] ?? [];
            return (
              <div key={key} className="flex-1 border-l border-gray-100 py-1 px-1 flex flex-col gap-0.5 min-h-[28px]">
                {evs.map((ev, i) => (
                  <span key={i} className="flex items-center rounded overflow-hidden text-xs font-medium">
                    <span className="w-1 self-stretch flex-shrink-0" style={{ backgroundColor: ev.memberColor }} />
                    <span className="flex-1 truncate px-1 py-0.5 text-gray-800" style={{ backgroundColor: ev.calendarColor + "26" }}>
                      {ev.title}
                    </span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Hour labels */}
          <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0 relative">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                className="absolute w-full flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-[11px] text-gray-400 font-medium">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const key = toDateKey(day);
            const isToday = key === todayKey;
            const evs = timedWithLanes[key] ?? [];

            return (
              <div
                key={key}
                className={`flex-1 border-l border-gray-100 relative ${isToday ? "bg-violet-50/20" : ""}`}
                style={{ height: 24 * HOUR_HEIGHT }}
              >
                {/* Hour lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    style={{ top: h * HOUR_HEIGHT }}
                    className="absolute inset-x-0 border-t border-gray-100"
                  />
                ))}
                {/* Half-hour lines */}
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    className="absolute inset-x-0 border-t border-gray-50"
                  />
                ))}

                {/* Current time indicator */}
                {isToday && todayInView && (
                  <div
                    style={{ top: (nowMin / 60) * HOUR_HEIGHT }}
                    className="absolute inset-x-0 z-10 flex items-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-violet-500 -ml-1 flex-shrink-0" />
                    <div className="flex-1 h-px bg-violet-500" />
                  </div>
                )}

                {/* Events */}
                {evs.map((ev, i) => {
                  const top = (ev.startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max((ev.durationMin / 60) * HOUR_HEIGHT, 22);
                  const laneWidth = 1 / ev.totalLanes;
                  const left = `calc(${ev.lane * laneWidth * 100}% + 2px)`;
                  const width = `calc(${laneWidth * 100}% - 4px)`;
                  const short = height < 36;

                  return (
                    <div
                      key={i}
                      style={{ top, height, left, width }}
                      className="absolute flex overflow-hidden rounded-md z-[5]"
                    >
                      <div className="w-1 flex-shrink-0" style={{ backgroundColor: ev.memberColor }} />
                      <div
                        className="flex-1 px-1.5 overflow-hidden"
                        style={{ backgroundColor: ev.calendarColor + "33" }}
                      >
                        <p className={`text-gray-800 font-medium leading-tight truncate ${short ? "text-[10px] pt-0.5" : "text-xs pt-1"}`}>
                          {ev.title}
                        </p>
                        {!short && (
                          <p className="text-[10px] text-gray-500 leading-tight">
                            {formatMinutes(ev.startMin)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${period}`;
}
