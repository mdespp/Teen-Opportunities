"use client";

import { useEffect, useState } from "react";

const TYPE_OPTIONS = [
  "Internship",
  "Job",
  "Volunteering",
  "Scholarship",
  "Pre-College",
  "Course",
  "Workshop",
  "Event",
  "Conference",
  "Contest",
  "Startup",
  "Nonprofit",
  "Student-led",
  "Summer Program",
  "Fellowship",
  "Afterschool Program",
  "Research",
  "Program",
] as const;

const MODALITY_OPTIONS = ["Online", "Hybrid", "In Person"] as const;

const GRADE_OPTIONS = [
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
] as const;

const SUBJECT_OPTIONS = [
  "STEM",
  "Science",
  "Math",
  "Computer Science",
  "Engineering",
  "Technology",
  "AI",
  "Research",
  "Law",
  "Politics",
  "Civics",
  "History",
  "Public Policy",
  "Criminal Justice",
  "Social Justice",
  "Arts",
  "Design",
  "Architecture",
  "Media",
  "Journalism",
  "Film",
  "Music",
  "Theater",
  "Writing",
  "Humanities",
  "Culture",
  "Education",
  "College Prep",
  "Career Exploration",
  "Leadership",
  "Community",
  "Community Service",
  "Public Service",
  "Business",
  "Entrepreneurship",
  "Finance",
  "Health",
  "Mental Health",
  "Medicine",
  "Public Health",
  "Psychology",
  "Environment",
  "Sustainability",
  "Agriculture",
  "Sports",
  "General",
] as const;

const COST_OPTIONS = ["Free", "Stipend", "Paid", "Tuition / Fee"] as const;

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Flexible",
  "One-time",
] as const;

type ApplicationDeadlineMode = "rolling" | "set_date";
type ProgramTimingMode = "set_date" | "label";

type FormState = {
  submitterEmail: string;
  submitterName: string;
  organizationName: string;
  title: string;
  website: string;
  location: string;
  type: string;
  modality: string[];
  grades: string[];
  subjects: string[];
  cost: string[];
  days: string[];
  studentLed: boolean;
  applicationDeadlineMode: ApplicationDeadlineMode | "";
  applicationDeadline: string;
  programStartMode: ProgramTimingMode | "";
  programStartDate: string;
  programStartDateLabel: string;
  programEndMode: ProgramTimingMode | "";
  programEndDate: string;
  programEndDateLabel: string;
  description: string;
  imageUrl: string;
  extraNotes: string;
};

const initialForm: FormState = {
  submitterEmail: "",
  submitterName: "",
  organizationName: "",
  title: "",
  website: "",
  location: "",
  type: "",
  modality: [],
  grades: [],
  subjects: [],
  cost: [],
  days: [],
  studentLed: false,
  applicationDeadlineMode: "",
  applicationDeadline: "",
  programStartMode: "",
  programStartDate: "",
  programStartDateLabel: "",
  programEndMode: "",
  programEndDate: "",
  programEndDateLabel: "",
  description: "",
  imageUrl: "",
  extraNotes: "",
};

function sanitizeEmailInput(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._%+-@]/g, "");
}

