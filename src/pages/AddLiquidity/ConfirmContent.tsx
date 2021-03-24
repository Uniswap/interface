import React, { useState } from 'react'
import { ButtonPrimary } from '../../components/Button'
import { RowBetween, RowFixed } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import { Field } from '../../state/mint/actions'
import { TYPE, ExternalLink } from '../../theme'
import { AutoColumn } from 'components/Column'
import { OutlineCard, GreyCard, BlueCard } from 'components/Card'
import styled from 'styled-components'
import { Break } from 'components/earn/styled'
import useTheme from 'hooks/useTheme'
import { AlertOctagon } from 'react-feather'
import { ToggleWrapper, ToggleElement } from 'components/Toggle/MultiToggle'
import { useTranslation } from 'react-i18next'
import { Price, Percent, Currency, CurrencyAmount } from '@uniswap/sdk-core'

const Wrapper = styled(AutoColumn)`
  padding: 1rem 0;
`

export function ConfirmContent({
  currencies,
  parsedAmounts,
  onAdd,
}: {
  noLiquidity?: boolean
  price?: Price
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
}) {
  const currencyA: Currency | undefined = currencies[Field.CURRENCY_A]
  const currencyB: Currency | undefined = currencies[Field.CURRENCY_B]

  const [rateCurrency, setRateCurrency] = useState<Currency | undefined>(currencyA)

  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Wrapper gap="lg">
      <OutlineCard>
        <AutoColumn gap="md">
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currencyA} />
              <TYPE.label ml="8px">{currencyA?.symbol}</TYPE.label>
            </RowFixed>
            <RowFixed>
              <TYPE.label mr="8px">{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</TYPE.label>
              <GreyCard padding="4px 8px" width="fit-content" borderRadius="12px">
                <TYPE.darkGray>50%</TYPE.darkGray>
              </GreyCard>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currencyB} />
              <TYPE.label ml="8px">{currencyB?.symbol}</TYPE.label>
            </RowFixed>
            <RowFixed>
              <TYPE.label mr="8px">{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</TYPE.label>
              <GreyCard padding="4px 8px" borderRadius="12px" width="fit-content">
                <TYPE.darkGray>50%</TYPE.darkGray>
              </GreyCard>
            </RowFixed>
          </RowBetween>
          <Break />
          <RowBetween>
            <TYPE.label>{t('feePool')}</TYPE.label>
            <TYPE.label>0.6%</TYPE.label>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
      <BlueCard padding="12px">
        <RowBetween>
          <AlertOctagon stroke={theme.primary1} width={'90px'} />
          <TYPE.blue ml="12px" fontSize="14px">
            {t('rebalanceMessage')}
          </TYPE.blue>
        </RowBetween>
      </BlueCard>
      <OutlineCard padding="16px">
        <AutoColumn gap="md">
          <RowBetween>
            <TYPE.label>Position Limits</TYPE.label>
            {currencyA && currencyB && (
              <ToggleWrapper width="80px">
                <ToggleElement
                  fontSize="10px"
                  isActive={rateCurrency === currencyA}
                  onClick={() => setRateCurrency(currencyA)}
                >
                  {currencyA?.symbol}
                </ToggleElement>
                <ToggleElement
                  fontSize="10px"
                  isActive={rateCurrency === currencyB}
                  onClick={() => setRateCurrency(currencyB)}
                >
                  {currencyB?.symbol}
                </ToggleElement>
              </ToggleWrapper>
            )}
          </RowBetween>
          <RowBetween>
            <AutoColumn gap="2px">
              <TYPE.darkGray>Lower Limit</TYPE.darkGray>
              <TYPE.label fontSize="14px">1621.82</TYPE.label>
              <GreyCard padding="4px" borderRadius="4px" mt="6px">
                <RowFixed>
                  <CurrencyLogo currency={currencyA} size="12px" />
                  <TYPE.label fontSize="12px" ml="6px">
                    100%
                  </TYPE.label>
                  <TYPE.label fontSize="12px" ml="6px">
                    {currencyA?.symbol}
                  </TYPE.label>
                </RowFixed>
              </GreyCard>
            </AutoColumn>
            <AutoColumn gap="2px">
              <TYPE.darkGray>Entry Price</TYPE.darkGray>
              <TYPE.label fontSize="14px">1621.82</TYPE.label>
              <GreyCard padding="4px" borderRadius="4px" mt="6px">
                <TYPE.label fontSize="12px" ml="6px">
                  50%/50%
                </TYPE.label>
              </GreyCard>
            </AutoColumn>
            <AutoColumn gap="2px">
              <TYPE.darkGray>Upper Limit</TYPE.darkGray>
              <TYPE.label fontSize="14px">1621.82</TYPE.label>
              <GreyCard padding="4px" borderRadius="4px" mt="6px">
                <RowFixed>
                  <CurrencyLogo currency={currencyB} size="12px" />
                  <TYPE.label fontSize="12px" ml="6px">
                    100%
                  </TYPE.label>
                  <TYPE.label fontSize="12px" ml="6px">
                    {currencyB?.symbol}
                  </TYPE.label>
                </RowFixed>
              </GreyCard>
            </AutoColumn>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
      <TYPE.main>
        {t('addEarnHelper')}
        <ExternalLink href="">{t('learnMoreAboutFess')}</ExternalLink>
      </TYPE.main>
      <ButtonPrimary onClick={onAdd} fontSize="20px">
        {t('addLiquidity')}
      </ButtonPrimary>
    </Wrapper>
  )
}

export default ConfirmContent
