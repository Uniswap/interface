import styled from 'styled-components/macro'
import { AutoColumn } from '../Column'

import dBanner from '../../assets/images/diffusion-banner.png'

import noise from '../../assets/images/noise.png'

export const TextBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  width: fit-content;
  justify-self: flex-end;
`

export const DataCard = styled(AutoColumn)<{ disabled?: boolean }>`
  /* background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #2172e5 100%); */
  border-radius: 8px;
  width: 100%;
  position: relative;
  overflow: hidden;
`

export const CardBGImage = styled.span<{ desaturate?: boolean }>`
  background: url(${dBanner});
  width: 1000px;
  height: 600px;
  position: absolute;
  border-radius: 8px;
  opacity: 0.4;
  top: -260px;
  left: -100px;
  transform: rotate(-15deg);
  user-select: none;
  ${({ desaturate }) => desaturate && `filter: saturate(0)`};
  backdrop-filter: blur(20px) saturate(150%);
`

export const CardNoise = styled.span`
  background: url(${noise});
  background-size: cover;
  mix-blend-mode: overlay;
  border-radius: 8px;
  width: 100%;
  height: 100%;
  opacity: 0.15;
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
`

export const CardSection = styled(AutoColumn)<{ disabled?: boolean }>`
  padding: 1rem;
  z-index: 1;
  opacity: ${({ disabled }) => disabled && '0.4'};
  backdrop-filter: blur(3px) saturate(350%) brightness(30%) grayscale(40%);
  border-radius: 8px;
`

export const Break = styled.div`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  height: 1px;
`
