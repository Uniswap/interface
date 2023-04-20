import { formatEther } from '@ethersproject/units'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import { SquareArrowDownIcon, SquareArrowUpIcon, VerifiedIcon } from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import { Denomination } from 'nft/types'
import { volumeFormatter } from 'nft/utils'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ethNumberStandardFormatter, formatWeiToDecimal } from '../../../utils/currency'
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
  justify-content: flex-end;
  align-items: center;
  gap: 2px;
`

const EthContainer = styled.div`
  display: flex;
  justify-content: flex-end;
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
  const isNftGraphqlEnabled = useNftGraphqlEnabled()
  const denominatedValue = getDenominatedValue(denomination, !isNftGraphqlEnabled, value, usdPrice)
  const formattedValue = denominatedValue
    ? denomination === Denomination.ETH
      ? isNftGraphqlEnabled
        ? ethNumberStandardFormatter(denominatedValue.toString(), false, true, false) + ' ETH'
        : formatWeiToDecimal(denominatedValue.toString(), true) + ' ETH'
      : ethNumberStandardFormatter(denominatedValue, true, false, true)
    : '-'

  const isMobile = useIsMobile()
  const TextComponent = isMobile ? ThemedText.BodySmall : ThemedText.BodyPrimary

  return (
    <EthContainer>
      <TextComponent>{value ? formattedValue : '-'}</TextComponent>
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

export const ChangeCell = ({ change, children }: { children?: ReactNode; change?: number }) => {
  const isMobile = useIsMobile()
  const TextComponent = isMobile ? ThemedText.Caption : ThemedText.BodyPrimary
  return (
    <ChangeCellContainer change={change ?? 0}>
      {!change || change > 0 ? (
        <SquareArrowUpIcon width="20px" height="20px" />
      ) : (
        <SquareArrowDownIcon width="20px" height="20px" />
      )}
      <TextComponent color="currentColor">{children || `${change ? Math.abs(Math.round(change)) : 0}%`}</TextComponent>
    </ChangeCellContainer>
  )
}
