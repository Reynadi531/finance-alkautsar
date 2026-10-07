import { createAuth } from "@keuangan-alkautsar/auth";
import { createDb } from "@keuangan-alkautsar/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
