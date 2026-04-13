"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[#d8cabc] bg-[#f6efe8]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-zinc-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© 2026 Teen Opportunities. All rights reserved.</p>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/privacy" className="transition hover:text-zinc-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition hover:text-zinc-900">
            Terms of Use
          </Link>
          <a
            href="mailto:support@teenopportunities.com"
            className="transition hover:text-zinc-900"
          >
            support@teenopportunities.com
          </a>
        </div>
      </div>
    </footer>
  );
}