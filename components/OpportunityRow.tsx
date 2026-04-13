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
  createdAt: string;
  connectedUsers: {
    id?: string;
    name: string;
    linkedinUrl: string;
    image?: string;
  }[];
};

type OpportunityRowProps = {
  opportunity: Opportunity;
};

function buildLogoPath(image?: string) {
  if (!image || !image.trim()) {
    return "/logos/default.png";
  }

  return `/logos/${image.trim().toLowerCase()}.png`;
}

export default function OpportunityRow({
  opportunity,
}: OpportunityRowProps) {
  return (
    <article className="rounded-2xl border border-[#d8cabc] bg-white p-4">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#eadfd4]">
          <img
            src={buildLogoPath(opportunity.image)}
            alt={opportunity.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith("/logos/default.png")) {
                target.src = "/logos/default.png";
              }
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-zinc-600">{opportunity.type}</p>
              <h3 className="truncate text-base font-medium tracking-tight text-zinc-900 sm:text-lg">
                {opportunity.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-700">{opportunity.location}</p>
            </div>

            <div className="shrink-0 text-sm text-zinc-600">
              {opportunity.applicationDeadlineLabel
                ? `Apply by ${opportunity.applicationDeadlineLabel}`
                : "Deadline unknown"}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {opportunity.grades.map((grade) => (
              <span
                key={grade}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700"
              >
                {grade}
              </span>
            ))}

            {opportunity.subjects.map((subject) => (
              <span
                key={subject}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700"
              >
                {subject}
              </span>
            ))}

            {opportunity.cost.map((item) => (
              <span
                key={item}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {opportunity.link ? (
              <a
                href={opportunity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-zinc-300 px-4 py-2 text-center text-sm font-medium transition hover:bg-zinc-50"
              >
                Open listing
              </a>
            ) : (
              <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50">
                View details
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}