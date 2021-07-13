import optimismLogoUrl from 'assets/svg/optimism_logo.svg'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { Trans } from '@lingui/macro'
import { useCallback, useState } from 'react'

const Body = styled.p`
  font-size: 12px;
  line-height: 143%;
  margin: 0;
  grid-column: 1 / 3;
`
const CloseIcon = styled(X)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`
const ContentWrapper = styled.div`
  align-items: center;
  display: grid;
  grid-gap: 4px;
  grid-template-columns: 18px 4fr;
  grid-template-rows: auto auto;
  grid-gap: 8px;
  margin: 20px 16px;
`
const Header = styled.h2`
  font-weight: 600;
  font-size: 20px;
  margin: 0;
  padding-right: 30px;
`
const L2LaunchAlertWrapper = styled.div`
  display: none;
  position: absolute;
  top: 80px;
  right: 20px;
  background: radial-gradient(948.6% 291.5% at 41.77% 0%, rgba(255, 58, 212, 0.06) 0%, rgba(255, 255, 255, 0.04) 100%),
    radial-gradient(98.16% 96.19% at 1.84% 0%, rgba(255, 39, 39, 0.3) 0%, rgba(235, 0, 255, 0.207) 95.71%);
  border-radius: 12px;
  height: 101px;
  overflow: hidden;
  width: 347px;
  z-index: -1;
  :before {
    background-image: url(${optimismLogoUrl});
    background-repeat: no-repeat;
    background-size: 300px;
    content: '';
    height: 300px;
    opacity: 0.1;
    position: absolute;
    transform: rotate(25deg) translate(-90px, -40px);
    width: 300px;
    z-index: -2;
  }
  @media screen and (min-width: ${MEDIA_WIDTHS.upToLarge}px) {
    display: block;
  }
`
const L2Icon = styled.img`
  width: 18px;
  height: 18px;
  justify-self: center;
`
const Link = styled(ExternalLink)`
  color: white;
`

export default function L2LaunchAlert() {
  const [locallyDismissed, setLocallyDimissed] = useState(false)

  const dismiss = useCallback(() => {
    setLocallyDimissed(true)
  }, [setLocallyDimissed])

  if (locallyDismissed) {
    return null
  }

  return (
    <L2LaunchAlertWrapper>
      <CloseIcon onClick={dismiss} />
      <ContentWrapper>
        <L2Icon src={optimismLogoUrl} />
        <Header>
          <Trans>Uniswap on Optimism</Trans>
        </Header>
        <Body>
          <Trans>
            Be an early tester of Uniswap on L2 and get instant transactions.{' '}
            <Link href="https://help.uniswap.org/en/articles/5391401-uniswap-on-optimistic-ethereum">
              Read more here.
            </Link>
          </Trans>
        </Body>
      </ContentWrapper>
    </L2LaunchAlertWrapper>
  )
}
