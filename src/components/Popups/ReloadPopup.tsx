import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { RowFixed } from 'components/Row'
import { useCallback, useEffect, useState } from 'react'
import { MessageCircle, X } from 'react-feather'
import ReactGA from 'react-ga'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText, Z_INDEX } from 'theme'

import BGImage from '../../assets/images/survey-orb.svg'
import useTheme from '../../hooks/useTheme'

const Wrapper = styled(AutoColumn)`
  background: #edeef2;
  position: relative;
  border-radius: 12px;
  padding: 18px;
  max-width: 360px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  color: ${({ theme }) => theme.text1};
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 100%;
  `}
`

const BGOrb = styled.img`
  position: absolute;
  right: -64px;
  top: -64px;
  width: 180px;
  z-index: ${Z_INDEX.sticky};
`

const WrappedCloseIcon = styled(X)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  stroke: #7c7c80;
  z-index: ${Z_INDEX.fixed};
  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

export default function ReloadPopup() {
  const theme = useTheme()
  const [showPopup, setShowPopup] = useState(false)
  console.log('zzmp', showPopup)

  const checkEtagMismatch = useCallback(async () => {
    const indexURL = process.env.PUBLIC_URL + '/index.html'
    const [a, b] = (await Promise.all([fetch(indexURL), fetch(indexURL + '?')])).map((response) =>
      response.headers.get('etag')
    )
    return true
    // return !(a && b && a === b)
  }, [])

  useEffect(() => {
    checkEtagMismatch().then((mismatch) => {
      if (mismatch) {
        setShowPopup(true)
        ReactGA.event({
          category: 'Stale',
          action: 'etag mismatch',
        })
      }
    })
  }, [checkEtagMismatch, setShowPopup])

  return (
    <>
      {showPopup && (
        <Wrapper gap="10px">
          <WrappedCloseIcon
            onClick={() => {
              ReactGA.event({
                category: 'Survey',
                action: 'Clicked Survey Link',
              })
            }}
          />
          <BGOrb src={BGImage} />
          <ExternalLink href="https://www.surveymonkey.com/r/YGWV9VD">
            <RowFixed>
              <MessageCircle stroke={theme.black} size="20px" strokeWidth="1px" />
              <ThemedText.White fontWeight={600} color={theme.black} ml="6px">
                <Trans>Tell us what you think ↗</Trans>
              </ThemedText.White>
            </RowFixed>
          </ExternalLink>
          <ThemedText.Black style={{ zIndex: Z_INDEX.fixed }} fontWeight={400} fontSize="12px" color={theme.black}>
            <Trans>Take a 10 minute survey to help us improve your experience in the Uniswap app.</Trans>
          </ThemedText.Black>
        </Wrapper>
      )}
    </>
  )
}
