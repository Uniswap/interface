import styled from 'styled-components'

import Background from 'assets/images/about_background.png'
import DarkTexture from 'assets/images/dark_texture.png'
import LightTexture from 'assets/images/light_texture.png'

export const HeaderText = styled.span`
  color: ${({ theme }) => theme.text};

  font-weight: 500;
  font-size: 36px;
  line-height: 42px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-weight: 500;
    font-size: 28px;
    line-height: 33px;
  `}
`

export const TabButton = styled.span.attrs(() => ({
  role: 'button',
}))<{ active?: boolean }>`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  user-select: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
`

export const PageWrapper = styled.div<{ $hideBackground?: boolean }>`
  /* this is to make the background stretch */
  min-height: max(101vw, 101vh);
  flex: 1;

  width: 100%;
  padding: 16px 36px 72px;

  display: flex;
  flex-direction: column;
  align-items: center;

  transition: all 150ms linear;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 16px;
    padding-bottom: 72px;
  `}

  background-image: url(${Background}), url(${({ theme }) => (theme.darkMode ? DarkTexture : LightTexture)});
  background-size: contain, contain;
  background-repeat: repeat-y, no-repeat;
  z-index: 1;
  background-position: top, bottom;
`

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;

  display: flex;
  flex-direction: column;
  align-items: center;
`
