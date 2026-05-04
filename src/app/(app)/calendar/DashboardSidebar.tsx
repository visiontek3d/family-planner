"use client";

import { useTransition, useState } from "react";
import { addTodoList, toggleTodoList, deleteTodoList, addTodoListItem, toggleTodoListItem, deleteTodoListItem } from "../todos/listActions";
import { addGroceryItem, toggleGroceryItem, deleteGroceryItem } from "../grocery/actions";

type GroceryItem = {
  id: string;
  name: string;
  checked: boolean;
};

type Member = { id: string; name: string | null };

type TodoListItem = { id: string; title: string; done: boolean; order: number };
type TodoListData = {
  id: string;
  title: string;
  done: boolean;
  assignee: { name: string | null; showOnDashboard: boolean } | null;
  items: TodoListItem[];
};

type Props = {
  todoLists: TodoListData[];
  groceries: GroceryItem[];
  members: Member[];
  familyId: string;
};

export default function DashboardSidebar({ todoLists, groceries, members, familyId }: Props) {
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<"todos" | "grocery">("todos");

  const pendingCount = todoLists.filter((l) => !l.done).length;
  const pendingGroceries = groceries.filter((g) => !g.checked);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setTab("todos")}
          className={`flex-1 py-4 text-base font-semibold transition-colors ${
            tab === "todos" ? "text-violet-600 border-b-2 border-violet-600" : "text-gray-400"
          }`}
        >
          To-Dos
          {pendingCount > 0 && (
            <span className="ml-2 bg-violet-100 text-violet-600 text-sm rounded-full px-2 py-0.5">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("grocery")}
          className={`flex-1 py-4 text-base font-semibold transition-colors ${
            tab === "grocery" ? "text-violet-600 border-b-2 border-violet-600" : "text-gray-400"
          }`}
        >
          Grocery
          {pendingGroceries.length > 0 && (
            <span className="ml-2 bg-violet-100 text-violet-600 text-sm rounded-full px-2 py-0.5">
              {pendingGroceries.length}
            </span>
          )}
        </button>
      </div>

      {/* Add form */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {tab === "todos" ? (
          <form action={addTodoList} className="flex gap-2">
            <input
              name="title"
              placeholder="Add a to-do..."
              required
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="bg-violet-600 text-white rounded-xl px-5 py-3 text-base font-semibold hover:bg-violet-700 transition-colors min-w-[80px]"
            >
              Add
            </button>
          </form>
        ) : (
          <form action={addGroceryItem} className="flex gap-2">
            <input
              name="name"
              placeholder="Add an item..."
              required
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="bg-violet-600 text-white rounded-xl px-5 py-3 text-base font-semibold hover:bg-violet-700 transition-colors min-w-[80px]"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === "todos" ? (
          todoLists.length === 0 ? (
            <p className="text-center text-gray-400 text-base py-8">No to-dos yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {todoLists.map((list) => (
                <SidebarTodoCard key={list.id} list={list} />
              ))}
            </div>
          )
        ) : (
          groceries.length === 0 ? (
            <p className="text-center text-gray-400 text-base py-8">List is empty.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {groceries.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-4 py-4 min-h-[64px]">
                  <button
                    onClick={() => startTransition(() => toggleGroceryItem(item.id))}
                    className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.checked ? "bg-violet-600 border-violet-600" : "border-gray-300 hover:border-violet-400"
                    }`}
                  >
                    {item.checked && (
                      <svg viewBox="0 0 12 12" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-base ${item.checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => startTransition(() => deleteGroceryItem(item.id))}
                    className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 rounded-lg hover:bg-red-50"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}

function SidebarTodoCard({ list }: { list: TodoListData }) {
  const [, startTransition] = useTransition();
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState("");

  const isList = list.items.length > 0;
  const doneCount = list.items.filter((i) => i.done).length;

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    startTransition(() => addTodoListItem(list.id, newItem.trim()));
    setNewItem("");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 min-h-[60px]">
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
          <span className={`text-base ${list.done ? "line-through text-gray-400" : "text-gray-800"}`}>
            {list.title}
          </span>
          {list.assignee?.showOnDashboard && list.assignee.name && (
            <span className="ml-2 text-sm text-gray-400">{list.assignee.name.split(" ")[0]}</span>
          )}
        </div>

        <button
          onClick={() => setAddingItem((v) => !v)}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50 flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          onClick={() => startTransition(() => deleteTodoList(list.id))}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 rounded-lg hover:bg-red-50"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Items */}
      {list.items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 pl-12 pr-4 py-2.5 bg-gray-50/60">
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
          <span className={`flex-1 text-sm ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}>
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
        </div>
      ))}

      {/* Inline add-item form */}
      {addingItem && (
        <form onSubmit={handleAddItem} className="flex gap-2 pl-12 pr-4 py-2.5 bg-gray-50/60">
          <input
            autoFocus
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setAddingItem(false)}
            placeholder="Add item..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
          <button
            type="submit"
            className="bg-violet-600 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            Add
          </button>
        </form>
      )}
    </div>
  );
}
