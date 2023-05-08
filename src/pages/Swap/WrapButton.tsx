import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { WrapErrorText, WrapInputError, WrapType } from 'hooks/useWrapCallback'

interface WrapButtonProps {
  onClick: (() => Promise<void>) | undefined
  error?: WrapInputError
  type: WrapType
}

export function WrapButton({ onClick, error, type }: WrapButtonProps) {
  return (
    <ButtonPrimary disabled={Boolean(error)} onClick={onClick} fontWeight={600} data-testid="wrap-button">
      {error ? (
        <WrapErrorText wrapInputError={error} />
      ) : type === WrapType.WRAP ? (
        <Trans>Wrap</Trans>
      ) : type === WrapType.UNWRAP ? (
        <Trans>Unwrap</Trans>
      ) : null}
    </ButtonPrimary>
  )
}
