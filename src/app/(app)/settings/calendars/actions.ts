"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateShowOnDashboard(memberId: string, show: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { familyId: true } }),
    prisma.user.findUnique({ where: { id: memberId }, select: { familyId: true } }),
  ]);

  const isSelf = memberId === session.user.id;
  const isFamilyMember =
    currentUser?.familyId && currentUser.familyId === targetUser?.familyId;

  if (!isSelf && !isFamilyMember) throw new Error("Unauthorized");

  await prisma.user.update({ where: { id: memberId }, data: { showOnDashboard: show } });

  revalidatePath("/calendar");
  revalidatePath("/settings/calendars");
}

export async function updateMemberColor(memberId: string, color: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { familyId: true } }),
    prisma.user.findUnique({ where: { id: memberId }, select: { familyId: true } }),
  ]);

  const isSelf = memberId === session.user.id;
  const isFamilyMember =
    currentUser?.familyId && currentUser.familyId === targetUser?.familyId;

  if (!isSelf && !isFamilyMember) throw new Error("Unauthorized");

  await prisma.user.update({ where: { id: memberId }, data: { color } });

  revalidatePath("/calendar");
  revalidatePath("/settings/calendars");
}
