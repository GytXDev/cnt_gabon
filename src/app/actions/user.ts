"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

export async function checkIsAdmin(): Promise<boolean> {
  const { userId } = auth();
  if (!userId) return false;

  const userRecord = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  return userRecord?.role === "admin";
}
