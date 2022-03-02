import { Trans } from '@lingui/macro'
import FlagImage from 'assets/images/ukraine.png'
import { AutoColumn } from 'components/Column'
import { RowFixed } from 'components/Row'
import { X } from 'react-feather'
import ReactGA from 'react-ga'
import { useDarkModeManager, useShowDonationLink } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText, Z_INDEX } from 'theme'

const darkGradient = `radial-gradient(87.53% 3032.45% at 5.16% 10.13%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%),
linear-gradient(0deg, rgba(0, 91, 187, 0.35), rgba(0, 91, 187, 0.35)), #000000;`
const lightGradient = `radial-gradient(87.53% 3032.45% at 5.16% 10.13%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(0deg, #CBE4FF, #CBE4FF), linear-gradient(0deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09)), radial-gradient(100% 93.36% at 0% 6.64%, #8BC4FF 0%, #FFF5BF 100%);`

const Wrapper = styled(AutoColumn)<{ darkMode: boolean }>`
  background: #edeef2;
  position: relative;
  border-radius: 12px;
  padding: 18px;
  max-width: 360px;
  background: ${({ darkMode }) => (darkMode ? darkGradient : lightGradient)};
  color: ${({ theme }) => theme.text1};

  & > * {
    z-index: ${Z_INDEX.fixed};
  }

  overflow: hidden;
  :before {
    background-image: url(${FlagImage});
    background-repeat: no-repeat;
    overflow: hidden;
    background-size: 300px;
    content: '';
    height: 1200px;
    width: 400px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-140px, -60px);
    width: 300px;
    z-index: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 100%;
  `}
`

const WrappedCloseIcon = styled(X)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  stroke: ${({ theme }) => theme.text2};
  z-index: ${Z_INDEX.popover};
  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

export const StyledFlagImage = styled.div`
  margin-right: 12px;
  width: 18px;
  height: 18px;
  border-radius: 100%;
  &:before,
  &:after {
    content: '';
    width: 9px;
    height: 18px;
  }
  &:before {
    float: left;
    border-top-left-radius: 9px;
    border-bottom-left-radius: 9px;
    background: #005bbb;
  }
  &:after {
    float: right;
    border-top-right-radius: 9px;
    border-bottom-right-radius: 9px;
    background: #ffd500;
  }
  transform: rotate(90deg);
`

export default function DonationLink() {
  const [darkMode] = useDarkModeManager()
  const [, setVisible] = useShowDonationLink()

  return (
    <Wrapper gap="10px" darkMode={darkMode}>
      <WrappedCloseIcon
        onClick={() => {
          setVisible(false)
        }}
      />
      <ExternalLink
        href="https://donate.uniswap.org/#/swap"
        onClickCapture={() => {
          ReactGA.event({
            category: 'Donate',
            action: 'Link to Ukraine site.',
          })
        }}
      >
        <RowFixed>
          <StyledFlagImage />
          <ThemedText.Body fontWeight={600} ml="6px">
            <Trans>Donate directly to Ukraine ↗</Trans>
          </ThemedText.Body>
        </RowFixed>
      </ExternalLink>
      <ThemedText.Body fontWeight={400} fontSize="12px">
        <Trans>Donate any token directly to the Ukrainian government through a special swap app.</Trans>
      </ThemedText.Body>
    </Wrapper>
  )
}
