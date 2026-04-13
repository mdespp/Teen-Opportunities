"use client";

import { useEffect, useState } from "react";
import LinkedInPostForm from "@/components/LinkedInPostForm";
import LinkedInRemoveForm from "@/components/LinkedInRemoveForm";
import ConnectedUsersList from "@/components/ConnectedUsersList";
import ReportIssueForm from "@/components/ReportIssueForm";

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

type OpportunityAccordionItemProps = {
  opportunity: Opportunity;
  isExpired?: boolean;
  isOpen: boolean;
  onToggle: () => void;
};

function isNewOpportunity(createdAt?: string) {
  if (!createdAt) return false;

  const created = new Date(createdAt);
  const today = new Date("2026-04-08");
  const diffMs = today.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 3;
}

function buildLogoPath(image?: string) {
  if (!image || !image.trim()) {
    return "";
  }

  return `/logos/${image.trim().toLowerCase()}.png`;
}

export default function OpportunityAccordionItem({
  opportunity,
  isExpired = false,
  isOpen,
  onToggle,
}: OpportunityAccordionItemProps) {
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>(
    opportunity.connectedUsers || []
  );
  const [isPostingLinkedIn, setIsPostingLinkedIn] = useState(false);
  const [isRemovingLinkedIn, setIsRemovingLinkedIn] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const isNew = isNewOpportunity(opportunity.createdAt);
  const hasLogo = Boolean(opportunity.image && opportunity.image.trim());

  useEffect(() => {
    setConnectedUsers(opportunity.connectedUsers || []);
  }, [opportunity.connectedUsers]);

  useEffect(() => {
    if (!isOpen) {
      setIsPostingLinkedIn(false);
      setIsRemovingLinkedIn(false);
      setIsReportingIssue(false);
      setActionMessage("");
      setActionError("");
    }
  }, [isOpen]);

  const outerClasses = isExpired
    ? "overflow-hidden rounded-3xl border border-zinc-300 bg-zinc-100"
    : "overflow-hidden rounded-3xl border border-[#d8cabc] bg-white";

  const hoverClasses = isExpired ? "hover:bg-zinc-200/60" : "hover:bg-[#faf6f2]";
  const mutedText = isExpired ? "text-zinc-500" : "text-zinc-600";
  const titleText = isExpired ? "text-zinc-700" : "text-zinc-900";
  const borderTop = isExpired ? "border-zinc-300" : "border-[#eadfd4]";
  const pillBorder = isExpired
    ? "border-zinc-300 bg-zinc-50 text-zinc-600"
    : "border-zinc-200 bg-white text-zinc-700";
  const detailsBox =
    "mt-6 rounded-[24px] border border-[#cfe0fb] bg-[#edf5ff] p-4 sm:p-5";

  return (
    <article className={outerClasses}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition sm:px-6 ${hoverClasses}`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={`text-sm ${mutedText}`}>{opportunity.type}</p>
            <span className="text-zinc-300">•</span>
            <p className={`text-sm ${mutedText}`}>{opportunity.location}</p>
            <span className="text-zinc-300">•</span>
            <p className={`text-sm ${mutedText}`}>
              {opportunity.modality.join(", ")}
            </p>

            {opportunity.studentLed && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                  Student-led
                </span>
              </>
            )}

            {isNew && !isExpired && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                  New
                </span>
              </>
            )}

            {isExpired && (
              <>
                <span className="text-zinc-300">•</span>
                <span className="rounded-full bg-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  Expired
                </span>
              </>
            )}
          </div>

          <h3
            className={`mt-1 truncate text-lg font-medium tracking-tight ${titleText}`}
          >
            {opportunity.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className={`hidden whitespace-nowrap text-sm sm:block ${mutedText}`}>
            {opportunity.applicationDeadlineLabel
              ? `Apply by ${opportunity.applicationDeadlineLabel}`
              : "Deadline unknown"}
          </span>
          <span className="text-lg text-zinc-500">{isOpen ? "−" : "+"}</span>
        </div>
      </button>

      {isOpen && (
        <div className={`border-t px-5 py-5 sm:px-6 sm:py-6 ${borderTop}`}>
          <div className="flex items-start gap-4">
            {hasLogo && (
              <div className="h-[80px] w-[80px] shrink-0 overflow-hidden rounded-2xl border border-[#eadfd4] bg-white">
                <img
                  src={buildLogoPath(opportunity.image)}
                  alt={opportunity.title}
                  className={`h-full w-full object-cover bg-white ${
                    isExpired ? "opacity-70 grayscale-[25%]" : ""
                  }`}
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm ${mutedText}`}>{opportunity.type}</p>

                    {opportunity.studentLed && (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                        Student-led
                      </span>
                    )}

                    {isNew && !isExpired && (
                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                        New
                      </span>
                    )}

                    {isExpired && (
                      <span className="rounded-full bg-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        Expired
                      </span>
                    )}
                  </div>

                  <h4 className={`text-xl font-medium tracking-tight ${titleText}`}>
                    {opportunity.title}
                  </h4>
                  <p className={`mt-1 text-sm ${mutedText}`}>
                    {opportunity.location}
                  </p>
                </div>

                <span className={`shrink-0 text-sm ${mutedText}`}>
                  {opportunity.applicationDeadlineLabel
                    ? `Apply by ${opportunity.applicationDeadlineLabel}`
                    : "Deadline unknown"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {opportunity.grades.map((grade) => (
                  <span
                    key={grade}
                    className={`rounded-full border px-3 py-1.5 text-xs ${pillBorder}`}
                  >
                    {grade}
                  </span>
                ))}

                {opportunity.subjects.map((subject) => (
                  <span
                    key={subject}
                    className={`rounded-full border px-3 py-1.5 text-xs ${pillBorder}`}
                  >
                    {subject}
                  </span>
                ))}

                {opportunity.cost.map((costItem) => (
                  <span
                    key={costItem}
                    className={`rounded-full border px-3 py-1.5 text-xs ${pillBorder}`}
                  >
                    {costItem}
                  </span>
                ))}

                {opportunity.modality.map((mode) => (
                  <span
                    key={mode}
                    className={`rounded-full border px-3 py-1.5 text-xs ${pillBorder}`}
                  >
                    {mode}
                  </span>
                ))}
              </div>

              <p
                className={`mt-4 text-sm leading-6 ${
                  isExpired ? "text-zinc-600" : "text-zinc-700"
                }`}
              >
                {opportunity.description}
              </p>

              <div className={`mt-4 space-y-1 text-sm ${mutedText}`}>
                <p>
                  <span
                    className={
                      isExpired ? "font-medium text-zinc-700" : "font-medium text-zinc-800"
                    }
                  >
                    Program starts:
                  </span>{" "}
                  {opportunity.programStartDateLabel || "N/A"}
                </p>
                <p>
                  <span
                    className={
                      isExpired ? "font-medium text-zinc-700" : "font-medium text-zinc-800"
                    }
                  >
                    Program ends:
                  </span>{" "}
                  {opportunity.programEndDateLabel || "N/A"}
                </p>
                <p>
                  <span
                    className={
                      isExpired ? "font-medium text-zinc-700" : "font-medium text-zinc-800"
                    }
                  >
                    Days:
                  </span>{" "}
                  {opportunity.days.length > 0 ? opportunity.days.join(", ") : "N/A"}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {opportunity.link ? (
                  <a
                    href={opportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-xl border px-4 py-2 text-center text-sm font-medium transition ${
                      isExpired
                        ? "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200/60"
                        : "border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    Open listing
                  </a>
                ) : (
                  <button
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      isExpired
                        ? "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200/60"
                        : "border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    View details
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsPostingLinkedIn((prev) => !prev);
                    setIsRemovingLinkedIn(false);
                    setIsReportingIssue(false);
                    setActionMessage("");
                    setActionError("");
                  }}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Post LinkedIn
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRemovingLinkedIn((prev) => !prev);
                    setIsPostingLinkedIn(false);
                    setIsReportingIssue(false);
                    setActionMessage("");
                    setActionError("");
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    isExpired
                      ? "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200/60"
                      : "border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  Remove LinkedIn
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsReportingIssue((prev) => !prev);
                    setIsPostingLinkedIn(false);
                    setIsRemovingLinkedIn(false);
                    setActionMessage("");
                    setActionError("");
                  }}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    isExpired
                      ? "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200/60"
                      : "border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  Report issue
                </button>
              </div>

              {isPostingLinkedIn && (
                <LinkedInPostForm
                  opportunityId={opportunity.id}
                  isSaving={isSaving}
                  onError={(message) => setActionError(message)}
                  onSuccess={(users) => {
                    setConnectedUsers(users);
                    setActionMessage("");
                    setActionError("");
                  }}
                  onCancel={() => {
                    setIsPostingLinkedIn(false);
                  }}
                />
              )}

              {isRemovingLinkedIn && (
                <LinkedInRemoveForm
                  opportunityId={opportunity.id}
                  isSaving={isSaving}
                  onError={(message) => setActionError(message)}
                  onSuccess={(users) => {
                    setConnectedUsers(users);
                    setIsRemovingLinkedIn(false);
                    setActionMessage("LinkedIn removed.");
                    setActionError("");
                  }}
                  onCancel={() => {
                    setIsRemovingLinkedIn(false);
                  }}
                />
              )}

              {isReportingIssue && (
                <ReportIssueForm
                  opportunityId={opportunity.id}
                  isSaving={isSaving}
                  onError={(message) => setActionError(message)}
                  onSuccess={() => {
                    setActionMessage("");
                    setActionError("");
                  }}
                  onCancel={() => {
                    setIsReportingIssue(false);
                  }}
                />
              )}

              {actionMessage && (
                <p className="mt-3 text-sm text-emerald-700">{actionMessage}</p>
              )}

              {actionError && (
                <p className="mt-3 text-sm text-red-600">{actionError}</p>
              )}

              <div className={detailsBox}>
                <div className="mb-3">
                  <p className="text-sm text-sky-800">People to connect with</p>
                  <p className="text-sm text-zinc-600">
                    Listed users connected to this program
                  </p>
                </div>

                {connectedUsers.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    No connected people listed yet.
                  </p>
                ) : (
                  <ConnectedUsersList users={connectedUsers} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}