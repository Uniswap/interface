import { formatEther } from '@ethersproject/units'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { VerifiedIcon } from 'nft/components/icons'
import { useIsMobile } from 'nft/hooks'
import { Denomination } from 'nft/types'
import { ReactNode } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
  color: ${({ theme }) => `${theme.neutral1}`};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const RoundedImage = styled.div<{ src?: string }>`
  height: 36px;
  width: 36px;
  border-radius: 36px;
  background: ${({ src, theme }) => (src ? `url(${src})` : theme.surface2)};
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
`

const ChangeCellContainer = styled.div<{ change: number }>`
  display: flex;
  color: ${({ theme, change }) => (change >= 0 ? theme.success : theme.critical)};
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

export const DiscreteNumberCell = ({ value }: CellProps) => {
  const { formatNumberOrString } = useFormatter()
  return (
    <span>{value.value ? formatNumberOrString({ input: value.value, type: NumberType.NFTCollectionStats }) : '-'}</span>
  )
}

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
  const { formatNumberOrString } = useFormatter()
  const denominatedValue = getDenominatedValue(denomination, false, value, usdPrice)
  const ethDenomination = denomination === Denomination.ETH
  const formattedValue =
    formatNumberOrString({
      input: denominatedValue,
      type: ethDenomination ? NumberType.NFTToken : NumberType.FiatTokenStats,
    }) + (ethDenomination ? ' ETH' : '')

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
  const { formatNumberOrString } = useFormatter()
  const denominatedValue = getDenominatedValue(denomination, false, value, usdPrice)
  const ethDenomination = denomination === Denomination.ETH

  const formattedValue =
    formatNumberOrString({
      input: denominatedValue,
      type: ethDenomination ? NumberType.WholeNumber : NumberType.FiatTokenStats,
    }) + (ethDenomination ? ' ETH' : '')

  return (
    <EthContainer>
      <ThemedText.BodyPrimary>{formattedValue}</ThemedText.BodyPrimary>
    </EthContainer>
  )
}

export const ChangeCell = ({ change, children }: { children?: ReactNode; change?: number }) => {
  const isMobile = useIsMobile()
  const TextComponent = isMobile ? ThemedText.BodySmall : ThemedText.BodyPrimary
  return (
    <ChangeCellContainer change={change ?? 0}>
      <DeltaArrow delta={change} />
      <TextComponent color="currentColor">{children || `${change ? Math.abs(Math.round(change)) : 0}%`}</TextComponent>
    </ChangeCellContainer>
  )
}
