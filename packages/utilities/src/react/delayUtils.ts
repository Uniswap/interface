/**
 * Workaround for performance issues where a user action may result in a heavy
 * rerender which can seem like the first action has hung.
 *
 * For example, if a user selects an item on a dropdown, the first call that closes
 * the dropdown may hang if the second action is called in the same batch.
 *
 * @param firstAction Action to prioritize
 * @param secondAction Action to delay
 * @param frames Number of frames to delay the second action.
 */
export function executeWithFrameDelay(firstAction: () => void, secondAction: () => void, frames: number = 4): void {
  firstAction()

  const executeAfterFrames = (remainingFrames: number): void => {
    if (remainingFrames <= 0) {
      secondAction()
    } else {
      requestAnimationFrame(() => executeAfterFrames(remainingFrames - 1))
    }
  }
  executeAfterFrames(frames)
}
