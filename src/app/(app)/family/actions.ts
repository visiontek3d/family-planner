"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

function generateInviteCode() {
  return randomBytes(6).toString("hex");
}

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function createFamily(formData: FormData) {
  const session = await getSessionOrThrow();
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  const family = await prisma.family.create({
    data: { name: name.trim(), inviteCode: generateInviteCode() },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { familyId: family.id },
  });

  revalidatePath("/family");
  redirect("/family");
}

export async function joinFamily(formData: FormData) {
  const session = await getSessionOrThrow();
  const code = formData.get("code");
  if (typeof code !== "string" || !code.trim()) return;

  const family = await prisma.family.findUnique({
    where: { inviteCode: code.trim() },
  });

  if (!family) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { familyId: family.id },
  });

  revalidatePath("/family");
  redirect("/family");
}

export async function leaveFamily() {
  const session = await getSessionOrThrow();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { familyId: null },
  });

  revalidatePath("/family");
  redirect("/family");
}
