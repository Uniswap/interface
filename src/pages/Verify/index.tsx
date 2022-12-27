import { Trans } from '@lingui/macro'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { CheckCircle, XCircle } from 'components/Icons'
import Loader from 'components/Loader'
import { NOTIFICATION_API } from 'constants/env'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const PageWrapper = styled.div`
  padding: 32px 50px;
  width: 100%;
  max-width: 1300px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px;
  `}
`
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     gap: 12px;
  `}
`

const Title = styled.h2`
  margin-left: 12px;
  font-size: 24px;
  font-weight: 500;
`
enum STATUS {
  VERIFYING = 'Verifying your email...',
  SUCCESS = 'You are all set!',
  ERROR = 'Error occur, please try again.',
}

function validateUrl(url: string) {
  if (!url) return ''
  const whitelistDomain = ['https://blog.kyberswap.com', 'http://blog.kyberswap.com']
  if (whitelistDomain.some(e => url.startsWith(e))) return url
  return ''
}
// this page to verify email for external site
function Verify() {
  const [status, setStatus] = useState(STATUS.VERIFYING)
  const [isExpireError, setIsExpireError] = useState(false)
  const [time, setTime] = useState(5)
  const qs = useParsedQueryString()
  const theme = useTheme()
  const refTimeoutCountDown = useRef<NodeJS.Timeout>()

  const redirectUrl = validateUrl(qs.redirectUrl as string)

  const refTime = useRef(time)
  refTime.current = time
  const handleCountDown = useCallback(() => {
    const time = refTime.current
    if (time > 0) {
      setTime(time => time - 1)
      return
    }
    refTimeoutCountDown.current && clearInterval(refTimeoutCountDown.current)
    if (redirectUrl) window.location.href = redirectUrl
  }, [redirectUrl])

  useEffect(() => {
    return () => refTimeoutCountDown.current && clearInterval(refTimeoutCountDown.current)
  }, [])

  const calledApi = useRef(false)
  useEffect(() => {
    if (!qs?.confirmation || calledApi.current) return
    calledApi.current = true
    const apiUrl = `${NOTIFICATION_API}/v1/external/verify`
    axios
      .get(apiUrl, {
        params: { confirmation: qs.confirmation },
      })
      .then(() => {
        setStatus(STATUS.SUCCESS)
        refTimeoutCountDown.current = setInterval(handleCountDown, 1000)
      })
      .catch(e => {
        const code = e?.response?.data?.code
        console.error(e)
        if (code === '4001') setIsExpireError(true)
        setStatus(STATUS.ERROR)
      })
  }, [qs?.confirmation, time, handleCountDown])

  const icon = (() => {
    switch (status) {
      case STATUS.SUCCESS:
        return <CheckCircle color={theme.primary} size={'23px'} />
      case STATUS.ERROR:
        return <XCircle color={theme.red} size={'23px'} />
      case STATUS.VERIFYING:
        return <Loader size="23px" />
    }
  })()

  const showDescription = status === STATUS.SUCCESS || isExpireError
  return (
    <PageWrapper>
      <Wrapper>
        <>
          <Flex alignItems="center">
            {icon}
            <Title>{isExpireError ? <Trans>Your verification link has expired!</Trans> : status}</Title>
          </Flex>
          {showDescription && (
            <>
              <hr style={{ width: '100%', borderTop: `1px solid ${theme.border}`, borderBottom: 'none' }} />
              <Text as="p" color={theme.subText} lineHeight="20px" fontSize="14px">
                {isExpireError ? (
                  <Trans>
                    This verification link has expired.
                    <br /> Please return to your inbox to verify with the latest verification link. <br />
                    Or <ExternalLink href={redirectUrl}>resend</ExternalLink> to have a new email sent to your
                    registered address. <br />
                    <br />
                    <ExternalLink href="https://forms.gle/gLiNsi7iUzHws2BY8">Contact Us</ExternalLink> for further
                    assistance
                  </Trans>
                ) : (
                  <Trans>
                    <Text fontWeight={'500'}>Your email have been verified.</Text> If it has been more than a few days
                    and you still haven’t receive any notification yet, please contact us through our channels.
                    <br />
                    You will be redirected to <ExternalLink href={redirectUrl}>{redirectUrl}</ExternalLink> after{' '}
                    <Text as="span" fontWeight={'500'} color={theme.text}>
                      {time}
                    </Text>
                    s.
                  </Trans>
                )}
              </Text>
              <Text as="p" color={theme.subText} fontSize="14px">
                <Trans>KyberSwap team.</Trans>
              </Text>
            </>
          )}
        </>
      </Wrapper>
    </PageWrapper>
  )
}

export default Verify
