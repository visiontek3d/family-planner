import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google, type calendar_v3 } from "googleapis";
import { createOAuth2Client } from "@/lib/googleCalendar";
import CalendarView from "./CalendarView";

export type CalendarInfo = {
  id: string;
  name: string;
  color: string;
};

export type EventWithColor = {
  event: calendar_v3.Schema$Event;
  calendarId: string;
  calendarColor: string;
};

type GoogleAccount = { access_token: string | null; refresh_token: string | null };

type MemberWithAccounts = Awaited<
  ReturnType<typeof prisma.user.findMany>
>[number] & { accounts: GoogleAccount[] };

const MEMBER_HEX_COLORS = ["#7C3AED", "#E11D48", "#059669", "#D97706"];

async function fetchMemberCalendarData(account: GoogleAccount): Promise<{ calendars: CalendarInfo[]; events: EventWithColor[] }> {
  try {
    const oauth2Client = createOAuth2Client(account);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 1);

    const calendarList = await calendar.calendarList.list({ minAccessRole: "reader" });
    const calItems = calendarList.data.items ?? [];

    const calendarInfos: CalendarInfo[] = calItems.map((cal) => ({
      id: cal.id!,
      name: cal.summary ?? cal.id ?? "Calendar",
      color: cal.backgroundColor ?? "#6366F1",
    }));

    const results = await Promise.allSettled(
      calItems.map(async (cal) => {
        const res = await calendar.events.list({
          calendarId: cal.id!,
          timeMin: now.toISOString(),
          timeMax: end.toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: "startTime",
        });
        const color = cal.backgroundColor ?? "#6366F1";
        return (res.data.items ?? []).map((event) => ({
          event,
          calendarId: cal.id!,
          calendarColor: color,
        }));
      })
    );

    const events = results
      .filter((r): r is PromiseFulfilledResult<EventWithColor[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    return { calendars: calendarInfos, events };
  } catch {
    return { calendars: [], events: [] };
  }
}

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        where: { provider: "google" },
        select: { access_token: true, refresh_token: true },
      },
    },
  }) as MemberWithAccounts | null;

  if (!currentUser) return null;

  const familyMembers = currentUser.familyId
    ? await prisma.user.findMany({
        where: { familyId: currentUser.familyId, id: { not: session.user.id } },
        include: {
          accounts: {
            where: { provider: "google" },
            select: { access_token: true, refresh_token: true },
          },
        },
      }) as MemberWithAccounts[]
    : [];

  const allUsers = [currentUser, ...familyMembers];
  const displayUsers = allUsers.filter((u) => u.showOnDashboard);

  const [memberEventResults, todoLists, groceries, members] = await Promise.all([
    Promise.allSettled(
      displayUsers.map(async (member, idx) => {
        const googleAccount = member.accounts[0];
        const memberColor = member.color ?? MEMBER_HEX_COLORS[idx % MEMBER_HEX_COLORS.length];
        if (!googleAccount?.access_token && !googleAccount?.refresh_token) {
          return { member, calendars: [] as CalendarInfo[], events: [] as EventWithColor[], memberColor };
        }
        const { calendars, events } = await fetchMemberCalendarData(googleAccount);
        return { member, calendars, events, memberColor };
      })
    ),
    currentUser.familyId
      ? prisma.todoList.findMany({
          where: { familyId: currentUser.familyId },
          include: {
            assignee: { select: { name: true, showOnDashboard: true } },
            items: { orderBy: { order: "asc" } },
          },
          orderBy: [{ done: "asc" }, { createdAt: "desc" }],
        })
      : [],
    currentUser.familyId
      ? prisma.groceryItem.findMany({
          where: { familyId: currentUser.familyId },
          orderBy: [{ checked: "asc" }, { createdAt: "desc" }],
        })
      : [],
    currentUser.familyId
      ? prisma.user.findMany({
          where: { familyId: currentUser.familyId, showOnDashboard: true },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const allMemberEvents = memberEventResults
    .filter((r): r is PromiseFulfilledResult<{ member: MemberWithAccounts; calendars: CalendarInfo[]; events: EventWithColor[]; memberColor: string }> =>
      r.status === "fulfilled"
    )
    .map((r) => ({
      member: { id: r.value.member.id, name: r.value.member.name, image: r.value.member.image },
      calendars: r.value.calendars,
      events: r.value.events,
      memberColor: r.value.memberColor,
    }));

  return (
    <CalendarView
      memberEvents={allMemberEvents}
      todoLists={todoLists}
      groceries={groceries}
      members={members}
      familyId={currentUser.familyId ?? null}
    />
  );
}
