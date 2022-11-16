import { formatEther } from '@ethersproject/units'
import { SquareArrowDownIcon, SquareArrowUpIcon, VerifiedIcon } from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import { Denomination } from 'nft/types'
import { volumeFormatter } from 'nft/utils'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ethNumberStandardFormatter, formatWeiToDecimal } from '../../../utils/currency'
import { formatChange } from '../../../utils/toSignificant'
import { Box } from '../../Box'
import { Column, Row } from '../../Flex'
import * as styles from './Cells.css'

const TruncatedText = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const CollectionNameContainer = styled(TruncatedText)`
  display: flex;
  padding: 14px 0px 14px 8px;
  align-items: center;
`

const CollectionName = styled(TruncatedText)`
  margin-left: 8px;
`

const TruncatedSubHeader = styled(ThemedText.SubHeader)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`
const TruncatedSubHeaderSmall = styled(ThemedText.SubHeaderSmall)`
  color: ${({ theme }) => `${theme.textPrimary}`};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const RoundedImage = styled.div<{ src?: string }>`
  height: 36px;
  width: 36px;
  border-radius: 36px;
  background: ${({ src, theme }) => (src ? `url(${src})` : theme.backgroundModule)};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`

const ChangeCellContainer = styled.div<{ change: number }>`
  display: flex;
  color: ${({ theme, change }) => (change >= 0 ? theme.accentSuccess : theme.accentFailure)};
  justify-content: end;
  align-items: center;
  gap: 2px;
`

const EthContainer = styled.div`
  display: flex;
  justify-content: end;
`

interface CellProps {
  value: {
    logo?: string
    name?: string
    address?: string
    isVerified?: boolean
    value?: number
    change?: number
  }
}

export const CollectionTitleCell = ({ value }: CellProps) => {
  const isMobile = useIsMobile()
  return (
    <CollectionNameContainer>
      <RoundedImage src={value.logo} />
      <CollectionName>
        {isMobile ? (
          <TruncatedSubHeaderSmall>{value.name}</TruncatedSubHeaderSmall>
        ) : (
          <TruncatedSubHeader>{value.name}</TruncatedSubHeader>
        )}
      </CollectionName>
      {value.isVerified && (
        <span className={styles.verifiedBadge}>
          <VerifiedIcon />
        </span>
      )}
    </CollectionNameContainer>
  )
}

export const DiscreteNumberCell = ({ value }: CellProps) => (
  <span>{value.value ? volumeFormatter(value.value) : '-'}</span>
)

const getDenominatedValue = (denomination: Denomination, inWei: boolean, value?: number, usdPrice?: number) => {
  if (denomination === Denomination.ETH) return value
  if (usdPrice && value) return usdPrice * (inWei ? parseFloat(formatEther(value)) : value)

  return undefined
}

export const EthCell = ({
  value,
  denomination,
  usdPrice,
}: {
  value?: number
  denomination: Denomination
  usdPrice?: number
}) => {
  const denominatedValue = getDenominatedValue(denomination, true, value, usdPrice)
  const formattedValue = denominatedValue
    ? denomination === Denomination.ETH
      ? formatWeiToDecimal(denominatedValue.toString(), true) + ' ETH'
      : ethNumberStandardFormatter(denominatedValue, true, false, true)
    : '-'

  return (
    <EthContainer>
      <ThemedText.BodyPrimary>{value ? formattedValue : '-'}</ThemedText.BodyPrimary>
    </EthContainer>
  )
}

export const TextCell = ({ value }: { value: string }) => <ThemedText.BodyPrimary>{value}</ThemedText.BodyPrimary>

export const VolumeCell = ({
  value,
  denomination,
  usdPrice,
}: {
  value?: number
  denomination: Denomination
  usdPrice?: number
}) => {
  const denominatedValue = getDenominatedValue(denomination, false, value, usdPrice)

  const formattedValue = denominatedValue
    ? denomination === Denomination.ETH
      ? ethNumberStandardFormatter(denominatedValue.toString(), false, false, true) + ' ETH'
      : ethNumberStandardFormatter(denominatedValue, true, false, true)
    : '-'

  return (
    <EthContainer>
      <ThemedText.BodyPrimary>{value ? formattedValue : '-'}</ThemedText.BodyPrimary>
    </EthContainer>
  )
}

export const ChangeCell = ({ change, children }: { children?: ReactNode; change?: number }) => (
  <ChangeCellContainer change={change ?? 0}>
    {!change || change > 0 ? (
      <SquareArrowUpIcon width="20px" height="20px" />
    ) : (
      <SquareArrowDownIcon width="20px" height="20px" />
    )}
    <ThemedText.BodyPrimary color="currentColor">
      {children || `${change ? Math.abs(Math.round(change)) : 0}%`}
    </ThemedText.BodyPrimary>
  </ChangeCellContainer>
)

export const WeiWithDayChange = ({ value }: CellProps) => (
  <Column gap="4">
    <Row justifyContent="flex-end" color="textPrimary">
      {value && value.value ? <>{formatWeiToDecimal(value.value.toString(), true)} ETH</> : '-'}
    </Row>
    {value.change ? (
      <Box
        as="span"
        color={value.change > 0 ? 'green' : 'accentFailure'}
        fontWeight="normal"
        fontSize="12"
        position="relative"
      >
        {value.change > 0 && '+'}
        {formatChange(value.change)}%
      </Box>
    ) : null}
  </Column>
)
