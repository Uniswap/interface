import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { DarkCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import NumericalInput from 'components/NumericalInput'
import { FixedHeightRow } from 'components/PositionCard'
import { AutoRow, RowBetween } from 'components/Row'
import { PurchaseBondCallback } from 'hooks/useBondDepository'
import { useContext, useState } from 'react'
import { Text } from 'rebass'
import { useCurrencyBalance } from 'state/wallet/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { IBond } from 'types/bonds'
import { trim } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

interface IPurchaseBondModalProps {
  bond: IBond
  isOpen: boolean
  onDismiss: () => any
  account: string | undefined
  purchaseCallback: PurchaseBondCallback
}

const Section = styled(AutoColumn)`
  margin-bottom: 30px;
`

const StyledCurrencyInput = styled(NumericalInput)`
  height: 50px;
  border-radius: 16px;
  padding: 0 15px;
`
export default function PurchaseBondModal({
  bond,
  isOpen,
  account,
  onDismiss,
  purchaseCallback,
}: IPurchaseBondModalProps) {
  const [purchaseState, setPurchaseState] = useState<{
    amount: string
  }>({
    amount: '0',
  })
  const theme = useContext(ThemeContext)
  const tokenBalance = useCurrencyBalance(account, bond.quoteCurrency)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <DarkCard padding="1rem" style={{ width: '500px', height: '500px' }}>
        <AutoColumn>
          <Section>
            <Text fontSize={16} fontWeight={500}>
              <Trans>{bond.displayName} Bond</Trans>
            </Text>
          </Section>

          <Section>
            <AutoColumn justify="center" style={{ padding: '0 60px' }}>
              <RowBetween align="center">
                <AutoColumn style={{ textAlign: 'center' }}>
                  <Text fontSize={14} color={theme.text3} marginBottom="10px">
                    Market Price
                  </Text>
                  <Text fontSize={24} fontWeight={500}>
                    $ {trim(`${bond.marketPrice}`, 2)}
                  </Text>
                </AutoColumn>

                <AutoColumn style={{ textAlign: 'center' }}>
                  <Text fontSize={14} color={theme.text3} marginBottom="10px">
                    Bond Price
                  </Text>
                  <Text fontSize={24} fontWeight={500}>
                    $ {trim(`${bond.priceUSD}`, 3)}
                  </Text>
                </AutoColumn>
              </RowBetween>
            </AutoColumn>
          </Section>

          <Section>
            <AutoRow gap={'0.4rem'}>
              <CurrencyLogo size="40px" style={{ marginLeft: '8px' }} url={bond.bondIconSvg} />
              <StyledCurrencyInput
                value={purchaseState.amount}
                onUserInput={(amount) => setPurchaseState({ ...purchaseState, amount })}
                placeholder={'0'}
                fontSize="30px"
              />
            </AutoRow>
          </Section>

          <Section>
            <AutoColumn gap="8px">
              <FixedHeightRow>
                <Text fontSize={14} color={theme.text3}>
                  <Trans>Your balance:</Trans>
                </Text>
                <Text fontSize={14} color={theme.text3}>
                  {formatCurrencyAmount(tokenBalance, 2)} {bond?.quoteCurrency?.symbol}
                </Text>
              </FixedHeightRow>

              <FixedHeightRow>
                <Text fontSize={14} color={theme.text3}>
                  <Trans>You will get:</Trans>
                </Text>
                <Text fontSize={14} color={theme.text3}>
                  {`sGEN ${trim(`${Number(purchaseState.amount) / bond.priceToken}`, 2)}`}
                </Text>
              </FixedHeightRow>

              <FixedHeightRow>
                <Text fontSize={14} color={theme.text3}>
                  <Trans>Max you can buy:</Trans>
                </Text>
                <Text fontSize={14} color={theme.text3}>
                  {trim(`${bond.maxPayoutOrCapacityInQuote}`, 10)} {bond?.quoteCurrency?.symbol}
                </Text>
              </FixedHeightRow>

              <FixedHeightRow>
                <Text fontSize={14} color={theme.text3}>
                  <Trans>ROI:</Trans>
                </Text>
                <Text fontSize={14} color={theme.text3}>
                  {trim(`${bond.discount}`, 2)} %
                </Text>
              </FixedHeightRow>

              <FixedHeightRow>
                <Text fontSize={14} color={theme.text3}>
                  <Trans>Duration:</Trans>
                </Text>
                <Text fontSize={14} color={theme.text3}>
                  {bond.duration}
                </Text>
              </FixedHeightRow>
            </AutoColumn>
          </Section>

          <Section>
            <ButtonPrimary>Bond</ButtonPrimary>
          </Section>
        </AutoColumn>
      </DarkCard>
    </Modal>
  )
}
