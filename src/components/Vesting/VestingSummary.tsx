import React from 'react'
import { Trans, t } from '@lingui/macro'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import AgriCulture from 'components/Icons/AgriCulture'
import HoverDropdown from 'components/HoverDropdown'
import { ChevronDown, Lock, Unlock, DollarSign } from 'react-feather'
import { formatDollarAmount } from 'utils/numbers'
import CurrencyLogo from 'components/CurrencyLogo'
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import Loader from 'components/Loader'
import HoverInlineText from 'components/HoverInlineText'

const SummaryWrapper = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin-top: 32px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `}
`

const SummaryItem = styled.div`
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  padding: 20px 20px 24px;
`
const SummaryItemTitle = styled.div`
  border-bottom: 1px dashed ${({ theme }) => theme.border};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
`

type Formatted = { value: number; amountByAddress: { [tokenAddress: string]: CurrencyAmount<Token> } }

function VestingSummary({
  loading,
  totalHarvested,
  locked,
  unlocked,
  claimed,
}: {
  loading: boolean
  totalHarvested: Formatted
  locked: Formatted
  unlocked: Formatted
  claimed: Formatted
}) {
  const theme = useTheme()
  return (
    <>
      <Text fontWeight={500} fontSize="1rem">
        <Trans>Summary</Trans>
      </Text>

      <SummaryWrapper>
        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip
              text={t`The total amount of rewards you have harvested from the farms. Harvested rewards are locked initially and vested linearly over a short period.`}
            >
              <SummaryItemTitle>
                <Trans>Total Harvested Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <AgriCulture color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? (
                <Loader />
              ) : (
                <HoverInlineText maxCharacters={12} text={formatDollarAmount(totalHarvested.value)} />
              )}
            </Text>

            <HoverDropdown
              placement="right"
              hideIcon
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(totalHarvested.amountByAddress).length
                  ? Object.values(totalHarvested.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>

        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip text={t`The amount of rewards that are locked as they are currently vesting`}>
              <SummaryItemTitle>
                <Trans>Locked Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <Lock size={20} color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? <Loader /> : <HoverInlineText maxCharacters={12} text={formatDollarAmount(locked.value)} />}
            </Text>

            <HoverDropdown
              hideIcon
              placement="right"
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(locked.amountByAddress).length
                  ? Object.values(locked.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>

        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip
              text={t`The amount of rewards that are unlocked and can be claimed instantly as their vesting is over`}
            >
              <SummaryItemTitle>
                <Trans>Unlocked Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <Unlock size={20} color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24} flex={1} overflow="hidden">
              {loading ? (
                <Loader />
              ) : (
                <HoverInlineText maxCharacters={12} text={formatDollarAmount(unlocked.value)}></HoverInlineText>
              )}
            </Text>

            <HoverDropdown
              hideIcon
              placement="right"
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(unlocked.amountByAddress).length
                  ? Object.values(unlocked.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>

        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip text={t`The amount of rewards you have already claimed`}>
              <SummaryItemTitle>
                <Trans>Claimed Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <DollarSign size={20} color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? <Loader /> : <HoverInlineText maxCharacters={12} text={formatDollarAmount(claimed.value)} />}
            </Text>

            <HoverDropdown
              hideIcon
              placement="right"
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(claimed.amountByAddress).length
                  ? Object.values(claimed.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>
      </SummaryWrapper>
    </>
  )
}

export default VestingSummary
