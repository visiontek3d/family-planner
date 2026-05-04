-- Migrate existing single todos into todo_lists before dropping
INSERT INTO "todo_lists" (id, title, done, "createdAt", "updatedAt", "familyId", "assignedTo")
SELECT id, title, done, "createdAt", "updatedAt", "familyId", "assignedTo"
FROM "todo_items"
ON CONFLICT (id) DO NOTHING;

-- DropForeignKey
ALTER TABLE "todo_items" DROP CONSTRAINT "todo_items_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "todo_items" DROP CONSTRAINT "todo_items_familyId_fkey";

-- DropTable
DROP TABLE "todo_items";
