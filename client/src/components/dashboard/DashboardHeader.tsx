"use client";

import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="dash-header">
      <div className="dash-header-logo">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ededef"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 21h18"></path>
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
          <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path>
        </svg>
        CivicLedger
      </div>
      <nav className="dash-header-nav">
        <Link href="/dashboard" className="active">
          Dashboard
        </Link>
        <Link href="/report">Submit Report</Link>
        <Link href="#">FAQ</Link>
      </nav>
      <input
        type="text"
        className="dash-header-search"
        placeholder="Search..."
      />
      <div className="dash-header-user">
        <Link href="/console/sign-in" style={{ color: "#ededef", marginLeft: 8 }}>
          Staff sign-in
        </Link>
      </div>
    </header>
  );
}
