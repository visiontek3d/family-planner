import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { createFamily, joinFamily, leaveFamily } from "./actions";
import CopyButton from "@/components/CopyButton";

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      family: {
        include: { members: { select: { id: true, name: true, image: true, email: true } } },
      },
    },
  });

  if (!user) return null;

  if (!user.family) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-gray-500 text-center py-2">
          Create a family group or join one with an invite code.
        </p>

        <form action={createFamily} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <p className="font-medium text-sm text-gray-700">Create a new group</p>
          <input
            name="name"
            placeholder="Family name (e.g. The Pennocks)"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create Group
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form action={joinFamily} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <p className="font-medium text-sm text-gray-700">Join with an invite code</p>
          <input
            name="code"
            placeholder="Paste invite code..."
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-gray-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Join Group
          </button>
        </form>
      </div>
    );
  }

  const inviteLink = `Join my family on Family Planner! Use invite code: ${user.family.inviteCode}`;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900">{user.family.name}</p>
          <span className="text-xs text-gray-400">{user.family.members.length} member{user.family.members.length !== 1 ? "s" : ""}</span>
        </div>
        <ul className="space-y-2">
          {user.family.members.map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              {member.image ? (
                <Image src={member.image} alt="" width={32} height={32} className="rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                  {member.name?.[0] ?? "?"}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{member.name ?? "Unknown"}</p>
                <p className="text-xs text-gray-400">{member.email}</p>
              </div>
              {member.id === session.user.id && (
                <span className="ml-auto text-xs text-gray-300">you</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <p className="font-medium text-sm text-gray-700">Invite code</p>
        <p className="text-xs text-gray-500">Share this code with family members so they can join.</p>
        <div className="flex gap-2">
          <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 truncate">
            {user.family.inviteCode}
          </code>
          <CopyButton text={inviteLink} />
        </div>
      </div>

      <form action={leaveFamily}>
        <button
          type="submit"
          className="w-full text-sm text-red-400 hover:text-red-600 py-2 transition-colors"
        >
          Leave group
        </button>
      </form>
    </div>
  );
}

