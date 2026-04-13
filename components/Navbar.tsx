"use client";

import Image from "next/image";
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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-12">
        <a href="/" className="min-w-0 flex-1">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-full sm:h-[3.75rem] sm:w-[3.75rem]">
              <Image
                src="/logos/logo.png"
                alt="Teen Opportunities logo"
                fill
                sizes="(max-width: 640px) 52px, 60px"
                className="object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[1.05rem] font-semibold leading-tight tracking-tight text-zinc-900 sm:text-2xl">
                Teen Opportunities
              </p>
              <p className="truncate text-sm leading-tight text-zinc-600 sm:text-base">
                For high school students
              </p>
            </div>
          </div>
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
          className="ml-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d8cabc] text-zinc-700 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <span className="text-xl leading-none">
            {isMobileMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-[#d8cabc] bg-[#f5eee8] px-4 py-4 md:hidden">
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