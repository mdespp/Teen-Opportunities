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

function getCompactModality(modality: string[]) {
  if (!modality || modality.length === 0) return "N/A";
  if (modality.length === 1) return modality[0];
  if (modality.length === 2) return modality.join(", ");
  return `${modality[0]}, ${modality[1]} +${modality.length - 2}`;
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
    ? "overflow-hidden rounded-[1.35rem] border border-zinc-300 bg-zinc-100"
    : "overflow-hidden rounded-[1.35rem] border border-[#d8cabc] bg-white";

  const hoverClasses = isExpired ? "hover:bg-zinc-200/60" : "hover:bg-[#faf6f2]";
  const mutedText = isExpired ? "text-zinc-500" : "text-zinc-600";
  const titleText = isExpired ? "text-zinc-700" : "text-zinc-900";
  const borderTop = isExpired ? "border-zinc-300" : "border-[#eadfd4]";
  const pillBorder = isExpired
    ? "border-zinc-300 bg-zinc-50 text-zinc-600"
    : "border-zinc-200 bg-white text-zinc-700";
  const detailsBox =
    "mt-5 rounded-[18px] border border-[#cfe0fb] bg-[#edf5ff] p-4 sm:p-5";

  return (
    <article className={outerClasses}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition sm:items-center sm:gap-4 sm:px-5 sm:py-4 ${hoverClasses}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-x-3">
            <p className={`text-[11px] leading-4 sm:text-[12px] ${mutedText}`}>
              {opportunity.type}
            </p>

            <span className="text-zinc-300">•</span>

            <p className={`text-[11px] leading-4 sm:text-[12px] ${mutedText}`}>
              {opportunity.location}
            </p>

            <span className="text-zinc-300">•</span>

            <p className={`text-[11px] leading-4 sm:text-[12px] ${mutedText}`}>
              <span className="sm:hidden">
                {getCompactModality(opportunity.modality)}
              </span>
              <span className="hidden sm:inline">
                {opportunity.modality.join(", ")}
              </span>
            </p>

            {opportunity.studentLed && (
              <span className="rounded-full bg-zinc-900 px-1.5 py-[2px] text-[9px] font-medium leading-none text-white sm:px-2 sm:py-0.5 sm:text-[10px]">
                Student-led
              </span>
            )}

            {isNew && !isExpired && (
              <span className="rounded-full bg-zinc-900 px-1.5 py-[2px] text-[9px] font-medium leading-none text-white sm:px-2 sm:py-0.5 sm:text-[10px]">
                New
              </span>
            )}

            {isExpired && (
              <span className="rounded-full bg-zinc-300 px-1.5 py-[2px] text-[9px] font-medium leading-none text-zinc-700 sm:px-2 sm:py-0.5 sm:text-[10px]">
                Expired
              </span>
            )}
          </div>

          <h3
            className={`mt-1.5 line-clamp-2 text-[15px] font-medium leading-[1.22] tracking-tight sm:text-[17px] ${titleText}`}
          >
            {opportunity.title}
          </h3>

          <p className={`mt-1 text-[11px] leading-4 sm:hidden ${mutedText}`}>
            {opportunity.applicationDeadlineLabel
              ? `Apply by ${opportunity.applicationDeadlineLabel}`
              : "Deadline unknown"}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-2 sm:items-center sm:gap-4">
          <span className={`hidden whitespace-nowrap text-[12px] sm:block ${mutedText}`}>
            {opportunity.applicationDeadlineLabel
              ? `Apply by ${opportunity.applicationDeadlineLabel}`
              : "Deadline unknown"}
          </span>

          <span className="pt-0.5 text-[20px] leading-none text-zinc-500 sm:text-lg">
            {isOpen ? "−" : "+"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className={`border-t px-4 py-4 sm:px-6 sm:py-6 ${borderTop}`}>
          <div className="flex items-start gap-3 sm:gap-4">
            {hasLogo && (
              <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[16px] border border-[#eadfd4] bg-white sm:h-[76px] sm:w-[76px] sm:rounded-[18px]">
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
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <p className={`text-[12px] sm:text-sm ${mutedText}`}>
                      {opportunity.type}
                    </p>

                    {opportunity.studentLed && (
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
                        Student-led
                      </span>
                    )}

                    {isNew && !isExpired && (
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
                        New
                      </span>
                    )}

                    {isExpired && (
                      <span className="rounded-full bg-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                        Expired
                      </span>
                    )}
                  </div>

                  <h4 className={`text-[17px] font-medium tracking-tight sm:text-xl ${titleText}`}>
                    {opportunity.title}
                  </h4>
                  <p className={`mt-1 text-[13px] sm:text-sm ${mutedText}`}>
                    {opportunity.location}
                  </p>
                </div>

                <span className={`shrink-0 text-[12px] sm:text-sm ${mutedText}`}>
                  {opportunity.applicationDeadlineLabel
                    ? `Apply by ${opportunity.applicationDeadlineLabel}`
                    : "Deadline unknown"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                {opportunity.grades.map((grade) => (
                  <span
                    key={grade}
                    className={`rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs ${pillBorder}`}
                  >
                    {grade}
                  </span>
                ))}

                {opportunity.subjects.map((subject) => (
                  <span
                    key={subject}
                    className={`rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs ${pillBorder}`}
                  >
                    {subject}
                  </span>
                ))}

                {opportunity.cost.map((costItem) => (
                  <span
                    key={costItem}
                    className={`rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs ${pillBorder}`}
                  >
                    {costItem}
                  </span>
                ))}

                {opportunity.modality.map((mode) => (
                  <span
                    key={mode}
                    className={`rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs ${pillBorder}`}
                  >
                    {mode}
                  </span>
                ))}
              </div>

              <p
                className={`mt-4 text-[13px] leading-5 sm:text-sm sm:leading-6 ${
                  isExpired ? "text-zinc-600" : "text-zinc-700"
                }`}
              >
                {opportunity.description}
              </p>

              <div className={`mt-4 space-y-1 text-[13px] sm:text-sm ${mutedText}`}>
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

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                {opportunity.link ? (
                  <a
                    href={opportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-lg border px-4 py-2 text-center text-sm font-medium transition ${
                      isExpired
                        ? "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200/60"
                        : "border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    Open listing
                  </a>
                ) : (
                  <button
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
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
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
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
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
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
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
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