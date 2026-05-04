import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addTodoList } from "./listActions";
import TodoListsPanel from "./TodoListsPanel";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { familyId: true },
  });

  if (!user?.familyId) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>You&apos;re not in a family group yet.</p>
      </div>
    );
  }

  const [todoLists, members] = await Promise.all([
    prisma.todoList.findMany({
      where: { familyId: user.familyId },
      include: {
        assignee: { select: { id: true, name: true, showOnDashboard: true } },
        items: { orderBy: { order: "asc" } },
      },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findMany({
      where: { familyId: user.familyId, showOnDashboard: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="p-4 space-y-4">
      <form action={addTodoList} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <input
          name="title"
          placeholder="Add a to-do..."
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex gap-2">
          <select
            name="assignedTo"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Anyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? m.id}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-violet-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      <TodoListsPanel todoLists={todoLists} />
    </div>
  );
}
