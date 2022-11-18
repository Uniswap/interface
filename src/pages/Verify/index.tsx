import { Trans } from '@lingui/macro'
import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { CheckCircle, XCircle } from 'components/Icons'
import Loader from 'components/Loader'
import { NOTIFICATION_API } from 'constants/env'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { AppPaths } from 'pages/App'

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

function Verify() {
  const [status, setStatus] = useState(STATUS.VERIFYING)
  const qs = useParsedQueryString()
  const theme = useTheme()
  const refTimeoutVerify = useRef<NodeJS.Timeout>()
  const refTimeoutRedirect = useRef<NodeJS.Timeout>()
  const history = useHistory()
  const timeRedirect = 5
  useEffect(() => {
    refTimeoutVerify.current = setTimeout(() => {
      if (!qs?.confirmation) return
      axios
        .get(`${NOTIFICATION_API}/v1/topics/verify`, {
          params: { confirmation: qs.confirmation },
        })
        .then(() => {
          setStatus(STATUS.SUCCESS)
          refTimeoutRedirect.current = setTimeout(() => {
            history.push(AppPaths.SWAP)
          }, timeRedirect * 1000)
          if (qs.email) {
            // temp off, will release soon
            //   axios.post(`${KS_SETTING_API}/v1/sendgrid/add-contact`, { email: qs.email }).catch(console.error)
          }
        })
        .catch(e => {
          console.error(e)
          setStatus(STATUS.ERROR)
        })
    }, 500)
    return () => {
      refTimeoutVerify.current && clearTimeout(refTimeoutVerify.current)
      refTimeoutRedirect.current && clearTimeout(refTimeoutRedirect.current)
    }
  }, [qs?.confirmation, qs?.email, history])

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
  return (
    <PageWrapper>
      <Wrapper>
        <>
          <Flex alignItems="center">
            {icon}
            <Title>
              <Trans>{status}</Trans>
            </Title>
          </Flex>
          {status === STATUS.SUCCESS && (
            <>
              <hr style={{ width: '100%', borderTop: `1px solid ${theme.border}`, borderBottom: 'none' }} />
              <Text as="p" color={theme.subText} lineHeight="20px" fontSize="14px">
                <Trans>
                  <Text fontWeight={'500'}>Your email have been verified by KyberSwap.com.</Text> If it has been more
                  than a few days and you still haven’t receive any notification yet, please contact us through our
                  channels. You will be redirected to our Swap page after {timeRedirect}s.
                </Trans>
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
