import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { createOAuth2Client } from "@/lib/googleCalendar";
import CalendarSettings from "./CalendarSettings";

export type MemberCalendarData = {
  id: string;
  name: string | null;
  image: string | null;
  memberColor: string;
  connected: boolean;
  showOnDashboard: boolean;
  calendars: { id: string; name: string; color: string }[];
};

const MEMBER_HEX_COLORS = ["#7C3AED", "#E11D48", "#059669", "#D97706"];

type GoogleAccount = { access_token: string | null; refresh_token: string | null };

type UserWithAccounts = {
  id: string;
  name: string | null;
  image: string | null;
  familyId: string | null;
  color: string | null;
  showOnDashboard: boolean;
  accounts: GoogleAccount[];
};

async function fetchCalendarList(account: GoogleAccount) {
  try {
    const oauth2Client = createOAuth2Client(account);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const list = await calendar.calendarList.list({ minAccessRole: "reader" });
    return (list.data.items ?? []).map((cal) => ({
      id: cal.id!,
      name: cal.summary ?? cal.id ?? "Calendar",
      color: cal.backgroundColor ?? "#6366F1",
    }));
  } catch (err) {
    console.error("[CalendarSettings] fetchCalendarList failed:", err);
    return null;
  }
}

export default async function CalendarSettingsPage() {
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
  }) as UserWithAccounts | null;

  if (!currentUser) return null;

  const allUsers: UserWithAccounts[] = currentUser.familyId
    ? (await prisma.user.findMany({
        where: { familyId: currentUser.familyId },
        include: {
          accounts: {
            where: { provider: "google" },
            select: { access_token: true, refresh_token: true },
          },
        },
      }) as UserWithAccounts[])
    : [currentUser];

  const members: MemberCalendarData[] = await Promise.all(
    allUsers.map(async (user, idx) => {
      const account = user.accounts[0];
      const hasAccount = !!(account?.access_token || account?.refresh_token);
      const result = hasAccount ? await fetchCalendarList(account) : null;
      return {
        id: user.id,
        name: user.name,
        image: user.image,
        memberColor: user.color ?? MEMBER_HEX_COLORS[idx % MEMBER_HEX_COLORS.length],
        connected: hasAccount,
        showOnDashboard: user.showOnDashboard,
        calendars: result ?? [],
      };
    })
  );

  return <CalendarSettings members={members} />;
}
