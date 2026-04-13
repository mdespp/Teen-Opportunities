"use client";

function scrollToSection(id: string) {
  const element = document.getElementById(id);

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="min-w-0">
          <p className="text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
            Internships, jobs, scholarships, pre-college, contests,
            volunteering, and more
          </p>

          <h1 className="mt-4 max-w-4xl text-[3rem] font-semibold leading-[0.95] tracking-tight text-zinc-900 sm:mt-5 sm:text-6xl lg:text-7xl">
            A better way to find opportunities for NYC high school students.
          </h1>

          <p className="mt-6 max-w-4xl text-base leading-8 text-zinc-600 sm:mt-8 sm:text-xl sm:leading-8">
            Browse internships, scholarships, pre-college programs, classes,
            contests, student events, startup opportunities, and more in one
            place.
          </p>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-500 sm:mt-6 sm:text-base">
            Always verify deadlines, eligibility, and details on the official
            source before applying.
          </p>

          <p className="mt-5 text-sm text-zinc-600 sm:mt-6 sm:text-base">
            For any inquiries, contact us at{" "}
            <a
              href="mailto:support@teenopportunities.com"
              className="underline underline-offset-4"
            >
              support@teenopportunities.com
            </a>
            .
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToSection("opportunities")}
              className="w-full rounded-[24px] bg-zinc-900 px-6 py-4 text-base font-medium text-white transition hover:opacity-90 sm:w-auto sm:px-8 sm:text-lg"
            >
              Browse opportunities
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("submit")}
              className="w-full rounded-[24px] border border-[#d8cabc] px-6 py-4 text-base font-medium text-zinc-700 transition hover:bg-white sm:w-auto sm:px-8 sm:text-lg"
            >
              Submit an opportunity
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#d8cabc] bg-white p-5 sm:p-8">
          <p className="text-sm text-zinc-500">What you can find here</p>

          <div className="mt-5 flex flex-wrap gap-3 sm:mt-6 sm:gap-4">
            {[
              "Internships",
              "Jobs",
              "Volunteering",
              "Scholarships",
              "Pre-College",
              "Courses",
              "Contests",
              "Startups",
              "Nonprofits",
              "Student Events",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#d8cabc] px-4 py-2 text-sm text-zinc-700 sm:text-base"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}