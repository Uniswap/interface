import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { OnboardingPaneAnimatedContents } from 'src/app/features/onboarding/OnboardingPaneAnimatedContents'
import { OnboardingScreenFrame } from 'src/app/features/onboarding/OnboardingScreenFrame'
import { OnboardingScreenProps } from 'src/app/features/onboarding/OnboardingScreenProps'
import {
  OnboardingStepsContext,
  OnboardingStepsContextState,
  Step,
} from 'src/app/features/onboarding/OnboardingStepsContext'
import { ONBOARDING_CONTENT_WIDTH, ONBOARDING_INITIAL_FRAME_HEIGHT } from 'src/app/features/onboarding/utils'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { AnimatePresence, Flex, styled, useWindowDimensions } from 'ui/src'

export * from './OnboardingStepsContext'

type ComponentByStep = { [key in Step]?: JSX.Element }
type MaybeOnboardingProps = OnboardingScreenProps | null

/**
 * In this file we're doing some weird stuff because we want to keep a nice API
 * for onboarding screens but also allow animating them, while still working
 * with react router.
 *
 * AnimatePresence wants to be able to swap out old for new, but react router
 * wants to handle that as well
 *
 * So we have to hoist the props of <OnboardingScreen /> up to here.
 *
 * But doing that could cause a re-render loop if the child component isn't
 * careful to memoize things. So, we've implemented a little pattern here to
 * avoid that - instead of re-rendering the entire OnboardingStepsProvider
 * whenever a child re-renders, we instead have a simple emitter/listener we
 * trigger (onboardingScreenListen) and we the re-render the contents in a
 * sub-component OnboardingScreenDisplay. This way OnboardingScreenDisplay can
 * re-render as much as it wants and it doesn't cause the child to re-render,
 * avoiding loops!
 */

let currentOnboardingScreen: MaybeOnboardingProps = null
const onboardingScreenListen = new Set<(step: Step, val: MaybeOnboardingProps) => void>()

let clearScreenTimeout: NodeJS.Timeout

