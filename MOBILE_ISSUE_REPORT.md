# Issue: Log Page Bottom Toolbar Positioning on Mobile (iOS Safari)

## Description
The bottom toolbar ("Action Bar") on the Log Page (`/dashboard/log`) is displaying incorrectly on mobile devices, specifically iOS Safari. It either floats in the middle of the content area or leaves a large black void below it, failing to anchor properly to the bottom of the viewport.

## Symptoms
1. **Floating Toolbar:** The toolbar appears vertically centered or offset from the bottom, obscuring content.
2. **Black Gap:** A significant black background area appears below the toolbar where content should extend.
3. **Viewport Issue:** The page is set to `h-dvh` (dynamic viewport height), but the internal positioning of the absolute/fixed footer is not respecting the Safe Area or the specific viewport boundaries correctly.

## Technical Context
*   **File:** `src/app/(protected)/dashboard/log/page.tsx`
*   **Layout:** The root container uses `h-dvh overflow-hidden`.
*   **Attempted Fixes:**
    *   **Absolute Positioning:** `absolute bottom-0` results in the toolbar finding the "bottom" of a container that may not match the visual viewport, causing gaps.
    *   **Fixed Positioning:** `fixed bottom-0` resulted in the element detaching from the layout flow inappropriately.
*   **Safe Area:** Attempts to use `pb-[env(safe-area-inset-bottom)]` were inconsistent.

## Reproduction
1. Open the app on an iPhone (Safari or Chrome).
2. Navigate to `/dashboard/log`.
3. Observe the bottom toolbar position relative to the screen bottom.

## Action Required
Investigate the interaction between `h-dvh`, flexbox growth (`flex-1`), and the positioning context of the footer. A potential solution might involve:
*   Using a simplified flex column layout where the toolbar is a standard block element (not absolute/fixed) pushed to the bottom via `mt-auto`.
*   Debugging the specific height calculation of the parent `main` container.
*   Verifying `dvh` behavior with the specific mobile browser address bar states.
