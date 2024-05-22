import { CurrencyAmount, Price } from '@uniswap/sdk-core'
import {
  useOpenOffchainActivityModal,
  useOrderAmounts,
} from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { FormatType, formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import Column from 'components/Column'
import Row from 'components/Row'
import { parseUnits } from 'ethers/lib/utils'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/useScreenSize'
import { Trans } from 'i18n'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { useMemo, useState } from 'react'
import { ArrowRight } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { useFormatter } from 'utils/formatNumbers'

const StyledPortfolioRow = styled(PortfolioRow)`
  padding: 8px 0;
  height: unset;
  ${EllipsisStyle}
`

interface LimitDetailActivityRowProps {
  order: Activity
  onToggleSelect: (order: Activity) => void
  selected: boolean
}

const StyledCheckbox = styled(Checkbox)<{ $visible?: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
`

const TradeSummaryContainer = styled(Row)`
  * {
    max-width: 40%;
    ${EllipsisStyle}
  }
`

const CircleLogoImage = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
`

export function LimitDetailActivityRow({ order, onToggleSelect, selected }: LimitDetailActivityRowProps) {
  const theme = useTheme()
  const { logos, currencies, offchainOrderDetails } = order
  const inputCurrencyInfo = useCurrencyInfo(currencies?.[0])
  const outputCurrencyInfo = useCurrencyInfo(currencies?.[1])
  const openOffchainActivityModal = useOpenOffchainActivityModal()
  const { formatReviewSwapCurrencyAmount } = useFormatter()
  const [hovered, setHovered] = useState(false)
  const isSmallScreen = !useScreenSize()['sm']

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

  const inputLogo = logos?.[0] ?? inputCurrencyInfo?.logoUrl
  const outputLogo = logos?.[1] ?? outputCurrencyInfo?.logoUrl

  const cancelling = offchainOrderDetails.status === UniswapXOrderStatus.PENDING_CANCELLATION

  return (
    <Row onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <StyledPortfolioRow
        left={undefined}
        title={
          cancelling ? (
            <ThemedText.LabelMicro fontWeight={500}>
              <Trans>Pending cancellation</Trans>
            </ThemedText.LabelMicro>
          ) : offchainOrderDetails?.expiry ? (
            <ThemedText.LabelMicro fontWeight={500}>
              <Trans>
                Expires {{ timestamp: formatTimestamp(offchainOrderDetails.expiry * 1000, true, FormatType.Short) }}
              </Trans>
            </ThemedText.LabelMicro>
          ) : undefined
        }
        descriptor={
          <Column>
            <TradeSummaryContainer gap="xs" align="center">
              {inputLogo && <CircleLogoImage src={inputLogo} size="16px" />}
              <ThemedText.SubHeader color="neutral1">
                {formatReviewSwapCurrencyAmount(amounts.inputAmount)} {amounts.inputAmount.currency.symbol}
              </ThemedText.SubHeader>
              <ArrowRight color={theme.neutral1} size="12px" />
              {outputLogo && <CircleLogoImage src={outputLogo} size="16px" />}
              <ThemedText.SubHeader color="neutral1">
                {formatReviewSwapCurrencyAmount(amounts.outputAmount)} {amounts.outputAmount.currency.symbol}
              </ThemedText.SubHeader>
            </TradeSummaryContainer>
            {displayPrice && (
              <ThemedText.SubHeaderSmall color={theme.neutral1}>
                <Trans>
                  when {{ price: formatReviewSwapCurrencyAmount(displayPrice) }}{' '}
                  {{ outSymbol: amounts.outputAmount.currency.symbol }}/
                  {{ inSymbol: amounts.inputAmount.currency.symbol }}
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
      {!cancelling && (
        <StyledCheckbox
          $visible={hovered || selected || isSmallScreen}
          size={18}
          hovered={false}
          checked={selected}
          onChange={() => onToggleSelect(order)}
        />
      )}
    </Row>
  )
}
