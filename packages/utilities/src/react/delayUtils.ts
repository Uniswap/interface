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
export function executeWithFrameDelay({
  firstAction,
  secondAction,
  frames = 4,
}: {
  firstAction: () => void
  secondAction: () => void
  frames?: number
}): void {
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

// Wait for next frame to ensure UI updates without flashing
// https://corbt.com/posts/2015/12/22/breaking-up-heavy-processing-in-react-native.html
export const waitFrame = async (): Promise<void> => {
  await new Promise(requestAnimationFrame)
}
