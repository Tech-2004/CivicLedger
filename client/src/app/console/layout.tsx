import { PageContainer } from "@/components/shell/PageContainer";

export const runtime = "nodejs";

/**
 * Console routes render in the standard reading column. Navigation and identity
 * live in the app sidebar, so this layout draws no chrome of its own.
 *
 * It deliberately performs NO auth check. /console/sign-in is nested under this
 * layout, so redirecting unauthenticated visitors here would bounce the sign-in
 * page to itself forever. Enforcement belongs to the layers that can tell the
 * two apart: middleware (which gates /console/* while exempting the sign-in
 * path), the page-level operator checks, and RLS in the database.
 */
export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageContainer>{children}</PageContainer>;
}
