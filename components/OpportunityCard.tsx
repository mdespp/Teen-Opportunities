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

type OpportunityCardProps = {
  opportunity: Opportunity;
};

function buildLogoPath(image?: string) {
  if (!image || !image.trim()) {
    return "/logos/default.png";
  }

  return `/logos/${image.trim().toLowerCase()}.png`;
}

export default function OpportunityCard({
  opportunity,
}: OpportunityCardProps) {
  return (
    <article className="rounded-3xl border border-[#d8cabc] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-[#eadfd4]">
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
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-zinc-600">{opportunity.type}</p>
              <h3 className="mt-1 text-lg font-medium tracking-tight text-zinc-900">
                {opportunity.title}
              </h3>
              <p className="mt-1 text-sm text-zinc-700">{opportunity.location}</p>
            </div>

            <span className="whitespace-nowrap text-sm text-zinc-600">
              {opportunity.applicationDeadlineLabel
                ? `Apply by ${opportunity.applicationDeadlineLabel}`
                : "Deadline unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {opportunity.grades.map((grade) => (
          <span
            key={grade}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
          >
            {grade}
          </span>
        ))}

        {opportunity.subjects.map((subject) => (
          <span
            key={subject}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
          >
            {subject}
          </span>
        ))}

        {opportunity.cost.map((item) => (
          <span
            key={item}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
          >
            {item}
          </span>
        ))}

        {opportunity.modality.map((item) => (
          <span
            key={item}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700"
          >
            {item}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-700">
        {opportunity.description}
      </p>

      <div className="mt-4 space-y-1 text-sm text-zinc-600">
        <p>
          <span className="font-medium text-zinc-800">Program starts:</span>{" "}
          {opportunity.programStartDateLabel || "N/A"}
        </p>
        <p>
          <span className="font-medium text-zinc-800">Program ends:</span>{" "}
          {opportunity.programEndDateLabel || "N/A"}
        </p>
        <p>
          <span className="font-medium text-zinc-800">Days:</span>{" "}
          {opportunity.days.length > 0 ? opportunity.days.join(", ") : "N/A"}
        </p>
      </div>

      <div className="mt-6">
        {opportunity.link ? (
          <a
            href={opportunity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50"
          >
            Open listing
          </a>
        ) : (
          <button className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50">
            View details
          </button>
        )}
      </div>
    </article>
  );
}