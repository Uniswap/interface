import { HideScrollBarStyles } from 'components/Common'
import { LoadingBubble } from 'components/Tokens/loading'
import { useToken } from 'hooks/Tokens'
import { LaunchpadOptions } from 'pages/LaunchpadCreate/launchpad-state'
import { ReactNode } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { Action } from '../LaunchpadCreate/ActionSelector'

const Table = styled.table`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  width: 100%;
  overflow: hidden;
`

export const Thead = styled.thead`
  overflow: auto;
  width: unset;
  background: ${({ theme }) => theme.surface2};
  ${HideScrollBarStyles}
  overscroll-behavior: none;
`

const TR = styled.tr`
  width: 100%;

  &:last-child {
    border-bottom: none;
  }
`

const TD = styled.td`
  border: ${({ theme }) => `1px solid ${theme.surface3}`};
  color: ${({ theme }) => theme.neutral2};
  padding: 10px 16px;
  text-align: left;
  vertical-align: middle;
  font-weight: 485;
  font-size: 16px;
`

const LoadingCell = styled(LoadingBubble)`
  height: 20px;
  width: 80px;
`

const SimpleTable = ({ children }: { children: ReactNode }) => {
  return (
    <Table>
      <tbody>{children}</tbody>
    </Table>
  )
}

const LoadingSimpleTableRow = ({ cellCount }: { cellCount: number }) => {
  return (
    <TR>
      {Array(cellCount)
        .fill(null)
        .map((_, index) => {
          return (
            <TD key={index}>
              <LoadingCell />
            </TD>
          )
        })}
    </TR>
  )
}

const LaunchpadInfoTable = ({
  options,
  loadingRowCount = 3,
}: {
  options?: LaunchpadOptions
  loadingRowCount?: number
}) => {
  const { formatNumber } = useFormatter()
  const token = useToken(options?.tokenInfo.tokenAddress)
  const quoteToken = useToken(options?.tokenSale.quoteToken)

  const tokensOffered = options
    ? parseFloat(options.tokenSale.hardCapAsQuote) / parseFloat(options.tokenSale.sellPrice)
    : 0

  const initialCirculatinSupply = options?.tokenInfo.tokenomics.reduce((acc, tokenomicsItem) => {
    return acc + tokenomicsItem.unlockedAmount
  }, 0)

  const totalSupply = options?.tokenInfo.tokenomics.reduce((acc, tokenomicsItem) => {
    return acc + tokenomicsItem.amount
  }, 0)

  const liqFees: Action[] = [
    {
      id: '100',
      name: '0.01%',
    },
    {
      id: '500',
      name: '0.05%',
    },
    {
      id: '3000',
      name: '0.3%',
    },
    {
      id: '10000',
      name: '1%',
    },
  ]
  const liqRanges: Action[] = [
    {
      id: 'NARROW',
      name: 'Narrow Range (66% ↓ \u00A0-\u00A0 3X ↑)',
    },
    {
      id: 'MEDIUM',
      name: 'Medium Range (90% ↓ \u00A0-\u00A0 10X ↑)',
    },
    {
      id: 'WIDE',
      name: 'Wide Range (99% ↓ \u00A0-\u00A0 100X ↑)',
    },
    {
      id: 'FULL',
      name: 'Full Range',
    },
  ]

  return options ? (
    <SimpleTable>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Tokens Offered</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            {formatNumber({
              input: tokensOffered,
              type: NumberType.TokenNonTx,
            })}{' '}
            {token?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Initial Circulating Supply</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            {formatNumber({
              input: initialCirculatinSupply,
              type: NumberType.TokenNonTx,
            })}{' '}
            {token?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Total Token Supply</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            {formatNumber({
              input: totalSupply,
              type: NumberType.TokenNonTx,
            })}{' '}
            {token?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Launchpad Price</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            1 {token?.symbol} = {options.tokenSale.sellPrice} {quoteToken?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Target (Hard Cap)</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            {formatNumber({
              input: parseFloat(options.tokenSale.hardCapAsQuote),
              type: NumberType.TokenNonTx,
            })}{' '}
            {quoteToken?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Soft Cap</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            {formatNumber({
              input: parseFloat(options.tokenSale.softCapAsQuote),
              type: NumberType.TokenNonTx,
            })}{' '}
            {quoteToken?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Listing Price (Liquidity)</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            1 {token?.symbol} = {options.liquidity.listingPrice} {quoteToken?.symbol}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Liquidty Info</ThemedText.BodyPrimary>
        </TD>
        <TD>
          <ThemedText.BodyPrimary color="neutral1">
            Fee tier = {liqFees.find((l) => l.id == options.liquidity.liquidityFee)?.name}
          </ThemedText.BodyPrimary>
          <ThemedText.BodyPrimary color="neutral1">
            Price range = {liqRanges.find((l) => l.id == options.liquidity.liquidityRange)?.name}
          </ThemedText.BodyPrimary>
        </TD>
      </TR>
      <TR>
        <TD>
          <ThemedText.BodyPrimary color="neutral2">Liquidity Action</ThemedText.BodyPrimary>
        </TD>
        <TD>
          {options.liquidity.liquidityAction == 'BURN' ? (
            <ThemedText.BodyPrimary color="neutral1">Liquidty will be burned</ThemedText.BodyPrimary>
          ) : (
            <ThemedText.BodyPrimary color="neutral1">
              Liquidty will be locked for {options.liquidity.lockDurationDays} days
            </ThemedText.BodyPrimary>
          )}
        </TD>
      </TR>
    </SimpleTable>
  ) : (
    <SimpleTable>
      {Array(loadingRowCount)
        .fill(null)
        .map((_, index) => {
          return <LoadingSimpleTableRow key={index} cellCount={2} />
        })}
    </SimpleTable>
  )
}

export default LaunchpadInfoTable
