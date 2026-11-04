// Pure chart-pane layout math, kept free of lightweight-charts so non-deferred callers (the terminal
// layout's loading skeleton) can size the price/volume split the same way the model does.

// Volume pane height, capped; the rest of the box (minus the time axis) is the price pane.
export const MARGIN_VOLUME_PANE_HEIGHT = 104
export const MARGIN_TIME_AXIS_HEIGHT = 28

export function marginVolumePaneHeight(boxHeight: number | undefined): number {
  if (!boxHeight) {
    return MARGIN_VOLUME_PANE_HEIGHT
  }
  return Math.min(MARGIN_VOLUME_PANE_HEIGHT, Math.floor(Math.max(0, boxHeight - MARGIN_TIME_AXIS_HEIGHT) / 3))
}
