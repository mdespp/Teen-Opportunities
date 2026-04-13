"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function scrollToSection(id: string) {
  const element = document.getElementById(id);

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  function handleSectionClick(id: string) {
    if (isHomePage) {
      scrollToSection(id);
      setIsMobileMenuOpen(false);
      return;
    }

    window.location.href = `/#${id}`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8cabc] bg-[#f5eee8]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <a href="/" className="min-w-0">
          <p className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Teen Opportunities
          </p>
          <p className="text-sm text-zinc-600">For high school students</p>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          <button
            type="button"
            onClick={() => handleSectionClick("newsletter")}
            className="inline-block text-sm text-zinc-700 transition duration-150 hover:scale-105 hover:text-zinc-900"
          >
            Newsletter
          </button>

          <button
            type="button"
            onClick={() => handleSectionClick("submit")}
            className="inline-block text-sm text-zinc-700 transition duration-150 hover:scale-105 hover:text-zinc-900"
          >
            Submit
          </button>

          <button
            type="button"
            onClick={() => handleSectionClick("opportunities")}
            className="inline-block text-sm text-zinc-700 transition duration-150 hover:scale-105 hover:text-zinc-900"
          >
            Opportunities
          </button>

          <a
            href="https://buymeacoffee.com/teenopportunities"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-zinc-700 transition duration-150 hover:scale-105 hover:text-zinc-900"
          >
            Support Us
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cabc] text-zinc-700 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <span className="text-xl leading-none">
            {isMobileMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[#d8cabc] bg-[#f5eee8] px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleSectionClick("newsletter")}
              className="rounded-2xl border border-[#d8cabc] bg-white px-4 py-3 text-left text-sm text-zinc-700"
            >
              Newsletter
            </button>

            <button
              type="button"
              onClick={() => handleSectionClick("submit")}
              className="rounded-2xl border border-[#d8cabc] bg-white px-4 py-3 text-left text-sm text-zinc-700"
            >
              Submit
            </button>

            <button
              type="button"
              onClick={() => handleSectionClick("opportunities")}
              className="rounded-2xl border border-[#d8cabc] bg-white px-4 py-3 text-left text-sm text-zinc-700"
            >
              Opportunities
            </button>

            <a
              href="https://buymeacoffee.com/teenopportunities"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-[#d8cabc] bg-white px-4 py-3 text-sm text-zinc-700"
            >
              Support Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}