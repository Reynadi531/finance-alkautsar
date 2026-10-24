import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import z from "zod";

import { authMiddleware } from "@/middleware/auth";
import {
  ACTIVE_MOSQUE_COOKIE,
  listMemberships,
  resolveActiveMembership,
} from "@/server/mosque-access";

export const getAppShell = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const { memberships, active } = await resolveActiveMembership(context.session.user.id);
    return {
      user: { name: context.session.user.name, email: context.session.user.email },
      memberships,
      active,
    };
  });

export const setActiveMosque = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ mosqueId: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    if (!context.session) {
      throw new Error("Unauthorized");
    }
    const memberships = await listMemberships(context.session.user.id);
    if (!memberships.some((membership) => membership.mosqueId === data.mosqueId)) {
      throw new Error("Forbidden");
    }
    setCookie(ACTIVE_MOSQUE_COOKIE, data.mosqueId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  });
