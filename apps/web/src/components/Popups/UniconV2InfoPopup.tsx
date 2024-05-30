import Column from 'components/Column'
import Identicon, { IdenticonType, useIdenticonType } from 'components/Identicon'
import { PopupContainer } from 'components/Popups/PopupContent'
import Row from 'components/Row'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { X } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'

const StyledColumn = styled(Column)`
  width: 242px;
`

const StyledClose = styled(X)`
  right: 10px;
  top: 10px;
  stroke: ${({ theme }) => theme.neutral2};

  ${ClickableStyle}
`

export const showUniconV2InfoPopupAtom = atomWithStorage('showUniconV2InfoPopup', true)

export default function UniconV2InfoPopup() {
  const account = useAccount()
  const isUniconV2 = useIdenticonType(account.address) === IdenticonType.UNICON_V2
  const [showUniconV2InfoPopup, setShowUniconV2InfoPopup] = useAtom(showUniconV2InfoPopupAtom)

  return isUniconV2 && account.isConnected && showUniconV2InfoPopup ? (
    <PopupContainer>
      <Row align="flex-start" justify="space-between" padding="12px" gap="md">
        <Identicon account={account.address} size={40} />
        <StyledColumn>
          <ThemedText.BodyPrimary>
            <Trans>Your Unicon got a new look</Trans>
          </ThemedText.BodyPrimary>
          <ThemedText.BodySecondary>
            <Trans>We gave your wallet&apos;s unique Unicon a makeover.</Trans>
          </ThemedText.BodySecondary>
        </StyledColumn>
        <StyledClose onClick={() => setShowUniconV2InfoPopup(false)} />
      </Row>
    </PopupContainer>
  ) : null
}
