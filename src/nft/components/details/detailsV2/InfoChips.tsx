import Column from 'components/Column'
import Row from 'components/Row'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import useENSName from 'hooks/useENSName'
import { useScreenSize } from 'hooks/useScreenSize'
import { GenieAsset } from 'nft/types'
import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp, DollarSign } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'
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
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
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

const InfoBubble = ({ title, info, icon }: { title: string; info: string; icon: ReactNode }) => {
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
  justify-content: flex-end;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const InfoChipsContainer = styled(Row)`
  gap: 4px;
  height: 64px;

  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    gap: 12px;
  }
`

export const InfoChips = ({ asset }: { asset: GenieAsset }) => {
  const screenSize = useScreenSize()
  const isMobile = !screenSize['sm']
  const [showExtraInfoChips, setShowExtraInfoChips] = useState(false)
  const shouldShowExtraInfoChips = isMobile && showExtraInfoChips

  const topTrait = asset.traits && asset.traits.length ? asset.traits[0] : undefined

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
        <InfoBubble key="Owner" title="Owner" info={addressToDisplay} icon={avatarToDisplay} />
        <InfoBubble key="Trait Floor" title="Trait Floor" info="5.3 ETH" icon={<DollarSign size={20} />} />
        {!isMobile && topTrait && <InfoBubble key="Top Trait" title="Top Trait" info={topTrait.trait_value} icon="" />}
        {topTrait && (
          <InfoChipDropdownContainer>
            <InfoChipDropdown onClick={() => setShowExtraInfoChips(!showExtraInfoChips)}>
              {showExtraInfoChips ? <ChevronUp size={20} display="block" /> : <ChevronDown size={20} display="block" />}
            </InfoChipDropdown>
          </InfoChipDropdownContainer>
        )}
      </InfoChipsContainer>
      {shouldShowExtraInfoChips && topTrait && (
        <InfoChipsContainer gap="xs" justify="center">
          <InfoBubble key="Top Trait" title="Top Trait" info={topTrait.trait_value} icon="" />
        </InfoChipsContainer>
      )}
    </Column>
  )
}
