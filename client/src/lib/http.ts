// Consistent JSON responses for route handlers.
import { NextResponse } from "next/server";

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}
export function accepted<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 202 });
}
export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: message, details }, { status: 400 });
}
export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}
export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}
export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}
export function serverError(message = "Internal error"): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}
