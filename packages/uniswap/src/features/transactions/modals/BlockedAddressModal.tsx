import { isWebApp } from '@universe/environment'
import { Anchor, Flex, Text, useSporeColors } from '@universe/mycelium'
import { Blocked } from '@universe/mycelium/icons/Blocked'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const COMPLIANCE_EMAIL = 'compliance@uniswap.org'

export function BlockedAddressModal({
  isOpen,
  onClose,
  address,
}: {
  isOpen: boolean
  onClose: () => void
  /** Shown on web so a blocked user can see which of their addresses was refused. */
  address?: string
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  // Not a `.web.tsx` split: the extension resolves `.web.tsx` too, so `isWebApp` is the
  // only thing that tells the web app apart from it. The wallets keep their own copy.
  if (!isWebApp) {
    return (
      <WarningModal
        caption={t('send.warning.blocked.modal.message')}
        rejectText={t('common.button.understand')}
        isOpen={isOpen}
        modalName={ModalName.BlockedAddress}
        severity={WarningSeverity.None}
        title={t('send.warning.blocked.modal.title')}
        onClose={onClose}
      />
    )
  }

  return (
    <WarningModal
      isOpen={isOpen}
      modalName={ModalName.BlockedAddress}
      severity={WarningSeverity.None}
      icon={<Blocked color="$neutral1" size="$icon.24" />}
      backgroundIconColor={colors.surface3.val}
      titleComponent={
        <Flex centered gap="$spacing8">
          <Text variant="subheading1">{t('common.blockedAddress')}</Text>
          <Text color="$neutral2" variant="body3">
            {address}
          </Text>
        </Flex>
      }
      captionComponent={
        <Flex centered gap="$spacing8">
          <Text color="$neutral2" variant="body3" textAlign="center">
            <Trans
              i18nKey="common.blocked.reason"
              components={{
                link: (
                  <Anchor href={UniswapHelpUrls.articles.addressScreening} target="_blank" rel="noopener noreferrer" />
                ),
              }}
            />
          </Text>
          <Text color="$neutral2" variant="body3" textAlign="center">
            <Trans
              i18nKey="common.blocked.ifError"
              components={{
                // The catalog string ends in "...to <emailAddress />", and the placeholder is
                // self-closing, so Trans clones it with no children — the anchor carries its own
                // text. It also has to render inline: Text is display:inline, so a Flex (a block
                // flex box) here drops the email out of the sentence onto its own line.
                emailAddress: (
                  <Anchor href={`mailto:${COMPLIANCE_EMAIL}`} variant="body3" color="$neutral1">
                    {COMPLIANCE_EMAIL}
                  </Anchor>
                ),
              }}
            />
          </Text>
        </Flex>
      }
      onClose={onClose}
    />
  )
}
