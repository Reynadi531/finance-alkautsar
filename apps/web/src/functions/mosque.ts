import { createServerFn } from "@tanstack/react-start";

import { authMiddleware } from "@/middleware/auth";
import { getMosqueName } from "@/server/mosque";

export const getAppShell = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const { name, email, role } = context.session.user;
    return {
      user: { name, email },
      mosqueName: await getMosqueName(),
      role: role ?? null,
    };
  });
