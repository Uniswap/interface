import { AutoColumn } from 'components/Column'
import { RowFixed } from 'components/Row'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useEffect } from 'react'
import { MessageCircle, X } from 'react-feather'
import ReactGA from 'react-ga'
import { useShowSurveyPopup } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

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
  z-index: 1;
`

const WrappedCloseIcon = styled(X)`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  stroke: #7c7c80;
  z-index: 2;
  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

const END_TIMESTAMP = 1642215971 // Jan 15th

export default function SurveyPopup() {
  const theme = useTheme()
  const [showPopup, setShowSurveyPopup] = useShowSurveyPopup()

  // show popup to 1% of users
  useEffect(() => {
    // has not visited page during A/B testing if undefined
    if (showPopup === undefined) {
      const id = Math.floor(Math.random() * 101) // random between 0 -> 100
      console.log(id)
      if (id === 1) {
        // log a case of succesful view
        ReactGA.event({
          category: 'Survey',
          action: 'Saw Survey',
        })
        setShowSurveyPopup(true)
      }
    }
  }, [setShowSurveyPopup, showPopup])

  // limit survey to 24 hours based on timestamp
  const timestamp = useCurrentBlockTimestamp()
  const durationOver = timestamp ? timestamp.toNumber() < END_TIMESTAMP : false

  return (
    <>
      {!showPopup || durationOver ? null : (
        <Wrapper gap="10px">
          <WrappedCloseIcon
            onClick={() => {
              ReactGA.event({
                category: 'Survey',
                action: 'Clicked Survey Link',
              })
              setShowSurveyPopup(false)
            }}
          />
          <BGOrb src={BGImage} />
          <ExternalLink href="https://www.surveymonkey.com/r/YGWV9VD">
            <RowFixed>
              <MessageCircle stroke={theme.black} size="20px" strokeWidth="1px" />
              <ThemedText.White fontWeight={600} color={theme.black} ml="6px">
                Tell us what you think ↗
              </ThemedText.White>
            </RowFixed>
          </ExternalLink>
          <ThemedText.Black style={{ zIndex: 3 }} fontWeight={400} fontSize="12px" color={theme.black}>
            Take a 10 minute survey to help us improve your experience in the Uniswap app.
          </ThemedText.Black>
        </Wrapper>
      )}
    </>
  )
}
