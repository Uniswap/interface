import { Trans } from '@lingui/macro'
import { CurrencyAmount, Price } from '@uniswap/sdk-core'
import {
  useOpenOffchainActivityModal,
  useOrderAmounts,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import Column from 'components/Column'
import Row from 'components/Row'
import { parseUnits } from 'ethers/lib/utils'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { useMemo } from 'react'
import { ArrowRight } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

const StyledPortfolioRow = styled(PortfolioRow)`
  padding: 8px 16px;
  height: unset;
`

interface LimitDetailActivityRowProps {
  order: Activity
  onToggleSelect: (order: Activity) => void
  selected: boolean
}

export function LimitDetailActivityRow({ order, onToggleSelect, selected }: LimitDetailActivityRowProps) {
  const theme = useTheme()
  const { chainId, logos, otherAccount, currencies, offchainOrderDetails } = order
  const openOffchainActivityModal = useOpenOffchainActivityModal()
  const { formatReviewSwapCurrencyAmount } = useFormatter()

  const amounts = useOrderAmounts(order.offchainOrderDetails)
  const amountsDefined = !!amounts?.inputAmount?.currency && !!amounts?.outputAmount?.currency

  const displayPrice = useMemo(() => {
    if (!amountsDefined) return undefined
    const tradePrice = new Price({ baseAmount: amounts?.inputAmount, quoteAmount: amounts?.outputAmount })
    return tradePrice.quote(
      CurrencyAmount.fromRawAmount(
        amounts.inputAmount.currency,
        parseUnits('1', amounts.inputAmount.currency.decimals).toString()
      )
    )
  }, [amounts?.inputAmount, amounts?.outputAmount, amountsDefined])

  if (!offchainOrderDetails || !amountsDefined) return null

  return (
    <Row>
      <StyledPortfolioRow
        left={
          <Column>
            <PortfolioLogo chainId={chainId} currencies={currencies} images={logos} accountAddress={otherAccount} />
          </Column>
        }
        title={
          offchainOrderDetails?.expiry ? (
            <ThemedText.LabelMicro fontWeight={500}>
              <Trans>Expires {formatTimestamp(offchainOrderDetails.expiry * 1000, true)}</Trans>
            </ThemedText.LabelMicro>
          ) : undefined
        }
        descriptor={
          <Column>
            <Row gap="sm" align="center">
              <ThemedText.SubHeader color="neutral1">
                {formatReviewSwapCurrencyAmount(amounts.inputAmount)} {amounts.inputAmount.currency.symbol}
              </ThemedText.SubHeader>
              <ArrowRight color={theme.neutral1} size="12px" />
              <ThemedText.SubHeader color="neutral1">
                {formatReviewSwapCurrencyAmount(amounts.outputAmount)} {amounts.outputAmount.currency.symbol}
              </ThemedText.SubHeader>
            </Row>
            {displayPrice && (
              <ThemedText.SubHeaderSmall color={theme.neutral1}>
                <Trans>
                  when {formatReviewSwapCurrencyAmount(displayPrice)} {amounts.outputAmount.currency.symbol}/
                  {amounts.inputAmount.currency.symbol}
                </Trans>
              </ThemedText.SubHeaderSmall>
            )}
          </Column>
        }
        right={undefined}
        onClick={() => {
          openOffchainActivityModal(offchainOrderDetails, {
            inputLogo: order?.logos?.[0],
            outputLogo: order?.logos?.[1],
          })
        }}
      />
      <Checkbox size={16} hovered={false} checked={selected} onChange={() => onToggleSelect(order)} />
    </Row>
  )
}
