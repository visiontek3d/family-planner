"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { EventWithColor } from "./page";
import MonthGrid from "./MonthGrid";
import WeekGrid from "./WeekGrid";
import DashboardSidebar from "./DashboardSidebar";

type MemberEvents = {
  member: { id: string; name: string | null; image: string | null };
  events: EventWithColor[];
  memberColor: string;
};

type GroceryItem = {
  id: string;
  name: string;
  checked: boolean;
};

type Member = { id: string; name: string | null };

type TodoListItem = { id: string; title: string; done: boolean; order: number };
type TodoListData = {
  id: string;
  title: string;
  done: boolean;
  assignee: { name: string | null; showOnDashboard: boolean } | null;
  items: TodoListItem[];
};

type Props = {
  memberEvents: MemberEvents[];
  todoLists: TodoListData[];
  groceries: GroceryItem[];
  members: Member[];
  familyId: string | null;
};

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getEventDateKey(event: EventWithColor["event"]) {
  const s = event.start?.dateTime ?? event.start?.date;
  if (!s) return "";
  if (event.start?.date) return event.start.date;
  return toDateKey(new Date(s));
}

function formatTime(event: EventWithColor["event"]) {
  if (event.start?.date) return "All day";
  const start = event.start?.dateTime;
  if (!start) return "";
  return new Date(start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getWeekStart(d: Date): Date {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export default function CalendarView({ memberEvents, todoLists, groceries, members, familyId }: Props) {
  const today = new Date();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(new Set());
  const [hiddenCalendarIds, setHiddenCalendarIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    try {
      const members = localStorage.getItem("family-planner-hidden-members");
      if (members) setHiddenMemberIds(new Set(JSON.parse(members) as string[]));
      const cals = localStorage.getItem("family-planner-hidden-calendars");
      if (cals) setHiddenCalendarIds(new Set(JSON.parse(cals) as string[]));
    } catch {}
  }, []);

  function toggleMember(memberId: string) {
    setHiddenMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      try {
        localStorage.setItem("family-planner-hidden-members", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function prevWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  }
  function nextWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  }
  function goToToday() {
    setWeekStart(getWeekStart(new Date()));
    setSelectedDate(toDateKey(new Date()));
  }

  const filteredMemberEvents = memberEvents
    .filter((me) => !hiddenMemberIds.has(me.member.id))
    .map((me) => ({
      ...me,
      events: me.events.filter((e) => !hiddenCalendarIds.has(e.calendarId)),
    }));

  const selectedEvents = filteredMemberEvents.flatMap(({ member, events, memberColor }) =>
    events
      .filter((e) => getEventDateKey(e.event) === selectedDate)
      .map((e) => ({ event: e.event, calendarColor: e.calendarColor, memberColor, member }))
  );
  selectedEvents.sort((a, b) => {
    const at = a.event.start?.dateTime ?? a.event.start?.date ?? "";
    const bt = b.event.start?.dateTime ?? b.event.start?.date ?? "";
    return at.localeCompare(bt);
  });

  const selectedLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const isToday = selectedDate === toDateKey(today);

  return (
    <div className="p-4 grid grid-cols-[1fr_380px] gap-4 h-screen">
      {/* Left: calendar + day events */}
      <div className="flex flex-col gap-4 min-h-0">
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Toolbar: member toggles + view switcher */}
          <div className="flex-shrink-0 flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3">
            {memberEvents.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setHiddenMemberIds(new Set());
                    try { localStorage.setItem("family-planner-hidden-members", JSON.stringify([])); } catch {}
                  }}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${hiddenMemberIds.size > 0 ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  All
                </button>
                {memberEvents.map(({ member, memberColor }) => {
                  const hidden = hiddenMemberIds.has(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity flex-shrink-0 ${hidden ? "opacity-35" : "opacity-100"}`}
                      style={{ backgroundColor: memberColor + "1A" }}
                    >
                      {member.image ? (
                        <Image src={member.image} width={24} height={24} className="rounded-full flex-shrink-0" alt="" />
                      ) : (
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: memberColor }}
                        >
                          {member.name?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                      <span style={{ color: memberColor }}>{member.name?.split(" ")[0]}</span>
                    </button>
                  );
                })}
                <div className="w-px h-6 bg-gray-100 mx-1 flex-shrink-0" />
              </>
            )}
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 ml-auto">
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${viewMode === "month" ? "bg-violet-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 text-sm font-semibold transition-colors border-l border-gray-200 ${viewMode === "week" ? "bg-violet-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {viewMode === "month" ? (
              <MonthGrid
                memberEvents={filteredMemberEvents}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                weekStart={weekStart}
                onPrevWeek={prevWeek}
                onNextWeek={nextWeek}
                onToday={goToToday}
              />
            ) : (
              <WeekGrid
                memberEvents={filteredMemberEvents}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                weekStart={weekStart}
                onPrevWeek={prevWeek}
                onNextWeek={nextWeek}
                onToday={goToToday}
              />
            )}
          </div>
        </div>

        {/* Selected day events — fixed height, scrollable */}
        <div className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ height: "260px" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
            <p className="text-base font-semibold text-gray-800">
              {isToday ? "Today" : selectedLabel}
            </p>
            {selectedEvents.length > 0 && (
              <span className="text-sm text-gray-400">{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-4">Nothing scheduled.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {selectedEvents.map(({ event, calendarColor, memberColor, member }, idx) => (
                  <li key={idx} className="flex items-center gap-3 px-5 py-3 min-h-[52px]">
                    <span className="text-sm text-gray-400 w-20 text-right flex-shrink-0">{formatTime(event)}</span>
                    <div className="w-px h-6 bg-gray-100 flex-shrink-0" />
                    <span className="flex items-center rounded-md overflow-hidden text-sm font-medium flex-1 min-w-0">
                      <span className="w-1.5 self-stretch flex-shrink-0" style={{ backgroundColor: memberColor }} />
                      <span
                        className="flex-1 truncate px-2 py-1 text-gray-800"
                        style={{ backgroundColor: calendarColor + "26" }}
                      >
                        {event.summary ?? "(No title)"}
                      </span>
                    </span>
                    {memberEvents.length > 1 && (
                      <span
                        className="text-sm px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 text-white"
                        style={{ backgroundColor: memberColor }}
                      >
                        {member.name?.split(" ")[0]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Right: todos + grocery */}
      {familyId && (
        <div className="flex flex-col min-h-0">
          <DashboardSidebar
            todoLists={todoLists}
            groceries={groceries}
            members={members}
            familyId={familyId}
          />
        </div>
      )}
    </div>
  );
}
