"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

async function getFamilyId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true },
  });
  if (!user?.familyId) throw new Error("No family group");
  return user.familyId;
}

export async function addGroceryItem(formData: FormData) {
  const session = await getSessionOrThrow();
  const familyId = await getFamilyId(session.user.id);
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  const category = formData.get("category");

  await prisma.groceryItem.create({
    data: {
      name: name.trim(),
      familyId,
      addedBy: session.user.id,
      category: typeof category === "string" && category ? category : null,
    },
  });
  revalidatePath("/grocery");
}

export async function toggleGroceryItem(id: string) {
  await getSessionOrThrow();
  const item = await prisma.groceryItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.groceryItem.update({ where: { id }, data: { checked: !item.checked } });
  revalidatePath("/grocery");
}

export async function deleteGroceryItem(id: string) {
  await getSessionOrThrow();
  await prisma.groceryItem.delete({ where: { id } });
  revalidatePath("/grocery");
}

export async function clearCheckedItems(familyId: string) {
  await getSessionOrThrow();
  await prisma.groceryItem.deleteMany({ where: { familyId, checked: true } });
  revalidatePath("/grocery");
}
