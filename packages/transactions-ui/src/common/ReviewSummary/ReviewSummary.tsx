import { Flex, type FlexProps, Loader, ModalCloseIcon, Text, type TextProps } from '@universe/mycelium'
import { ArrowDown } from '@universe/mycelium/icons/ArrowDown'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import type { ReactNode } from 'react'

/**
 * `indicative`: the quote is an estimate that is not firm yet. `dimmed`: a newer quote
 * waits for the user to accept it, so the numbers shown are stale. When both apply the
 * adapter passes `indicative`; the old flow rendered the same colors in that case.
 */
export type ReviewAmountState = 'default' | 'indicative' | 'dimmed'

/** Cross-chain only: which network this side of the trade is on. */
export interface ReviewAmountNetwork {
  /** e.g. "Base". */
  label: string
  /** The network's brand color for the label. */
  color: TextProps['color']
  /** Slot: the network logo. */
  logo: ReactNode
}

export interface ReviewAmount {
  /** Formatted amount without symbol: `1,240.55`. */
  amount: string
  /** Raw token symbol, untruncated: the row ellipsizes it by available width, never by character count. */
  symbol: string
  /** Formatted fiat value: `$1,239.80`. */
  fiat: string
  /** Slot: the token logo. Becomes TokenLogo props once TokenLogo lands in common/. */
  logo: ReactNode
  state?: ReviewAmountState
  /** Quote refresh in flight for this side: amount and fiat render as skeleton bars, the symbol stays. */
  isAmountLoading?: boolean
  network?: ReviewAmountNetwork
}

export interface ReviewSummaryProps {
  /** Product copy, e.g. "You're swapping". */
  title: string
  /** `null` while currency info is still loading: the row renders one skeleton block at its final height. */
  input: ReviewAmount | null
  output: ReviewAmount | null
  /** Header close button. Shown only when set; the web adapter sets it. */
  onClose?: () => void
  testID?: string
}

const SHORT_GAP: FlexProps['$short'] = { gap: '$spacing8' }

/**
 * The review screen's in/out block: header, input amount, arrow, output amount.
 * Product-neutral: LP, send and earn review the same shape with their own title.
 * Replaces TransactionAmountsReview's markup.
 *
 * Slots: the two token logos and, on cross-chain trades, the two network logos (4).
 *
 * @alias TransactionAmountsReview, ReviewAmounts, ReviewHeader
 */
export function ReviewSummary({ title, input, output, onClose, testID }: ReviewSummaryProps): JSX.Element {
  return (
    <Flex $short={SHORT_GAP} gap="$spacing16" ml="$spacing12" mr="$spacing12" testID={testID}>
      <Flex row alignItems="center">
        <Flex fill>
          <Text color="$neutral2" variant="body2">
            {title}
          </Text>
        </Flex>
        {onClose && (
          <Flex row centered gap="$spacing12">
            <ModalCloseIcon size="$icon.20" onClose={onClose} />
          </Flex>
        )}
      </Flex>

      {input ? <ReviewAmountRow {...input} /> : <ReviewAmountRowSkeleton />}

      <ArrowDown color="$neutral3" size="$icon.20" />

      {output ? <ReviewAmountRow {...output} /> : <ReviewAmountRowSkeleton />}
    </Flex>
  )
}

// Matches a same-chain loaded row. A cross-chain row adds the network line, so the review still
// grows when its amounts load, as the old one did. Change both together.
function ReviewAmountRowSkeleton(): JSX.Element {
  return <Loader.Box height={60} />
}

function ReviewAmountRow({
  amount,
  symbol,
  fiat,
  logo,
  state = 'default',
  isAmountLoading,
  network,
}: ReviewAmount): JSX.Element {
  const media = useMedia()
  const amountColor = state === 'indicative' ? '$neutral2' : state === 'dimmed' ? '$neutral3' : '$neutral1'
  const fiatColor = state === 'default' ? '$neutral2' : '$neutral3'

  return (
    <Flex centered grow row gap="$spacing8">
      {/* shrink lets the column narrow below its content so a long symbol ellipsizes before the logo */}
      <Flex grow shrink gap="$spacing4">
        {network && (
          <Flex row alignItems="center" gap="$spacing4" mt={media.sm ? '$spacing8' : undefined}>
            {network.logo}
            <Text color={network.color} variant="buttonLabel3">
              {network.label}
            </Text>
          </Flex>
        )}
        {isAmountLoading ? (
          <Flex row alignItems="center" gap="$spacing8">
            <Loader.Box height={28} width={96} />
            {symbol ? (
              <Text color={amountColor} flexShrink={1} numberOfLines={1} variant="heading3">
                {symbol}
              </Text>
            ) : null}
          </Flex>
        ) : (
          // Only the symbol gives way: the amount never shrinks or truncates, however narrow the row.
          <Flex row alignItems="center" gap="$spacing6">
            <Text color={amountColor} flexShrink={0} variant="heading3">
              {amount}
            </Text>
            {symbol ? (
              <Text color={amountColor} flexShrink={1} numberOfLines={1} variant="heading3">
                {symbol}
              </Text>
            ) : null}
          </Flex>
        )}
        {isAmountLoading ? (
          <Loader.Box height={18} width={72} />
        ) : (
          <Text color={fiatColor} variant="body2">
            {fiat}
          </Text>
        )}
      </Flex>
      {logo}
    </Flex>
  )
}
