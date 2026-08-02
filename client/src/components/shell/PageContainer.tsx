/**
 * Standard reading column for regular pages. Full-bleed screens (the dashboard)
 * simply don't use it.
 *
 * Kept in its own module, apart from AppShell: AppShell imports `auth`, which
 * pulls in @civicledger/server and the pg driver. Client components need this
 * container, and importing it from AppShell would drag a native database driver
 * into the browser bundle - which fails the build with "Can't resolve 'net'".
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-20 pt-14 md:pt-7">
      {children}
    </div>
  );
}
