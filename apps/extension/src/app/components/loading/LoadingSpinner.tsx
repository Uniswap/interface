import { Flex } from 'ui/src'
import { LoadingSpinnerInner, LoadingSpinnerOuter } from 'ui/src/components/icons'

const SPINNER_HEIGHT = 80

export function LoadingSpinner(): JSX.Element {
  return (
    <>
      <Flex height={SPINNER_HEIGHT} position="relative" width={80}>
        <Flex bottom={0} left={0} position="absolute" right={0} top={0}>
          <LoadingSpinnerOuter color="$DEP_brandedAccentSoft" size={80} />
        </Flex>
        <Flex
          bottom={0}
          left={0}
          position="absolute"
          right={0}
          style={{ animation: `spin ${SPIN_SPEED_MS}ms linear infinite` }}
          top={0}
        >
          <LoadingSpinnerInner color="$accent1" size={80} />
        </Flex>
      </Flex>
    </>
  )
}

const SPIN_SPEED_MS = 1000
