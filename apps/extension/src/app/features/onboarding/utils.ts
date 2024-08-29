import { useEffect } from 'react'

export const ONBOARDING_CONTENT_WIDTH = 460
export const ONBOARDING_INITIAL_FRAME_HEIGHT = 636

export function useSubmitOnEnter(onSubmit: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Enter') {
        onSubmit()
      }
    }

    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup event listener on component unmount
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSubmit])
}
