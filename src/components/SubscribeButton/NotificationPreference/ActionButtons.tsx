import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'

const ButtonText = styled.div`
  font-size: 14px;
  font-weight: 500;
`
const ActionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
`

export default function ActionButtons({
  disableButtonSave,
  isLoading,
  onSave,
  onUnsubscribeAll,
  isTelegramTab,
  subscribeAtLeast1Topic,
  isHorizontal,
}: {
  disableButtonSave: boolean
  subscribeAtLeast1Topic: boolean
  isTelegramTab: boolean
  isLoading: boolean
  onSave: () => void
  onUnsubscribeAll: () => void
  isHorizontal: boolean
}) {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const unSubButton = subscribeAtLeast1Topic ? (
    <Text
      style={{
        cursor: 'pointer',
        color: theme.subText,
        fontWeight: '500',
        fontSize: '14px',
      }}
      onClick={onUnsubscribeAll}
    >
      <Trans>Opt out from all future emails</Trans>
    </Text>
  ) : (
    isHorizontal && <div />
  )

  const heightBtn = isHorizontal ? '36px' : '44px'
  const widthBtn = isHorizontal ? '160px' : '100%'
  return (
    <ActionWrapper style={{ flexDirection: isHorizontal ? 'row' : 'column' }}>
      {isHorizontal && unSubButton}
      {!account ? (
        <ButtonConfirmed confirmed onClick={toggleWalletModal} height={heightBtn} width={widthBtn}>
          <ButtonText>
            <Trans>Connect Wallet</Trans>
          </ButtonText>
        </ButtonConfirmed>
      ) : (
        <ButtonPrimary
          disabled={disableButtonSave}
          borderRadius="46px"
          height={heightBtn}
          width={widthBtn}
          onClick={onSave}
        >
          <ButtonText>
            {(() => {
              if (isLoading) {
                return (
                  <Row>
                    <Loader />
                    &nbsp;
                    {isTelegramTab ? <Trans>Generating Verification Link ...</Trans> : <Trans>Saving ...</Trans>}
                  </Row>
                )
              }
              return isTelegramTab ? <Trans>Get Started</Trans> : <Trans>Save</Trans>
            })()}
          </ButtonText>
        </ButtonPrimary>
      )}
      {!isHorizontal && unSubButton}
    </ActionWrapper>
  )
}
