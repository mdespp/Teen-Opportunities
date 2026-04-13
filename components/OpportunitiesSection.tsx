"use client";

import { useEffect, useMemo, useState } from "react";
import FiltersPanel from "@/components/FiltersPanel";
import OpportunityAccordionItem from "@/components/OpportunityAccordionItem";
import { opportunities as fallbackOpportunities } from "@/data/opportunities";

type FiltersState = {
  type: string[];
  grade: string[];
  subject: string[];
  cost: string[];
  days: string[];
  timing: string[];
  deadlineStatus: string[];
  modality: string[];
  applicationDeadlineFrom: string;
  applicationDeadlineTo: string;
  programStartDate: string;
  programEndDate: string;
};

type SortOption = "deadline" | "newest" | "az";

type ConnectedUser = {
  id: string;
  name: string;
  linkedinUrl: string;
  image?: string;
};

type Opportunity = {
  id: number;
  type: string;
  title: string;
  location: string;
  modality: string[];
  applicationDeadline: string;
  applicationDeadlineLabel: string;
  programStartDate: string;
  programStartDateLabel: string;
  programEndDate: string;
  programEndDateLabel: string;
  days: string[];
  grades: string[];
  subjects: string[];
  cost: string[];
  image?: string;
  link?: string;
  description: string;
  createdAt?: string;
  studentLed?: boolean;
  connectedUsers: ConnectedUser[];
};

function getTodayNY() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
  }).format(new Date());
}

function hasAnyOverlap(selected: string[], values: string[]) {
  if (selected.length === 0) return true;
  return selected.some((item) => values.includes(item));
}

function matchesDaysFilter(selectedDays: string[], opportunityDays: string[]) {
  if (selectedDays.length === 0) return true;

  const specialOptions = ["Flexible", "One-time"];
  const selectedSpecial = selectedDays.filter((day) => specialOptions.includes(day));
  const selectedRegular = selectedDays.filter((day) => !specialOptions.includes(day));

  const opportunityHasSpecial = selectedSpecial.some((day) =>
    opportunityDays.includes(day)
  );

  if (selectedRegular.length === 0) {
    return selectedSpecial.length === 0 ? true : opportunityHasSpecial;
  }

  const matchesRegularDays = selectedRegular.every((day) =>
    opportunityDays.includes(day)
  );

  if (selectedSpecial.length === 0) {
    return matchesRegularDays;
  }

  return matchesRegularDays || opportunityHasSpecial;
}

function diffInDays(fromDate: string, toDate: string) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function getDeadlineStatus(opportunity: Opportunity) {
  if (opportunity.applicationDeadline) return "fixed";

  const label = normalizeText(opportunity.applicationDeadlineLabel);

  if (label.includes("rolling")) return "rolling";
  return "unknown";
}

function isExpiredOpportunity(opportunity: Opportunity) {
  if (getDeadlineStatus(opportunity) !== "fixed") return false;
  if (!opportunity.applicationDeadline) return false;

  const today = getTodayNY();
  return opportunity.applicationDeadline < today;
}

function matchesDeadlineStatusFilter(
  selectedStatuses: string[],
  opportunity: Opportunity
) {
  if (selectedStatuses.length === 0) return true;

  const status = getDeadlineStatus(opportunity);

  return selectedStatuses.some((selected) => {
    if (selected === "Fixed deadline") return status === "fixed";
    if (selected === "Rolling basis") return status === "rolling";
    if (selected === "Unknown") return status === "unknown";
    return false;
  });
}

function sortOpportunities(items: Opportunity[], sortBy: SortOption) {
  const sorted = [...items];

  if (sortBy === "deadline") {
    sorted.sort((a, b) => {
      const aStatus = getDeadlineStatus(a);
      const bStatus = getDeadlineStatus(b);

      const aValue =
        aStatus === "fixed" && a.applicationDeadline
          ? a.applicationDeadline
          : "9999-12-31";
      const bValue =
        bStatus === "fixed" && b.applicationDeadline
          ? b.applicationDeadline
          : "9999-12-31";

      return aValue.localeCompare(bValue);
    });
    return sorted;
  }

  if (sortBy === "newest") {
    sorted.sort((a, b) => {
      const aValue = a.createdAt || "0000-00-00";
      const bValue = b.createdAt || "0000-00-00";
      return bValue.localeCompare(aValue);
    });
    return sorted;
  }

  sorted.sort((a, b) => a.title.localeCompare(b.title));
  return sorted;
}

