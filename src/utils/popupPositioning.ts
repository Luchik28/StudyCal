/**
 * Adjusts popup position to ensure it stays within the viewport
 * @param position - Initial position { x, y }
 * @param popupWidth - Width of the popup element
 * @param popupHeight - Height of the popup element
 * @param offset - Offset from the trigger element (default: 10px)
 * @returns Adjusted position that keeps popup in viewport
 */
export function adjustPopupPosition(
  position: { x: number; y: number },
  popupWidth: number,
  popupHeight: number,
  offset: number = 10
): { x: number; y: number } {
  const padding = 10; // Padding from viewport edge
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let adjustedX = position.x;
  let adjustedY = position.y;

  // Adjust horizontal position
  if (adjustedX + popupWidth > viewportWidth - padding) {
    adjustedX = viewportWidth - popupWidth - padding;
  }
  if (adjustedX < padding) {
    adjustedX = padding;
  }

  // Adjust vertical position - prefer moving up if it goes off bottom
  if (adjustedY + popupHeight > viewportHeight - padding) {
    adjustedY = viewportHeight - popupHeight - padding;
  }
  if (adjustedY < padding) {
    adjustedY = padding;
  }

  return { x: adjustedX, y: adjustedY };
}

/**
 * Sets up a ResizeObserver to monitor popup element and adjust position when it changes size
 * @param element - The popup element to monitor
 * @param onPositionChange - Callback when position should be adjusted
 * @returns Cleanup function to disconnect the observer
 */
export function setupPopupResizeObserver(
  element: HTMLElement | null,
  onPositionChange: () => void
): () => void {
  if (!element) return () => {};

  const observer = new ResizeObserver(() => {
    // Use requestAnimationFrame to batch multiple resize events
    requestAnimationFrame(() => {
      onPositionChange();
    });
  });

  observer.observe(element);

  return () => {
    observer.disconnect();
  };
}

/**
 * Adjusts inline form position to keep it in viewport
 * @param position - Initial position { left, top }
 * @param formWidth - Width of the form
 * @param formHeight - Height of the form
 * @returns Adjusted position that keeps form in viewport
 */
export function adjustFormPosition(
  position: { left: number; top: number },
  formWidth: number,
  formHeight: number
): { left: number; top: number } {
  const padding = 10; // Padding from viewport edge
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let adjustedLeft = position.left;
  let adjustedTop = position.top;

  // Adjust horizontal position
  if (adjustedLeft + formWidth > viewportWidth - padding) {
    adjustedLeft = viewportWidth - formWidth - padding;
  }
  if (adjustedLeft < padding) {
    adjustedLeft = padding;
  }

  // Adjust vertical position
  if (adjustedTop + formHeight > viewportHeight - padding) {
    adjustedTop = viewportHeight - formHeight - padding;
  }
  if (adjustedTop < padding) {
    adjustedTop = padding;
  }

  return { left: adjustedLeft, top: adjustedTop };
}
