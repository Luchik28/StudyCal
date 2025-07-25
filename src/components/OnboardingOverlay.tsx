"use client";
import React, { useEffect, useState } from "react";

// ...existing code...
const steps = [
  {
    key: "welcome",
    selector: null,
    title: "Welcome to Your Student Planner!",
    description: (
      <>
        <div className="mb-2">Let's take a quick tour to help you get started.</div>
        <div className="mb-2">You can skip onboarding at any time.</div>
      </>
    ),
    primary: true,
  },
  {
    key: "settings",
    selector: "#settings-button, [aria-label='Settings']",
    title: "Settings & Google Calendar Integration",
    description: (
      <>
        <div>Click the <b>Settings</b> button (gear icon) to open app settings.</div>
        <div className="mt-2">You can integrate with Google Calendar from the settings panel.</div>
      </>
    ),
  },
  {
    key: "add-event",
    selector: "#add-event-button, [aria-label='Add Event']",
    title: "Add Events",
    description: "Click the add button or double-click a time slot to create a new event.",
  },
  {
    key: "modify-event",
    selector: ".event-card",
    title: "Modify Events",
    description: "Drag events to reschedule, or click them to edit details.",
  },
  {
    key: "analytics",
    selector: "#open-analytics, [aria-label='Analytics']",
    title: "View Analytics",
    description: "Open the analytics section to see how you spend your time.",
  },
  {
    key: "tasks",
    selector: "#tasks-section, [aria-label='Tasks']",
    title: "Manage Tasks",
    description: "Track and manage your tasks in the tasks section.",
  },
  {
    key: "suggestions",
    selector: "#suggestions-panel, [aria-label='Suggestions']",
    title: "AI Suggestions",
    description: "Check out the suggestions panel for AI-powered recommendations.",
  },
  {
    key: "done",
    selector: null,
    title: "You're all set!",
    description: "Enjoy using the planner. You can revisit onboarding from settings anytime.",
  },
];


const ONBOARDING_FLAG = "onboardingComplete";

export const OnboardingOverlay: React.FC = () => {
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem(ONBOARDING_FLAG);
    // eslint-disable-next-line no-console
    console.debug("[OnboardingOverlay] onboardingComplete flag:", flag);
    if (flag === "true") setShow(false);
    else setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    const selector = steps[step].selector;
    if (!selector) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) {
      setHighlightRect(el.getBoundingClientRect());
    } else {
      setHighlightRect(null);
    }
  }, [step, show]);

  if (!show) return null;

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      localStorage.setItem(ONBOARDING_FLAG, "true");
      setShow(false);
    }
  };
  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_FLAG, "true");
    setShow(false);
  };
  const handleStart = () => setStep(1);

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-auto" style={{ background: "transparent" }}>
      {/* Dim everything except highlight */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="onboarding-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.45)"
          mask="url(#onboarding-mask)"
        />
      </svg>
      {/* Highlighted element border */}
      {highlightRect && (
        <div
          style={{
            position: "absolute",
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            borderRadius: 12,
            border: "3px solid #2563eb",
            boxShadow: "0 0 0 4px rgba(37,99,235,0.2)",
            pointerEvents: "none" as const,
            zIndex: 1001,
          }}
        />
      )}
      {/* Overlay content */}
      <div className="fixed z-[1002] flex flex-col items-center justify-center" style={{ top: "20%", left: 0, right: 0 }}>
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border-2 border-blue-600">
          <h2 className="text-xl font-bold mb-2 text-blue-700">{steps[step].title}</h2>
          <div className="text-gray-700 mb-4">{steps[step].description}</div>
          <div className="flex gap-2 justify-end">
            {step === 0 ? (
              <>
                <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={handleSkip}>Skip onboarding</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleStart}>Start tour</button>
              </>
            ) : (
              <>
                <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={handleSkip}>Skip</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleNext}>{step === steps.length - 1 ? "Finish" : "Next"}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
