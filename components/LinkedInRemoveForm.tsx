"use client";

import { useState } from "react";

type LinkedInRemoveFormProps = {
  opportunityId: string | number;
  isSaving: boolean;
  onSuccess: (connectedUsers: any[]) => void;
  onError: (message: string) => void;
  onCancel: () => void;
};

function sanitizeDeleteCode(input: string) {
  return input.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
}

export default function LinkedInRemoveForm({
  opportunityId,
  isSaving,
  onSuccess,
  onError,
  onCancel,
}: LinkedInRemoveFormProps) {
  const [deleteCodeInput, setDeleteCodeInput] = useState("");

  async function handleRemoveLinkedIn() {
    const cleanedDeleteCode = sanitizeDeleteCode(deleteCodeInput);

    if (cleanedDeleteCode.length !== 10) {
      onError("Please enter your 10-character delete code.");
      return;
    }

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/linkedin`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleteCode: cleanedDeleteCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to remove LinkedIn.");
      }

      onSuccess(Array.isArray(data.connectedUsers) ? data.connectedUsers : []);
      setDeleteCodeInput("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to remove LinkedIn.");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#d8cabc] bg-white p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-zinc-900">Remove LinkedIn</p>
        <p className="text-sm text-zinc-600">
          Enter the 10-character code that was shown after you posted your
          LinkedIn.
        </p>
      </div>

      <input
        type="text"
        value={deleteCodeInput}
        onChange={(e) => {
          setDeleteCodeInput(sanitizeDeleteCode(e.target.value));
          onError("");
        }}
        placeholder="10-character code"
        className="w-full rounded-xl border border-[#d8cabc] bg-white px-4 py-3 text-sm uppercase tracking-[0.12em] outline-none"
      />

      <p className="mt-2 text-xs text-zinc-500">
        Letters and numbers only. 10 characters.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRemoveLinkedIn}
          disabled={isSaving || sanitizeDeleteCode(deleteCodeInput).length !== 10}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? "Removing..." : "Remove LinkedIn"}
        </button>

        <button
          type="button"
          onClick={() => {
            setDeleteCodeInput("");
            onCancel();
          }}
          disabled={isSaving}
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}