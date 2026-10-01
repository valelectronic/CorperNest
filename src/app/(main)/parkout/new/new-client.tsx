// src/app/(main)/parkout/new/new-client.tsx
// Orchestrator for Park-Out listing form.
// Changes: removed landlordAware from StepOne defaults,
// added transportEstimates to StepTwo defaults.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StepIndicator from "./components/step-indicator";
import StepOne, { type StepOneData } from "./steps/step-one";
import StepTwo, { type StepTwoData } from "./steps/step-two";
import StepThree, { type StepThreeData } from "./steps/step-three";

type Props = {
  userName:  string | null;
  userEmail: string;
  userId:    string;
};

const DEFAULT_STEP_ONE: StepOneData = {
  roomType:         "",
  annualRent:       "",
  moveOutDate:      "",
  state:            "",
  lga:              "",
  neighbourhood:    "",
  hasLandlordAgent: false,
  landlordConsent:  false,
  cautionFee:       "",
  agreementFee:     "",
  extraFees:        [],
};

const DEFAULT_STEP_TWO: StepTwoData = {
  occupancyProofUrl:  "",
  occupancyProofType: "",
  images:             [],
  description:        "",
  landlordRules:      "",
  itemsAvailable:     "",
  // Start with 2 empty landmarks — user must fill at least 2
  transportEstimates: [
    { name: "", bikeCost: "", kekeCost: "" },
    { name: "", bikeCost: "", kekeCost: "" },
  ],
};

const DEFAULT_STEP_THREE: StepThreeData = {
  exactAddress:   "",
  caretakerName:  "",
  caretakerPhone: "",
};

export default function ParkOutNewClient({ userName: _userName, userEmail: _userEmail, userId }: Props) {
  const router    = useRouter();
  const DRAFT_KEY = `parkout_draft_${userId}`;

  const [step,       setStep]       = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated,   setHydrated]   = useState(false);

  const [stepOne,   setStepOne]   = useState<StepOneData>(DEFAULT_STEP_ONE);
  const [stepTwo,   setStepTwo]   = useState<StepTwoData>(DEFAULT_STEP_TWO);
  const [stepThree, setStepThree] = useState<StepThreeData>(DEFAULT_STEP_THREE);

  // ── Restore draft from localStorage ────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.stepOne)   setStepOne(draft.stepOne);
        if (draft.stepTwo)   setStepTwo({
          ...DEFAULT_STEP_TWO,
          ...draft.stepTwo,
          // Ensure at least 2 transport landmark slots exist
          transportEstimates: draft.stepTwo.transportEstimates?.length >= 2
            ? draft.stepTwo.transportEstimates
            : DEFAULT_STEP_TWO.transportEstimates,
        });
        if (draft.stepThree) setStepThree({
          ...DEFAULT_STEP_THREE,
          ...draft.stepThree,
        });
        if (draft.step) setStep(draft.step);
        toast.info("Draft restored — your progress has been saved.");
      }
    } catch { /* corrupt localStorage — start fresh */ }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save draft on every change ──────────────────────────────────────────
  const saveDraft = useCallback((one: StepOneData, two: StepTwoData, three: StepThreeData, s: number) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ stepOne: one, stepTwo: two, stepThree: three, step: s }));
    } catch { /* silent */ }
  }, [DRAFT_KEY]);

  useEffect(() => {
    if (!hydrated) return;
    saveDraft(stepOne, stepTwo, stepThree, step);
  }, [stepOne, stepTwo, stepThree, step, hydrated, saveDraft]);

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* silent */ }
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res  = await fetch("/api/parkout/listings/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...stepOne, ...stepTwo, ...stepThree }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Submission failed. Try again."); return; }
      clearDraft();
      router.push("/parkout/new/success");
    } catch { toast.error("Network error. Try again."); }
    finally { setSubmitting(false); }
  }

  if (!hydrated) return null;

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100dvh" }}>
      <div style={{ padding: "16px 20px 12px", backgroundColor: "var(--color-card)", borderBottom: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Park-Out & Earn
        </p>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
          List your room
        </h1>
      </div>

      <StepIndicator currentStep={step} />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 32px" }}>
        {step === 1 && (
          <StepOne
            data={stepOne}
            onChange={(u) => setStepOne((p) => ({ ...p, ...u }))}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepTwo
            data={stepTwo}
            onChange={(u) => setStepTwo((p) => ({ ...p, ...u }))}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepThree
            data={stepThree}
            annualRent={Number(stepOne.annualRent) || 0}
            roomType={stepOne.roomType}
            moveOutDate={stepOne.moveOutDate}
            neighbourhood={stepOne.neighbourhood}
            lga={stepOne.lga}
            state={stepOne.state}
            cautionFee={stepOne.cautionFee}
            agreementFee={stepOne.agreementFee}
            extraFees={stepOne.extraFees ?? []}
            onChange={(u) => setStepThree((p) => ({ ...p, ...u }))}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}