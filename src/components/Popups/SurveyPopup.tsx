import { Trans } from '@lingui/macro'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import { RowFixed } from 'components/Row'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useEffect } from 'react'
import { MessageCircle, X } from 'react-feather'
import { useShowSurveyPopup } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

import BGImage from '../../assets/images/survey-orb.svg'

const Wrapper = styled(AutoColumn)`
  background: #edeef2;
  position: relative;
  border-radius: 12px;
  padding: 18px;
  max-width: 360px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  color: ${({ theme }) => theme.deprecated_text1};
  overflow: hidden;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
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

const END_TIMESTAMP = 1642272346 // Jan 15th

export default function SurveyPopup() {
  const theme = useTheme()
  const [showPopup, setShowSurveyPopup] = useShowSurveyPopup()

  // show popup to 1% of users
  useEffect(() => {
    // has not visited page during A/B testing if undefined
    if (showPopup === undefined) {
      if (Math.random() < 0.01) {
        setShowSurveyPopup(true)
        // log a case of succesful view
        sendEvent({
          category: 'Survey',
          action: 'Saw Survey',
        })
      }
    }
  }, [setShowSurveyPopup, showPopup])

  // limit survey to 24 hours based on timestamps
  const timestamp = useCurrentBlockTimestamp()
  const durationOver = timestamp ? timestamp.toNumber() > END_TIMESTAMP : false

  return (
    <>
      {!showPopup || durationOver ? null : (
        <Wrapper gap="10px">
          <WrappedCloseIcon
            onClick={() => {
              sendEvent({
                category: 'Survey',
                action: 'Clicked Survey Link',
              })
              setShowSurveyPopup(false)
            }}
          />
          <BGOrb src={BGImage} />
          <ExternalLink href="https://www.surveymonkey.com/r/YGWV9VD">
            <RowFixed>
              <MessageCircle stroke={theme.deprecated_black} size="20px" strokeWidth="1px" />
              <ThemedText.DeprecatedWhite fontWeight={600} color={theme.deprecated_black} ml="6px">
                <Trans>Tell us what you think ↗</Trans>
              </ThemedText.DeprecatedWhite>
            </RowFixed>
          </ExternalLink>
          <ThemedText.DeprecatedBlack
            style={{ zIndex: Z_INDEX.fixed }}
            fontWeight={400}
            fontSize="12px"
            color={theme.deprecated_black}
          >
            <Trans>Take a 10 minute survey to help us improve your experience in the Uniswap app.</Trans>
          </ThemedText.DeprecatedBlack>
        </Wrapper>
      )}
    </>
  )
}
