import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import useENSName from 'hooks/useENSName'
import { useIsMobile } from 'nft/hooks'
import { GenieAsset } from 'nft/types'
import { ReactNode, useReducer } from 'react'
import { ChevronDown, DollarSign } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS, EllipsisStyle, ThemedText } from 'theme'
import { isAddress, shortenAddress } from 'utils'

const StyledBubble = styled(Row)`
  background-color: ${({ theme }) => theme.backgroundSurface};
  padding: 10px 12px 10px 8px;
  border-radius: 20px;
  max-width: 144px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    max-width: 169px;
  }
`

const StyledLabelMedium = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.textPrimary};

  ${EllipsisStyle}
`

const StyledIcon = styled(Row)`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.accentAction};
  border-radius: 100%;
  overflow: hidden;
  justify-content: center;
  align-items: center;
`

const InfoBubble = ({ title, info, icon }: { title: ReactNode; info: string; icon: ReactNode }) => {
  return (
    <Column gap="sm">
      <ThemedText.Caption color="textSecondary">{title}</ThemedText.Caption>
      <StyledBubble gap="sm">
        <StyledIcon>{icon}</StyledIcon>
        <StyledLabelMedium>{info}</StyledLabelMedium>
      </StyledBubble>
    </Column>
  )
}

const InfoChipDropdown = styled.button`
  padding: 10px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  color: ${({ theme }) => theme.textSecondary};
  border-radius: 100%;
  border: none;
  cursor: pointer;
`

const InfoChipDropdownContainer = styled(Column)`
  height: 100%;
  margin-top: auto;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const Break = styled(Column)`
  flex-basis: 100%;
`

const InfoChipsContainer = styled(Row)`
  gap: 4px;
  width: 100%;
  flex-wrap: wrap;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    gap: 12px;
    flex-wrap: nowrap;
  }
`

const StyledChevron = styled(ChevronDown)<{ $isOpen: boolean }>`
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  will-change: transform;
  transition: transform ${({ theme }) => theme.transition.duration.medium};
`

export const InfoChips = ({ asset }: { asset: GenieAsset }) => {
  const isMobile = useIsMobile()
  const [showExtraInfoChips, toggleShowExtraInfoChips] = useReducer((s) => !s, false)
  const shouldShowExtraInfoChips = isMobile && showExtraInfoChips

  const topTrait = asset?.traits?.[0]

  const isChecksummedAddress = isAddress(asset.ownerAddress)
  const checksummedAddress = isChecksummedAddress ? isChecksummedAddress : undefined
  const { ENSName } = useENSName(checksummedAddress)
  const { avatar } = useENSAvatar(checksummedAddress)
  const shortenedAddress = asset.ownerAddress ? shortenAddress(asset.ownerAddress) : ''
  const addressToDisplay = ENSName ?? shortenedAddress
  const avatarToDisplay = avatar ? (
    <img src={avatar} width={24} height={24} />
  ) : (
    <Unicon size={24} address={asset.ownerAddress ?? ''} />
  )

  return (
    <Column gap="sm">
      <InfoChipsContainer justify="center">
        <InfoBubble title={<Trans>Owner</Trans>} info={addressToDisplay} icon={avatarToDisplay} />
        <InfoBubble title={<Trans>Trait Floor</Trans>} info="5.3 ETH" icon={<DollarSign size={20} />} />
        {topTrait && (
          <InfoChipDropdownContainer>
            <InfoChipDropdown onClick={toggleShowExtraInfoChips}>
              <StyledChevron $isOpen={showExtraInfoChips} size={20} display="block" />
            </InfoChipDropdown>
          </InfoChipDropdownContainer>
        )}
        {shouldShowExtraInfoChips && <Break />}
        {topTrait && (!isMobile || shouldShowExtraInfoChips) && (
          <InfoBubble title={<Trans>Top Trait</Trans>} info={topTrait.trait_value} icon="" />
        )}
      </InfoChipsContainer>
    </Column>
  )
}