export function OnboardingStepsProvider({
  steps,
  isResetting = false,
  disableRedirect = false,
  ContainerComponent = React.Fragment,
}: {
  steps: ComponentByStep
  isResetting?: boolean
  disableRedirect?: boolean
  ContainerComponent?: React.ComponentType<React.PropsWithChildren>
}): JSX.Element {
  const isOnboarded = useSelector(isOnboardedSelector)
  const wasAlreadyOnboardedWhenPageLoaded = useRef(isOnboarded)

  // biome-ignore lint/correctness/useExhaustiveDependencies: we also want to run this effect if isOnboarded changes
  useEffect(() => {
    if (!isResetting && wasAlreadyOnboardedWhenPageLoaded.current && !disableRedirect) {
      // Redirect to the intro screen screen if user is already onboarded.
      // We only want to redirect when the page is first loaded but not immediately after the user completes onboarding.
      navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })
    }
  }, [disableRedirect, isOnboarded, isResetting])

  const initialStep = Object.keys(steps)[0] as Step | undefined

  if (!initialStep) {
    throw new Error('`steps` must have at least one `step`')
  }

  const [{ step, going, onboardingScreen }, setState] = useState<{
    onboardingScreen?: MaybeOnboardingProps
    step: Step
    going: 'forward' | 'backward'
  }>({
    step: initialStep,
    going: 'forward',
  })

  // This is needed to force the onboarding screen to re-render when the belowFrameContent or outsideContent changes
  useEffect(() => {
    const handler = (nextStep: Step, next: MaybeOnboardingProps): void => {
      if (
        nextStep === step &&
        (next?.belowFrameContent !== onboardingScreen?.belowFrameContent ||
          next?.outsideContent !== onboardingScreen?.outsideContent)
      ) {
        setState((prev) => {
          return {
            ...prev,
            onboardingScreen: {
              ...prev.onboardingScreen,
              belowFrameContent: next?.belowFrameContent,
              outsideContent: next?.outsideContent,
            },
          }
        })
      }
    }

    onboardingScreenListen.add(handler)
    return () => {
      onboardingScreenListen.delete(handler)
    }
  }, [onboardingScreen?.belowFrameContent, onboardingScreen?.outsideContent, step])

  const getCurrentStep = useRef(step)
  getCurrentStep.current = step

  const setStep = useCallback((nextStep: Step) => {
    setState((prev) => ({ ...prev, step: nextStep }))
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: onboardingScreenKey is a helper function defined below that doesn't need to be a dependency
  const setOnboardingScreen = useCallback((next: OnboardingScreenProps) => {
    clearTimeout(clearScreenTimeout)
    setState((prev) => {
      // we are only updating onboardingScreen here once per unique title so
      // the state in this component is accurate, but subsequent updates go
      // through the emitter
      if (onboardingScreenKey(prev.onboardingScreen) !== onboardingScreenKey(next)) {
        return {
          ...prev,
          onboardingScreen: next,
        }
      }
      return prev
    })
    onboardingScreenListen.forEach((cb) => cb(getCurrentStep.current, next))
    currentOnboardingScreen = next
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: onboardingScreenKey is a helper function defined below that doesn't need to be a dependency
  const clearOnboardingScreen = useCallback((next: OnboardingScreenProps) => {
    // delay clear so the next screen can beat clearing the old one to avoid flickering
    clearScreenTimeout = setTimeout(() => {
      setState((prev) => {
        if (prev.onboardingScreen && onboardingScreenKey(prev.onboardingScreen) === onboardingScreenKey(next)) {
          return {
            ...prev,
            onboardingScreen: null,
          }
        }
        return prev
      })
    })
  }, [])

  const onboardingScreenKey = (props?: MaybeOnboardingProps): string => {
    const keysString = Object.keys(props || {}).join('')
    const { title, subtitle } = props ?? {}
    return `${title}${subtitle}${keysString}`
  }

  const goToNextStep = useCallback(() => {
    const stepIndex = Object.keys(steps).indexOf(step)
    const nextStep = Object.keys(steps)[stepIndex + 1] as Step | undefined

    if (!nextStep) {
      throw new Error('No next step')
    }

    setState((prev) => ({
      ...prev,
      step: nextStep,
      going: 'forward',
    }))
  }, [step, steps])

  const goToPreviousStep = useCallback(() => {
    const stepIndex = Object.keys(steps).indexOf(step)
    const previousStep = Object.keys(steps)[stepIndex - 1] as Step | undefined

    if (!previousStep) {
      throw new Error('No previous step')
    }

    setState((prev) => ({
      ...prev,
      step: previousStep,
      going: 'backward',
    }))
  }, [step, steps])

  const state = useMemo<OnboardingStepsContextState>((): OnboardingStepsContextState => {
    return {
      step,
      setStep,
      goToNextStep,
      setOnboardingScreen,
      clearOnboardingScreen,
      goToPreviousStep,
      isResetting,
      going,
    }
  }, [step, setStep, goToNextStep, setOnboardingScreen, clearOnboardingScreen, goToPreviousStep, isResetting, going])

  const stepContents = steps[step]
  const [frameHeight, setFrameHeight] = useState(ONBOARDING_INITIAL_FRAME_HEIGHT)
  const windowDimensions = useWindowDimensions()
  const modalY = windowDimensions.height / 2 - frameHeight / 2
  const hasBelowFrameContent = Boolean(onboardingScreen?.belowFrameContent)
  const [belowFrameHeight, setBelowFrameHeight] = useState(-1)
  const y =
    modalY +
    // ensure vertically centered when belowFrameContent exists
    (hasBelowFrameContent
      ? -(belowFrameHeight === -1
          ? // estimate the content height before measurement
            63
          : belowFrameHeight) + 30
      : 0)

  if (!stepContents) {
    throw new Error(`Unknown step: ${step}`)
  }

  return (
    <OnboardingStepsContext.Provider value={state}>
      <ContainerComponent>
        {!onboardingScreen && <>{stepContents}</>}

        {/* render the contents from step here */}
        {onboardingScreen && (
          <>
            {/* render actual screen contents "offscreen", we use context and put it on onboardingScreen */}
            {/* biome-ignore lint/correctness/noRestrictedElements: probably we can replace it here */}
            <div style={{ height: 0, opacity: 0, pointerEvents: 'none' }}>{stepContents}</div>
            <Frame
              animation="stiff"
              y={y}
              onLayout={(e) => {
                setFrameHeight(e.nativeEvent.layout.height)
              }}
            >
              <FrameBackground height={frameHeight} />

              {/**
               * animate the inner contents of the onboarding steps modal
               * exitBeforeEnter because we are keeping things simpler and having the inner contents
               * not be absolutely positioned, which would let us do overlapping animations but we'd have
               * to measure dimensions and do some delicate state management around that.
               */}
              <FrameInner>
                {/* note: the exitBeforeEnter here affects the constant ONBOARDING_PANE_TRANSITION_DURATION in OnboardingPaneAnimatedContents.tsx */}
                <AnimatePresence exitBeforeEnter custom={{ going }} initial={false}>
                  <OnboardingPaneAnimatedContents key={step}>
                    <OnboardingScreenDisplay step={step} />
                  </OnboardingPaneAnimatedContents>
                </AnimatePresence>
              </FrameInner>

              {hasBelowFrameContent && (
                <Flex
                  left={0}
                  position="absolute"
                  right={0}
                  top="100%"
                  y="$spacing16"
                  onLayout={(e) => setBelowFrameHeight(e.nativeEvent.layout.height)}
                >
                  {onboardingScreen.belowFrameContent}
                </Flex>
              )}
            </Frame>
          </>
        )}

        {onboardingScreen?.outsideContent || null}
      </ContainerComponent>
    </OnboardingStepsContext.Provider>
  )
}

const OnboardingScreenDisplay = memo(function OnboardingScreenDisplay(props: { step: Step }): JSX.Element {
  const [state, setState] = useState<MaybeOnboardingProps>(currentOnboardingScreen)

  useEffect(() => {
    const handler = (step: Step, next: MaybeOnboardingProps): void => {
      if (step === props.step) {
        setState(next)
      }
    }

    onboardingScreenListen.add(handler)
    return () => {
      onboardingScreenListen.delete(handler)
    }
  }, [props.step])

  return <OnboardingScreenFrame {...state} />
})

// containing frame just for positioning
const Frame = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: '50%',
  x: -ONBOARDING_CONTENT_WIDTH * 0.5,
  alignItems: 'center',
  justifyContent: 'center',
  width: ONBOARDING_CONTENT_WIDTH,
})

// separate frame background so we can animate
const FrameBackground = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  backgroundColor: '$surface1',
  borderColor: '$surface3',
  borderRadius: '$rounded32',
  borderWidth: '$spacing1',
  shadowRadius: 4,
  shadowColor: '$shadowColor',
  shadowOffset: {
    height: 2,
    width: 0,
  },
  shadowOpacity: 0.25,
})

// inner frame to prevent overflow of outer frame
const FrameInner = styled(Flex, {
  height: '100%',
  overflow: 'hidden',
  width: '100%',
  borderRadius: '$rounded32',
  gap: '$spacing12',
  pb: '$spacing24',
  pt: '$spacing24',
  px: '$spacing24',
})