function isValidEmail(email: string) {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PillButton({
  label,
  selected,
  onClick,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm font-medium text-zinc-900">{children}</p>;
}

type SubmitOpportunityFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SubmitOpportunityFormModal({
  isOpen,
  onClose,
}: SubmitOpportunityFormModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showSuccessModal) {
          setShowSuccessModal(false);
          return;
        }
        onClose();
      }
    }

    if (isOpen || showSuccessModal) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, showSuccessModal]);

  function toggleArrayValue(field: keyof FormState, value: string) {
    setForm((current) => {
      const currentValues = current[field] as string[];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...current,
        [field]: nextValues,
      };
    });
  }

  function validateForm() {
    if (!form.submitterEmail || !isValidEmail(form.submitterEmail)) {
      return "Please enter a valid email.";
    }

    if (!form.title.trim()) {
      return "Please enter a title.";
    }

    if (!form.website.trim() || !isValidHttpUrl(form.website.trim())) {
      return "Please enter a valid website or application link.";
    }

    if (!form.type) {
      return "Please choose a type.";
    }

    if (!form.location.trim()) {
      return "Please enter a location.";
    }

    if (form.modality.length === 0) {
      return "Please choose at least one modality.";
    }

    if (form.grades.length === 0) {
      return "Please choose at least one grade.";
    }

    if (form.subjects.length === 0) {
      return "Please choose at least one subject.";
    }

    if (form.cost.length === 0) {
      return "Please choose at least one cost or pay option.";
    }

    if (!form.description.trim()) {
      return "Please enter a description.";
    }

    if (form.imageUrl.trim() && !isValidHttpUrl(form.imageUrl.trim())) {
      return "Please enter a valid image URL or leave it blank.";
    }

    if (!form.applicationDeadlineMode) {
      return "Please choose how the application deadline is listed.";
    }

    if (
      form.applicationDeadlineMode === "set_date" &&
      !form.applicationDeadline
    ) {
      return "Please choose an application deadline date.";
    }

    if (!form.programStartMode) {
      return "Please choose how the program start is listed.";
    }

    if (form.programStartMode === "set_date" && !form.programStartDate) {
      return "Please choose a program start date.";
    }

    if (
      form.programStartMode === "label" &&
      !form.programStartDateLabel.trim()
    ) {
      return "Please enter a program start label.";
    }

    if (!form.programEndMode) {
      return "Please choose how the program end is listed.";
    }

    if (form.programEndMode === "set_date" && !form.programEndDate) {
      return "Please choose a program end date.";
    }

    if (form.programEndMode === "label" && !form.programEndDateLabel.trim()) {
      return "Please enter a program end label.";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSubmitting) return;

    const validationError = validateForm();
    setError(validationError);

    if (validationError) return;

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/opportunities/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submitterEmail: form.submitterEmail,
          submitterName: form.submitterName.trim(),
          organizationName: form.organizationName.trim(),
          title: form.title.trim(),
          website: form.website.trim(),
          location: form.location.trim(),
          type: form.type,
          modality: form.modality,
          grades: form.grades,
          subjects: form.subjects,
          cost: form.cost,
          days: form.days,
          studentLed: form.studentLed,
          applicationDeadlineMode: form.applicationDeadlineMode,
          applicationDeadline: form.applicationDeadline,
          programStartMode: form.programStartMode,
          programStartDate: form.programStartDate,
          programStartDateLabel: form.programStartDateLabel.trim(),
          programEndMode: form.programEndMode,
          programEndDate: form.programEndDate,
          programEndDateLabel: form.programEndDateLabel.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          extraNotes: form.extraNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit opportunity.");
      }

      setForm(initialForm);
      setShowSuccessModal(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit opportunity."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
        <button
          type="button"
          aria-label="Close modal backdrop"
          onClick={onClose}
          className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        />

        <div className="relative z-[101] max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-[#d8cabc] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Contribute</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Submit an opportunity
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
                Submit an opportunity for review. It should be clearly relevant to
                NYC high school students. A website or application link is required.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-700">
                  Your email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={form.submitterEmail}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      submitterEmail: sanitizeEmailInput(e.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-700">Your name</label>
                <input
                  type="text"
                  value={form.submitterName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      submitterName: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="Your name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-zinc-700">
                  Organization name
                </label>
                <input
                  type="text"
                  value={form.organizationName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      organizationName: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="Organization or group name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-zinc-700">
                  Opportunity title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="Opportunity title"
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-zinc-700">
                  Website or application link <span className="text-red-600">*</span>
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      website: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="Official site, Google Form, or application page"
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-zinc-700">
                  Location <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      location: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="New York, NY / Brooklyn, NY / Online"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>
                Type / section <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={form.type === option}
                    onClick={() =>
                      !isSubmitting &&
                      setForm((current) => ({
                        ...current,
                        type: option,
                      }))
                    }
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>
                Online / hybrid / in person <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {MODALITY_OPTIONS.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={form.modality.includes(option)}
                    onClick={() => !isSubmitting && toggleArrayValue("modality", option)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>
                Grade <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {GRADE_OPTIONS.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={form.grades.includes(option)}
                    onClick={() => !isSubmitting && toggleArrayValue("grades", option)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>
                Subject <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={form.subjects.includes(option)}
                    onClick={() => !isSubmitting && toggleArrayValue("subjects", option)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>
                Pay / cost <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                {COST_OPTIONS.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={form.cost.includes(option)}
                    onClick={() => !isSubmitting && toggleArrayValue("cost", option)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>Days it runs</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((option) => (
                  <PillButton
                    key={option}
                    label={option}
                    selected={form.days.includes(option)}
                    onClick={() => !isSubmitting && toggleArrayValue("days", option)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>Student-led</SectionLabel>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  label="Yes"
                  selected={form.studentLed === true}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      studentLed: true,
                    }))
                  }
                  disabled={isSubmitting}
                />
                <PillButton
                  label="No"
                  selected={form.studentLed === false}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      studentLed: false,
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mt-8">
              <SectionLabel>
                Application deadline <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  label="Rolling basis"
                  selected={form.applicationDeadlineMode === "rolling"}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      applicationDeadlineMode: "rolling",
                      applicationDeadline: "",
                    }))
                  }
                  disabled={isSubmitting}
                />
                <PillButton
                  label="Set date"
                  selected={form.applicationDeadlineMode === "set_date"}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      applicationDeadlineMode: "set_date",
                      applicationDeadline:
                        current.applicationDeadline || getTodayISODate(),
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>

              {form.applicationDeadlineMode === "set_date" && (
                <div className="mt-4">
                  <input
                    type="date"
                    value={form.applicationDeadline}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        applicationDeadline: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <SectionLabel>
                Program start <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  label="Set date"
                  selected={form.programStartMode === "set_date"}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      programStartMode: "set_date",
                      programStartDate: current.programStartDate || getTodayISODate(),
                      programStartDateLabel: "",
                    }))
                  }
                  disabled={isSubmitting}
                />
                <PillButton
                  label="Use label"
                  selected={form.programStartMode === "label"}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      programStartMode: "label",
                      programStartDate: "",
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>

              {form.programStartMode === "set_date" && (
                <div className="mt-4">
                  <input
                    type="date"
                    value={form.programStartDate}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        programStartDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {form.programStartMode === "label" && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={form.programStartDateLabel}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        programStartDateLabel: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                    placeholder="July 2026 / Academic year / Not clearly stated"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <SectionLabel>
                Program end <span className="text-red-600">*</span>
              </SectionLabel>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  label="Set date"
                  selected={form.programEndMode === "set_date"}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      programEndMode: "set_date",
                      programEndDate: current.programEndDate || getTodayISODate(),
                      programEndDateLabel: "",
                    }))
                  }
                  disabled={isSubmitting}
                />
                <PillButton
                  label="Use label"
                  selected={form.programEndMode === "label"}
                  onClick={() =>
                    !isSubmitting &&
                    setForm((current) => ({
                      ...current,
                      programEndMode: "label",
                      programEndDate: "",
                    }))
                  }
                  disabled={isSubmitting}
                />
              </div>

              {form.programEndMode === "set_date" && (
                <div className="mt-4">
                  <input
                    type="date"
                    value={form.programEndDate}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        programEndDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {form.programEndMode === "label" && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={form.programEndDateLabel}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        programEndDateLabel: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                    placeholder="August 2026 / Varies / Not clearly stated"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-sm text-zinc-700">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
                rows={7}
                className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                placeholder="Briefly describe the opportunity, who it is for, and anything important students should know."
                disabled={isSubmitting}
              />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-zinc-700">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      imageUrl: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="Optional logo or image URL"
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  If you want us to use an image, we may need to verify your connection to the
                  organization. We usually require confirmation from an official member before
                  using a submitted image. Otherwise, we may choose not to use it.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-700">
                  Extra notes
                </label>
                <textarea
                  value={form.extraNotes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      extraNotes: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-[#d8cabc] px-4 py-3 text-sm outline-none"
                  placeholder="Anything else you want included"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Submit opportunity"}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-2xl border border-zinc-300 px-6 py-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close success modal"
            onClick={() => setShowSuccessModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <div className="relative z-[121] w-full max-w-md rounded-[28px] border border-[#d8cabc] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:p-7">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <span className="text-2xl leading-none">×</span>
            </button>

            <p className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-400">
              Submission received
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              Your submission has been sent for review
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Thank you. We’ll review your submission, and you will be emailed as
              soon as we have a status.
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}