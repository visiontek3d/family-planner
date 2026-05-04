"use client";

import { useTransition, useState } from "react";
import { deleteTodoList, toggleTodoList, addTodoListItem, toggleTodoListItem, deleteTodoListItem } from "./listActions";

type ListItem = { id: string; title: string; done: boolean; order: number };
type TodoListData = {
  id: string;
  title: string;
  done: boolean;
  assignee: { id: string; name: string | null; showOnDashboard: boolean } | null;
  items: ListItem[];
};

export default function TodoListsPanel({ todoLists }: { todoLists: TodoListData[] }) {
  if (todoLists.length === 0) {
    return <p className="text-center text-gray-400 text-base py-12">No to-dos yet.</p>;
  }

  const pending = todoLists.filter((l) => !l.done);
  const done = todoLists.filter((l) => l.done);

  return (
    <div className="space-y-2">
      {pending.map((list) => <TodoCard key={list.id} list={list} />)}
      {done.length > 0 && (
        <>
          <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide pt-2">Done</p>
          {done.map((list) => <TodoCard key={list.id} list={list} />)}
        </>
      )}
    </div>
  );
}

function TodoCard({ list }: { list: TodoListData }) {
  const [, startTransition] = useTransition();
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const isList = list.items.length > 0;
  const doneCount = list.items.filter((i) => i.done).length;

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    startTransition(() => addTodoListItem(list.id, newItem.trim()));
    setNewItem("");
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4 min-h-[64px]">
        {/* Checkbox — direct toggle for simple todos, shows progress ring for lists */}
        <button
          onClick={() => !isList && startTransition(() => toggleTodoList(list.id))}
          className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            isList
              ? "border-gray-200 cursor-default"
              : list.done
              ? "bg-violet-600 border-violet-600"
              : "border-gray-300 hover:border-violet-400"
          }`}
        >
          {!isList && list.done && (
            <svg viewBox="0 0 12 12" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="2,6 5,9 10,3" />
            </svg>
          )}
          {isList && (
            <span className="text-[9px] font-bold text-gray-400 leading-none">{doneCount}/{list.items.length}</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-base ${list.done ? "line-through text-gray-400" : "text-gray-900"}`}>
            {list.title}
          </p>
          {list.assignee?.showOnDashboard && list.assignee.name && (
            <p className="text-sm text-gray-400 mt-0.5">{list.assignee.name}</p>
          )}
        </div>

        {/* Add sub-item button */}
        <button
          onClick={() => setAddingItem((v) => !v)}
          title="Add item"
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          onClick={() => startTransition(() => deleteTodoList(list.id))}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Items */}
      {list.items.length > 0 && (
        <ul className="border-t border-gray-50 divide-y divide-gray-50">
          {list.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 pl-14 pr-5 py-3">
              <button
                onClick={() => startTransition(() => toggleTodoListItem(item.id))}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.done ? "bg-violet-600 border-violet-600" : "border-gray-300 hover:border-violet-400"
                }`}
              >
                {item.done && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${item.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                {item.title}
              </span>
              <button
                onClick={() => startTransition(() => deleteTodoListItem(item.id))}
                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Inline add-item form */}
      {addingItem && (
        <form onSubmit={handleAddItem} className="border-t border-gray-100 flex gap-2 pl-14 pr-5 py-3">
          <input
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setAddingItem(false)}
            placeholder="Add item..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            type="submit"
            className="bg-violet-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
