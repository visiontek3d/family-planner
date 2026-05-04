"use client";

import { useTransition } from "react";
import { toggleGroceryItem, deleteGroceryItem, clearCheckedItems } from "./actions";

type GroceryItem = {
  id: string;
  name: string;
  checked: boolean;
  category: string | null;
  addedByUser: { name: string | null };
};

export default function GroceryList({
  items,
  familyId,
}: {
  items: GroceryItem[];
  familyId: string;
}) {
  const [, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">List is empty.</p>;
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const grouped = unchecked.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const key = item.category ?? "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{category}</p>
          <ul className="space-y-2">
            {categoryItems.map((item) => (
              <GroceryItemRow
                key={item.id}
                item={item}
                onToggle={() => startTransition(() => toggleGroceryItem(item.id))}
                onDelete={() => startTransition(() => deleteGroceryItem(item.id))}
              />
            ))}
          </ul>
        </div>
      ))}

      {checked.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">In cart</p>
            <button
              onClick={() => startTransition(() => clearCheckedItems(familyId))}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-2">
            {checked.map((item) => (
              <GroceryItemRow
                key={item.id}
                item={item}
                onToggle={() => startTransition(() => toggleGroceryItem(item.id))}
                onDelete={() => startTransition(() => deleteGroceryItem(item.id))}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function GroceryItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: GroceryItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          item.checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
        }`}
        aria-label={item.checked ? "Uncheck" : "Check off"}
      >
        {item.checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-900"}`}>
          {item.name}
        </p>
        {item.addedByUser.name && (
          <p className="text-xs text-gray-400">{item.addedByUser.name}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-400 transition-colors"
        aria-label="Delete"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </li>
  );
}