export default function OpportunitiesSection() {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");
  const [openOpportunityId, setOpenOpportunityId] = useState<number | null>(null);
  const [opportunities, setOpportunities] =
    useState<Opportunity[]>(fallbackOpportunities as Opportunity[]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [filters, setFilters] = useState<FiltersState>({
    type: [],
    grade: [],
    subject: [],
    cost: [],
    days: [],
    timing: [],
    deadlineStatus: [],
    modality: [],
    applicationDeadlineFrom: "",
    applicationDeadlineTo: "",
    programStartDate: "",
    programEndDate: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOpportunities() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch("/api/opportunities", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load opportunities");
        }

        const data = await response.json();

        if (isMounted && Array.isArray(data.opportunities)) {
          setOpportunities(data.opportunities);
        }
      } catch (error) {
        console.error("Using fallback opportunities data:", error);

        if (isMounted) {
          setLoadError("Could not load live data. Showing local fallback data.");
          setOpportunities(fallbackOpportunities as Opportunity[]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOpportunities();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOpportunities = useMemo(() => {
    const today = getTodayNY();
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesType =
        filters.type.length === 0 || filters.type.includes(opportunity.type);

      const matchesGrade = hasAnyOverlap(filters.grade, opportunity.grades);
      const matchesSubject = hasAnyOverlap(filters.subject, opportunity.subjects);
      const matchesCost = hasAnyOverlap(filters.cost, opportunity.cost);
      const matchesModality = hasAnyOverlap(filters.modality, opportunity.modality);
      const matchesDays = matchesDaysFilter(filters.days, opportunity.days);
      const matchesDeadlineStatus = matchesDeadlineStatusFilter(
        filters.deadlineStatus,
        opportunity
      );

      const matchesApplicationDeadlineFrom =
        !filters.applicationDeadlineFrom ||
        !opportunity.applicationDeadline ||
        opportunity.applicationDeadline >= filters.applicationDeadlineFrom;

      const matchesApplicationDeadlineTo =
        !filters.applicationDeadlineTo ||
        !opportunity.applicationDeadline ||
        opportunity.applicationDeadline <= filters.applicationDeadlineTo;

      const matchesProgramStartDate =
        !filters.programStartDate ||
        !opportunity.programStartDate ||
        opportunity.programStartDate >= filters.programStartDate;

      const matchesProgramEndDate =
        !filters.programEndDate ||
        !opportunity.programEndDate ||
        opportunity.programEndDate <= filters.programEndDate;

      const matchesTiming =
        filters.timing.length === 0 ||
        filters.timing.some((timing) => {
          if (timing === "Due soon") {
            if (!opportunity.applicationDeadline) return false;
            const daysUntilDeadline = diffInDays(today, opportunity.applicationDeadline);
            return daysUntilDeadline >= 0 && daysUntilDeadline <= 3;
          }

          if (timing === "Starting soon") {
            if (!opportunity.programStartDate) return false;
            const daysUntilStart = diffInDays(today, opportunity.programStartDate);
            return daysUntilStart >= 0 && daysUntilStart <= 3;
          }

          if (timing === "Newly added") {
            if (!opportunity.createdAt) return false;
            const daysSinceAdded = diffInDays(opportunity.createdAt, today);
            return daysSinceAdded >= 0 && daysSinceAdded <= 3;
          }

          return true;
        });

      const searchableText = [
        opportunity.title,
        opportunity.location,
        opportunity.type,
        opportunity.description,
        opportunity.applicationDeadlineLabel,
        opportunity.programStartDateLabel,
        opportunity.programEndDateLabel,
        ...opportunity.subjects,
        ...opportunity.grades,
        ...opportunity.modality,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return (
        matchesType &&
        matchesGrade &&
        matchesSubject &&
        matchesCost &&
        matchesModality &&
        matchesDays &&
        matchesDeadlineStatus &&
        matchesApplicationDeadlineFrom &&
        matchesApplicationDeadlineTo &&
        matchesProgramStartDate &&
        matchesProgramEndDate &&
        matchesTiming &&
        matchesSearch
      );
    });
  }, [filters, searchQuery, opportunities]);

  const activeOpportunities = sortOpportunities(
    filteredOpportunities.filter((opportunity) => !isExpiredOpportunity(opportunity)),
    sortBy
  );

  const expiredOpportunities = sortOpportunities(
    filteredOpportunities.filter((opportunity) => isExpiredOpportunity(opportunity)),
    sortBy
  );

  return (
    <section
      id="opportunities"
      className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mb-8">
        <p className="text-sm text-zinc-600">Browse</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Opportunities
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Information may change. Always confirm details, deadlines, and
          eligibility on the official listing before applying.
        </p>
        {isLoading && (
          <p className="mt-2 text-sm text-zinc-500">Loading live opportunities...</p>
        )}
        {loadError && (
          <p className="mt-2 text-sm text-amber-700">{loadError}</p>
        )}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-sm text-zinc-600">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject, location, or keyword"
            className="w-full rounded-2xl border border-[#d8cabc] bg-white px-5 py-4 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-600">Sort by</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSortBy("deadline")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                sortBy === "deadline"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Deadline soonest
            </button>
            <button
              type="button"
              onClick={() => setSortBy("newest")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                sortBy === "newest"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy("az")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                sortBy === "az"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              A–Z
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-[28px] border border-[#d8cabc] bg-white p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-base font-medium text-zinc-900">Filters</p>
            <p className="text-sm text-zinc-600">
              Narrow down opportunities by type, date, cost, subject, and more
            </p>
          </div>
          <span className="text-lg text-zinc-500">{showFilters ? "−" : "+"}</span>
        </button>

        {showFilters && (
          <div className="mt-6 border-t border-[#efe4d8] pt-6">
            <FiltersPanel filters={filters} setFilters={setFilters} />
          </div>
        )}
      </div>

      <div className="mb-4 text-sm text-zinc-600">
        Showing {filteredOpportunities.length} opportunit
        {filteredOpportunities.length === 1 ? "y" : "ies"}
      </div>

      <div className="space-y-4">
        {activeOpportunities.map((item) => (
          <OpportunityAccordionItem
            key={item.id}
            opportunity={item}
            isExpired={false}
            isOpen={openOpportunityId === item.id}
            onToggle={() =>
              setOpenOpportunityId((current) =>
                current === item.id ? null : item.id
              )
            }
          />
        ))}
      </div>

      {expiredOpportunities.length > 0 && (
        <div className="mt-10">
          <div className="mb-4">
            <p className="text-sm text-zinc-500">Still visible</p>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-700">
              Expired
            </h3>
          </div>

          <div className="space-y-4">
            {expiredOpportunities.map((item) => (
              <OpportunityAccordionItem
                key={item.id}
                opportunity={item}
                isExpired={true}
                isOpen={openOpportunityId === item.id}
                onToggle={() =>
                  setOpenOpportunityId((current) =>
                    current === item.id ? null : item.id
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}