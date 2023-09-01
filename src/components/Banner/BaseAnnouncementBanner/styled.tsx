import walletBannerPhoneImageSrc from 'assets/images/wallet_banner_phone_image.png'
import { BaseButton } from 'components/Button'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { X } from 'react-feather'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

export const PopupContainer = styled.div<{ show: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  ${({ show }) => !show && 'display: none'};

  background: url(${walletBannerPhoneImageSrc});
  background-repeat: no-repeat;
  background-position: top 18px right 15px;
  background-size: 166px;

  :hover {
    background-size: 170px;
  }
  transition: background-size ${({ theme }) => theme.transition.duration.medium}
    ${({ theme }) => theme.transition.timing.inOut};

  background-color: ${({ theme }) => theme.chain_84531};
  color: ${({ theme }) => theme.neutral1};
  position: fixed;
  z-index: ${Z_INDEX.sticky};

  padding: 24px 16px 16px;

  border-radius: 20px;
  bottom: 20px;
  right: 20px;
  width: 390px;
  height: 164px;

  border: 1px solid ${({ theme }) => theme.surface3};

  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    bottom: 62px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    background-position: top 32px right -10px;
    width: unset;
    right: 10px;
    left: 10px;
    height: 144px;
  }

  user-select: none;
`

export const BaseBackgroundImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  height: 138px;
  width: 138px;
`
export const ButtonRow = styled(Row)`
  gap: 16px;
`
export const StyledXButton = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 21px;
  right: 17px;

  color: ${({ theme }) => theme.white};
  ${OpacityHoverState};
`

export const BannerButton = styled(BaseButton)`
  height: 40px;
  border-radius: 16px;
  padding: 10px;
  ${OpacityHoverState};
`
