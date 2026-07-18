// Auth.js route handlers (sign-in / callback / session / sign-out).
import { handlers } from "@/auth";

export const runtime = "nodejs";
export const { GET, POST } = handlers;
