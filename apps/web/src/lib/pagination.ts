import z from "zod";

/** `page` search param: 1-based, falls back to 1 when missing or invalid. */
export const pageParam = z.coerce.number().int().min(1).optional().catch(undefined);

export function pageOffset(page: number | undefined, pageSize: number) {
  return ((page ?? 1) - 1) * pageSize;
}
