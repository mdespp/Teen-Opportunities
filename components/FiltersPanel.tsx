"use client";

import { filterOptions } from "@/data/filters";

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

type FiltersPanelProps = {
  filters: FiltersState;
  setFilters: React.Dispatch<React.SetStateAction<FiltersState>>;
};

type FilterGroupProps = {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
};

function FilterGroup({
  label,
  items,
  selected,
  onToggle,
}: FilterGroupProps) {
  return (
    <div>
      <label className="mb-2 block text-sm text-zinc-600">{label}</label>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                isSelected
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FiltersPanel({
  filters,
  setFilters,
}: FiltersPanelProps) {
  function toggleArrayFilter(
    key: keyof Pick<
      FiltersState,
      | "type"
      | "grade"
      | "subject"
      | "cost"
      | "days"
      | "timing"
      | "deadlineStatus"
      | "modality"
    >,
    value: string
  ) {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        [key]: next,
      };
    });
  }

  function clearAll() {
    setFilters({
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
  }

  return (
    <div className="rounded-[28px] border border-[#d8cabc] bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-600">Filters</p>
          <p className="text-sm text-zinc-500">
            You can combine multiple filters at once
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm text-zinc-600">
            Application deadline from
          </label>
          <input
            type="date"
            value={filters.applicationDeadlineFrom}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                applicationDeadlineFrom: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-600">
            Application deadline to
          </label>
          <input
            type="date"
            value={filters.applicationDeadlineTo}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                applicationDeadlineTo: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-600">
            Program starts
          </label>
          <input
            type="date"
            value={filters.programStartDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                programStartDate: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-600">Program ends</label>
          <input
            type="date"
            value={filters.programEndDate}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                programEndDate: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <FilterGroup
          label="Type / section"
          items={filterOptions.type}
          selected={filters.type}
          onToggle={(item) => toggleArrayFilter("type", item)}
        />

        <FilterGroup
          label="Grade"
          items={filterOptions.grade}
          selected={filters.grade}
          onToggle={(item) => toggleArrayFilter("grade", item)}
        />

        <FilterGroup
          label="Subject"
          items={filterOptions.subject}
          selected={filters.subject}
          onToggle={(item) => toggleArrayFilter("subject", item)}
        />

        <FilterGroup
          label="Pay / cost"
          items={filterOptions.cost}
          selected={filters.cost}
          onToggle={(item) => toggleArrayFilter("cost", item)}
        />

        <FilterGroup
          label="Days it runs"
          items={filterOptions.days}
          selected={filters.days}
          onToggle={(item) => toggleArrayFilter("days", item)}
        />

        <FilterGroup
          label="Timing"
          items={filterOptions.timing}
          selected={filters.timing}
          onToggle={(item) => toggleArrayFilter("timing", item)}
        />

        <FilterGroup
          label="Deadline status"
          items={filterOptions.deadlineStatus}
          selected={filters.deadlineStatus}
          onToggle={(item) => toggleArrayFilter("deadlineStatus", item)}
        />

        <FilterGroup
          label="Online / hybrid / in person"
          items={filterOptions.modality}
          selected={filters.modality}
          onToggle={(item) => toggleArrayFilter("modality", item)}
        />
      </div>
    </div>
  );
}