import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { Button, Flex, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'
import { isHttpsUri } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'

// Refusal screen for dApp-requested swaps of a permissioned token when the active
// wallet is not allowlisted. DappRequestContent renders its confirm button only when
// `confirmText` is set, so omitting it removes any way to sign the doomed transaction;
// the footer's cancel button rejects the request. The KYC link opens in a normal
// browser tab, matching the user-initiated swap surface decision.
export function PermissionedSwapBlockedContent({
  blockedSymbol,
  kycUrl,
  onCancel,
}: {
  blockedSymbol: string | undefined
  kycUrl: string | undefined
  onCancel?: () => Promise<void>
}): JSX.Element {
  const { t } = useTranslation()

  const onPressVerify = (): void => {
    // Self-contained https guard: kycUrl is already https-sanitized upstream by useTokenKYCStatus,
    // but re-checking here makes `isSafeUri: true` (which skips openUri's own validation) safe on
    // its own terms rather than relying on a cross-file invariant.
    if (!kycUrl || !isHttpsUri(kycUrl)) {
      return
    }
    openUri({ uri: kycUrl, openExternalBrowser: true, isSafeUri: true }).catch((error: unknown) => {
      logger.warn('PermissionedSwapBlockedContent', 'onPressVerify', 'openUri failed', { error })
    })
  }

  return (
    <DappRequestContent title={t('permissionedPool.verifyIdentity.title')} onCancel={onCancel}>
      <Flex centered gap="$spacing12" px="$spacing8" py="$spacing16">
        <Flex centered backgroundColor="$surface2" borderRadius="$rounded12" p="$spacing12">
          <Lock color="$neutral1" size="$icon.24" />
        </Flex>
        <Text color="$neutral2" textAlign="center" variant="body3">
          {t('permissionedPool.dappRequest.notAllowlisted', { tokenSymbol: blockedSymbol ?? '' })}
        </Text>
        {kycUrl && (
          <Flex centered row width="100%">
            <Button size="medium" testID={TestID.VerifyIdentityButton} variant="branded" onPress={onPressVerify}>
              {t('permissionedPool.verifyIdentity.cta')}
            </Button>
          </Flex>
        )}
      </Flex>
    </DappRequestContent>
  )
}
