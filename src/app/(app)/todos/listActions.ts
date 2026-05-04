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

export async function toggleTodoList(id: string) {
  await getSessionOrThrow();
  const list = await prisma.todoList.findUnique({
    where: { id },
    include: { items: { select: { id: true } } },
  });
  if (!list) return;
  // Only allow direct toggle when there are no items
  if (list.items.length === 0) {
    await prisma.todoList.update({ where: { id }, data: { done: !list.done } });
  }
  revalidatePath("/todos");
  revalidatePath("/calendar");
}

export async function addTodoList(formData: FormData) {
  const session = await getSessionOrThrow();
  const familyId = await getFamilyId(session.user.id);
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) return;

  const assignedTo = formData.get("assignedTo");

  await prisma.todoList.create({
    data: {
      title: title.trim(),
      familyId,
      assignedTo: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
    },
  });
  revalidatePath("/todos");
  revalidatePath("/calendar");
}

export async function deleteTodoList(id: string) {
  await getSessionOrThrow();
  await prisma.todoList.delete({ where: { id } });
  revalidatePath("/todos");
  revalidatePath("/calendar");
}

export async function addTodoListItem(listId: string, title: string) {
  await getSessionOrThrow();
  const maxOrder = await prisma.todoListItem.aggregate({
    where: { listId },
    _max: { order: true },
  });
  await prisma.todoListItem.create({
    data: { title: title.trim(), listId, order: (maxOrder._max.order ?? -1) + 1 },
  });
  revalidatePath("/todos");
  revalidatePath("/calendar");
}

export async function toggleTodoListItem(itemId: string) {
  await getSessionOrThrow();
  const item = await prisma.todoListItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  const newDone = !item.done;
  await prisma.todoListItem.update({ where: { id: itemId }, data: { done: newDone } });

  // Auto-done: mark list done if all items are done
  const siblings = await prisma.todoListItem.findMany({
    where: { listId: item.listId },
    select: { id: true, done: true },
  });
  const allDone = siblings.every((s) => (s.id === itemId ? newDone : s.done));
  await prisma.todoList.update({ where: { id: item.listId }, data: { done: allDone } });

  revalidatePath("/todos");
  revalidatePath("/calendar");
}

export async function deleteTodoListItem(itemId: string) {
  await getSessionOrThrow();
  const item = await prisma.todoListItem.findUnique({ where: { id: itemId } });
  if (!item) return;

  await prisma.todoListItem.delete({ where: { id: itemId } });

  // Re-check auto-done after deletion
  const remaining = await prisma.todoListItem.findMany({
    where: { listId: item.listId },
    select: { done: true },
  });
  const allDone = remaining.length > 0 && remaining.every((s) => s.done);
  await prisma.todoList.update({ where: { id: item.listId }, data: { done: allDone } });

  revalidatePath("/todos");
  revalidatePath("/calendar");
}
