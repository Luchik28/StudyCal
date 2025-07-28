"use client";
import React, { useEffect, useState } from "react";

// ...existing code...
const steps = [
  // 1) Welcome
  {
    key: "welcome",
    selector: null,
    title: "Welcome to StudyCal!",
    description: (
      <>
        <div className="mb-2">Let&apos;s take a quick tour to show you around and get you started. It&apos;ll only take a few minutes.</div>
        <div className="mb-2">You can skip onboarding at any time using the button below.</div>
      </>
    ),
    primary: true,
  },
  // 1.5) Switch between Time frames
  {
    key: "switch-timeframe",
    selector: "#timeframe-group",
    title: "Switch between Time Frames",
    description: (
      <>
        <div>You can switch between one day, week, and monthly views here in the top left.</div>
      </>
    ),
    auto: () => {
      // No-op: don't change view, just highlight
    }
  },
  // 2) Add Events (select calendar area)
  {
    key: "add-event",
    selector: "#calendar-container", // select the main calendar grid
    title: "Add Events",
    description: (
      <>
        <div>Click anywhere on the calendar to add an event, or use the dedicated Add Event button</div>
        <div className="mt-2">Use these events to schedule your day!</div>
      </>
    ),
  },
  // 3) Modify Events
  {
    key: "modify-event",
    selector: null, // no highlight
    title: "Modify Events",
    description: (
      <>
        <div>Left click on an event to move it around on your calendar. Right click it to bring up its menu, which will allow you to change its category and start/end times.</div>
      </>
    ),
  },
  // 4) Schedule My Day (tasks section)
  {
    key: "tasks",
    selector: "#tasks-section, [aria-label='Tasks']",
    title: "Schedule My Day",
    description: (
      <>
        <div>Type your tasks in the bottom bar of this section. StudyCal will estimate the time, category, and subcategory, but you can change them if needed.</div>
        <div className="mt-2">When you have finished adding all your tasks, click the schedule button at the very bottom, and StudyCal will turn all your tasks into events and place them inside the selected time frame.</div>
        <div className="mt-2">You can use this to find time for all your tasks during your day. If something is scheduled on your calendar, you're much more likely to do it.</div>
      </>
    ),
  },
  // 5) Analytics
  {
    key: "analytics",
    selector: "#open-analytics, [aria-label='Analytics']",
    title: "Analytics",
    description: (
      <>
        <div>See how you spend your time, track your progress, and view trends in the analytics section. You can click "See more" to open a more detailed report of the selected time frame.</div>
        <div>This information can be useful for building a more balanced schedule, and to track your progress.</div>
      </>
    ),
  },
  // 5.5) Long Term Goals
  {
    key: "long-term-goals",
    selector: "",
    title: "Long Term Goals",
    description: (
      <>
        <div>This is where you can add your long term goals. StudyCal will schedule time to work on these in your calendar, ensuring you make steady progress on accomplishing your dreams.</div>
        <div className="mt-2">You can find this section on the left sidebar after switching to the Later view.</div>
      </>
    ),
    auto: () => {
      // Switch to the Later view (month)
    }
  },
  // 6) AI Suggestions
  {
    key: "suggestions",
    selector: "#suggestions-panel, [aria-label='Suggestions']",
    title: "AI Suggestions",
    description: (
      <>
        <div>StudyCal will analyze your schedule and offer events to add in order to create a more balanced schedule here.</div>
        <div className="mt-2">It will suggest things like blocking out time to work on your goals, adding or modifying study sessions, or doing an activity to balance out your schedule.</div>
        <div className="mt-2">This is the core feature that sets StudyCal apart: following its suggestions will help make your schedule more balanced and improve your acedemic success!</div>
      </>
    ),
  },
  // 7) Settings
  {
    key: "settings",
    selector: "#open-settings, [aria-label='Settings']",
    title: "Settings",
    description: (
      <>
        <div>Click the settings icon to customize StudyCal to your preferences. Here you can change between 12 Hour and 24 Hour formats and connect to other calendars like Google Calendar.</div>
        <div className="mt-2">Settings are always available in the top bar. Connecting to external calendars can help you get started even quicker by importing all of your events into StudyCal, you should definitely check it out!</div>
      </>
    ),
  },
  // Done
  {
    key: "done",
    selector: null,
    title: "You're all set!",
    description: "Enjoy using StudyCal. You can revisit onboarding from settings anytime.",
  },
];


const ONBOARDING_FLAG = "onboardingComplete";

export const OnboardingOverlay: React.FC = () => {
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem(ONBOARDING_FLAG);
    // (console.debug is allowed by default)
    console.debug("[OnboardingOverlay] onboardingComplete flag:", flag);
    if (flag === "true") setShow(false);
    else setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    // If the step has an auto() function, call it to trigger view changes
    if (typeof steps[step].auto === 'function') {
      steps[step].auto();
      // Wait a bit for the UI to update before measuring
      setTimeout(() => {
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
      }, 350);
      return;
    }
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
            pointerEvents: "none",
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
                <button className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300" onClick={handleSkip}>Skip onboarding</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleStart}>Start tour</button>
              </>
            ) : step === steps.length - 1 ? (
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleNext}>Finish</button>
            ) : (
              <>
                <button className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300" onClick={handleSkip}>Skip</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleNext}>Next</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
