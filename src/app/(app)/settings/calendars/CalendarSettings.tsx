"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import type { MemberCalendarData } from "./page";
import { updateMemberColor, updateShowOnDashboard } from "./actions";

const PRESET_COLORS = [
  "#7C3AED", // violet
  "#E11D48", // rose
  "#059669", // emerald
  "#D97706", // amber
  "#2563EB", // blue
  "#DB2777", // pink
  "#0891B2", // cyan
  "#EA580C", // orange
  "#4F46E5", // indigo
  "#65A30D", // lime
  "#DC2626", // red
  "#0D9488", // teal
];

export default function CalendarSettings({ members }: { members: MemberCalendarData[] }) {
  const [hiddenCalendarIds, setHiddenCalendarIds] = useState<Set<string>>(new Set());
  const [expandedColorPicker, setExpandedColorPicker] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("family-planner-hidden-calendars");
      if (stored) setHiddenCalendarIds(new Set(JSON.parse(stored) as string[]));
    } catch {}
  }, []);

  function toggleCalendar(calendarId: string) {
    setHiddenCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) next.delete(calendarId);
      else next.add(calendarId);
      try {
        localStorage.setItem("family-planner-hidden-calendars", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  function toggleAllForMember(calendarIds: string[], show: boolean) {
    setHiddenCalendarIds((prev) => {
      const next = new Set(prev);
      calendarIds.forEach((id) => (show ? next.delete(id) : next.add(id)));
      try {
        localStorage.setItem("family-planner-hidden-calendars", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Calendar Settings</h1>
        <p className="text-gray-500 mt-1">Configure colors and choose which calendars appear on the home screen.</p>
      </div>

      <div className="space-y-5">
        {members.map((member) => {
          const allVisible = member.calendars.every((c) => !hiddenCalendarIds.has(c.id));
          const allHidden = member.calendars.every((c) => hiddenCalendarIds.has(c.id));
          const calendarIds = member.calendars.map((c) => c.id);
          const isPickingColor = expandedColorPicker === member.id;

          return (
            <div key={member.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Member header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                {member.image ? (
                  <Image src={member.image} width={40} height={40} className="rounded-full flex-shrink-0" alt="" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: member.memberColor }}
                  >
                    {member.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{member.name ?? "Unknown"}</p>
                  <p className="text-sm text-gray-400">{member.calendars.length} calendar{member.calendars.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Show on dashboard toggle */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-600 whitespace-nowrap">On dashboard</span>
                    <div
                      onClick={() => startTransition(() => updateShowOnDashboard(member.id, !member.showOnDashboard))}
                      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 cursor-pointer ${member.showOnDashboard ? "bg-violet-600" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${member.showOnDashboard ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                  </div>
                  {/* Color picker toggle */}
                  <button
                    onClick={() => setExpandedColorPicker(isPickingColor ? null : member.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: member.memberColor }} />
                    Color
                  </button>
                  {member.calendars.length > 1 && (
                    <button
                      onClick={() => toggleAllForMember(calendarIds, allHidden)}
                      className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {allVisible ? "Hide all" : "Show all"}
                    </button>
                  )}
                </div>
              </div>

              {/* Color picker */}
              {isPickingColor && (
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <p className="text-sm font-medium text-gray-600 mb-3">Pick a color for {member.name?.split(" ")[0]}</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          startTransition(() => updateMemberColor(member.id, color));
                          setExpandedColorPicker(null);
                        }}
                        className="w-10 h-10 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {member.memberColor === color && (
                          <svg viewBox="0 0 12 12" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <polyline points="2,6 5,9 10,3" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar rows */}
              {!member.connected ? (
                <p className="text-sm text-gray-400 px-5 py-5">No Google account connected.</p>
              ) : member.calendars.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-5">Could not load calendars — try refreshing the page.</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {member.calendars.map((cal) => {
                    const visible = !hiddenCalendarIds.has(cal.id);
                    return (
                      <li
                        key={cal.id}
                        className="flex items-center gap-4 px-5 min-h-[64px] cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleCalendar(cal.id)}
                      >
                        <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: cal.color }} />
                        <span className="flex-1 text-base text-gray-800">{cal.name}</span>
                        <div className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${visible ? "bg-violet-600" : "bg-gray-200"}`}>
                          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${visible ? "translate-x-6" : "translate-x-1"}`} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
