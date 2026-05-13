import type { ReactNode } from 'react'
import { Flex, SpinningLoader, Text } from 'ui/src'
import { StepHeader } from 'uniswap/src/components/passkey/recovery/StepHeader'

export function OAuthLoadingStep({
  oauthError,
  handleClose,
  headerActions,
}: {
  oauthError: string | undefined
  handleClose: () => void
  headerActions?: ReactNode | null
}): JSX.Element {
  return (
    <Flex gap="$gap24" alignItems="center" py="$spacing32" width="100%">
      {oauthError ? (
        <>
          <StepHeader headerActions={headerActions} onBack={handleClose} onClose={handleClose} />
          <Text variant="body2" color="$statusCritical" textAlign="center">
            {oauthError}
          </Text>
        </>
      ) : (
        <SpinningLoader size={32} />
      )}
    </Flex>
  )
}
