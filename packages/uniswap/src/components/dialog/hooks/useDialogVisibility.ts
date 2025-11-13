import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { DialogPreferencesService } from 'uniswap/src/dialog-preferences'
import { DialogVisibilityId } from 'uniswap/src/dialog-preferences/types'
import { logger } from 'utilities/src/logger/logger'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useHasValueBecomeTruthy } from 'utilities/src/react/useHasValueBecomeTruthy'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export enum BehaviorType {
  DontShowAgain = 'DontShowAgain',
  Default = 'Default',
}

type UseDialogVisibilityParams = {
  isOpen: boolean
} & (
  | {
      behaviorType?: BehaviorType.Default
      visibilityId?: undefined
      dialogPreferencesService?: undefined
    }
  | {
      behaviorType: BehaviorType.DontShowAgain
      visibilityId: DialogVisibilityId
      dialogPreferencesService: DialogPreferencesService
    }
)

interface UseDialogVisibilityResult {
  shouldShow: boolean | null
  isLoading: boolean
  dontShowAgain: boolean
  setDontShowAgain: () => void
  resetDontShowAgain: () => void
}

/**
 * Hook for managing dialog visibility preferences ("don't show again" functionality)
 *
 * @param visibilityId - Unique identifier for the dialog
 * @param dialogPreferencesService - Service for managing preferences (injected dependency)
 * @param isOpen - Current open state of the dialog
 * @returns Object containing visibility state and handlers
 *
 * @example
 * ```tsx
 * const { shouldShow, dontShowAgain, setDontShowAgain } = useDialogVisibility({
 *   visibilityId: 'swap-warning',
 *   dialogPreferencesService: myService,
 *   isOpen: isDialogOpen
 * })
 *
 * if (shouldShow === false) return null
 *
 * return (
 *   <Dialog isOpen={isDialogOpen} onClose={originalOnClose}>
 *     <Checkbox checked={dontShowAgain} onChange={setDontShowAgain} />
 *   </Dialog>
 * )
 * ```
 */
export function useDialogVisibility({
  visibilityId,
  dialogPreferencesService,
  isOpen,
  behaviorType,
}: UseDialogVisibilityParams): UseDialogVisibilityResult {
  const { value: dontShowAgain, setTrue: setDontShowAgain, setFalse: resetDontShowAgain } = useBooleanState(false)
  const hasDialogClosed = useHasValueBecomeTruthy(!isOpen)

  // Track which visibilityId was active when user checked "don't show again"
  const checkedVisibilityIdRef = useRef<DialogVisibilityId | undefined>(undefined)

  const { data, error, isLoading } = useQuery<boolean>({
    queryKey: [ReactQueryCacheKey.DialogVisibility, visibilityId],
    queryFn: async (): Promise<boolean> => {
      if (behaviorType !== BehaviorType.DontShowAgain) {
        return true
      }
      return await dialogPreferencesService.shouldShowDialog(visibilityId)
    },
    enabled: Boolean(behaviorType === BehaviorType.DontShowAgain),
    staleTime: Infinity,
  })

  // Log errors from the query
  useEffect(() => {
    if (error) {
      logger.error(error as Error, {
        tags: { file: 'useDialogVisibility', function: 'queryFn' },
        extra: visibilityId ? { visibilityId } : undefined,
      })
    }
  }, [error, visibilityId])

  // Track which visibilityId was active when checkbox was checked
  // Only capture it if not already set (i.e., when checkbox is first checked)
  useEffect(() => {
    if (dontShowAgain && visibilityId && !checkedVisibilityIdRef.current) {
      checkedVisibilityIdRef.current = visibilityId
    } else if (!dontShowAgain) {
      // Reset when checkbox is unchecked
      checkedVisibilityIdRef.current = undefined
    }
  }, [dontShowAgain, visibilityId])

  // Detect when dialog closes and save preference
  useEffect(() => {
    if (hasDialogClosed && dontShowAgain && checkedVisibilityIdRef.current && dialogPreferencesService) {
      // Dialog was closed (by any means), save preference for the ID that was active when user checked the box
      dialogPreferencesService.markDialogHidden(checkedVisibilityIdRef.current).catch((e) => {
        logger.error(e, {
          tags: { file: 'useDialogVisibility', function: 'markDialogHidden' },
          extra: { visibilityId: checkedVisibilityIdRef.current },
        })
      })
    }
  }, [hasDialogClosed, dontShowAgain, dialogPreferencesService])

  // Determine shouldShow value: null while loading/disabled, boolean otherwise
  const shouldShow: boolean | null = behaviorType !== BehaviorType.DontShowAgain ? true : (data ?? null)

  return {
    shouldShow,
    isLoading: behaviorType !== BehaviorType.DontShowAgain ? false : isLoading,
    dontShowAgain,
    setDontShowAgain,
    resetDontShowAgain,
  }
}
