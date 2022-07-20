// import { Currency, Token } from '@uniswap/sdk-core'
// import { TokenList } from '@uniswap/token-lists'
// import usePrevious from 'hooks/usePrevious'
//import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { RowBetween } from 'components/Row'
import TokenWarningLabel from 'components/TokenWarningLabel'
import { WARNING_TO_ATTRIBUTES, WarningTypes } from 'constants/tokenWarnings'
import { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import Modal from '../../components/Modal'
import useLast from '../../hooks/useLast'

const StyledProceedButton = styled(ButtonPrimary)``

interface ExploreTokenWarningModalProps {
  currency: Currency | null | undefined
  isOpen: boolean
  onProceed: () => void
  onCancel: () => void
}

export enum CurrencyModalView {
  search,
  manage,
  importToken,
  importList,
}

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const Container = styled.div`
  padding: 30px 60px;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const InfoText = styled(Text)`
  padding-top: 12px;
  font-size: 14px;
  text-align: center;
`

export default function ExploreTokenWarningModal({
  currency,
  isOpen,
  onProceed,
  onCancel,
}: ExploreTokenWarningModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.manage)
  const lastOpen = useLast(isOpen)

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  // change min height if not searching
  const minHeight = modalView === CurrencyModalView.importToken || modalView === CurrencyModalView.importList ? 40 : 80
  const { heading, description } = WARNING_TO_ATTRIBUTES[WarningTypes.MEDIUM]

  return (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={80} minHeight={60}>
      <Wrapper>
        <Container>
          <AutoColumn>
            <RowBetween>
              <CurrencyLogo currency={currency} size="48px" />
            </RowBetween>
          </AutoColumn>
          <AutoColumn>
            <RowBetween marginTop="12px">
              <TokenWarningLabel warningType={WarningTypes.MEDIUM}></TokenWarningLabel>
            </RowBetween>
          </AutoColumn>
          <AutoColumn>
            <RowBetween>
              <InfoText fontSize="20px">{heading}</InfoText>
            </RowBetween>
          </AutoColumn>
          <AutoColumn>
            <RowBetween>
              <InfoText>
                {description} <b>Learn More</b>
              </InfoText>
            </RowBetween>
          </AutoColumn>
        </Container>
      </Wrapper>
    </Modal>
  )
}
