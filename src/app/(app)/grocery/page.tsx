import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addGroceryItem } from "./actions";
import GroceryList from "./GroceryList";

const CATEGORIES = ["Produce", "Dairy", "Meat", "Bakery", "Frozen", "Pantry", "Other"];

export default async function GroceryPage() {
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

  const items = await prisma.groceryItem.findMany({
    where: { familyId: user.familyId },
    include: { addedByUser: { select: { name: true } } },
    orderBy: [{ checked: "asc" }, { category: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="p-4 space-y-4">
      <form action={addGroceryItem} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <input
          name="name"
          placeholder="Add an item..."
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <select
            name="category"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      <GroceryList items={items} familyId={user.familyId} />
    </div>
  );
}
