import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import useTheme from 'hooks/useTheme'
import { ButtonText, ExternalLink } from 'theme'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 16px;
  font-size: 14px;
  border: 1px solid ${({ theme }) => theme.warning};
  margin-bottom: 16px;
  color: ${({ theme }) => theme.subText};

  li {
    line-height: 20px;
  }
`

function FarmIssueAnnouncement() {
  const theme = useTheme()
  const [show, setShow] = useState(true)
  return (
    <Wrapper>
      <Flex justifyContent="space-between">
        <Flex alignItems="center">
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.83333 16.6667H8.16667C8.16667 17.5833 7.41667 18.3333 6.5 18.3333C5.58333 18.3333 4.83333 17.5833 4.83333 16.6667ZM3.16667 15C3.16667 15.4583 3.54167 15.8333 4 15.8333H9C9.45833 15.8333 9.83333 15.4583 9.83333 15C9.83333 14.5417 9.45833 14.1667 9 14.1667H4C3.54167 14.1667 3.16667 14.5417 3.16667 15ZM12.75 7.91667C12.75 11.1 10.5333 12.8 9.60833 13.3333H3.39167C2.46667 12.8 0.25 11.1 0.25 7.91667C0.25 4.46667 3.05 1.66667 6.5 1.66667C9.95 1.66667 12.75 4.46667 12.75 7.91667ZM16.8083 6.14167L15.6667 6.66667L16.8083 7.19167L17.3333 8.33333L17.8583 7.19167L19 6.66667L17.8583 6.14167L17.3333 5L16.8083 6.14167ZM14.8333 5L15.6167 3.28333L17.3333 2.5L15.6167 1.71667L14.8333 0L14.05 1.71667L12.3333 2.5L14.05 3.28333L14.8333 5Z"
              fill="#FF9901"
            />
          </svg>
          <Text fontWeight="500" color={theme.warning} marginLeft="8px">
            Important Announcement
          </Text>
        </Flex>

        <ButtonText onClick={() => setShow(prev => !prev)} style={{ color: theme.subText }}>
          <DropdownSVG style={{ transform: `rotate(${!show ? 0 : '180deg'})` }} />
        </ButtonText>
      </Flex>

      {show && (
        <>
          <Flex flexDirection="column" sx={{ gap: '10px' }} fontSize="14px" marginTop="12px">
            <li>
              We recently discovered an issue in our Elastic farming contract where you might not be able to harvest
              your rewards or withdraw your liquidity positions like you{' '}
              <Text as="span" fontWeight="500" color={theme.text}>
                normally
              </Text>{' '}
              would
            </li>
            <li>
              Dont worry, your funds are{' '}
              <Text as="span" fontWeight="500" color={theme.text}>
                100% safe
              </Text>
              . And you are still earning farming rewards{' '}
            </li>
            <li>
              If you still wish to withdraw your liquidity positions, you can use the{' '}
              <Text fontWeight="500" color={theme.red} as="span">
                Force Withdraw
              </Text>{' '}
              button as an emergency option. (Note: If you do this, your farming rewards will{' '}
              <Text as="span" fontWeight="500" color={theme.text}>
                not
              </Text>{' '}
              be automatically harvested but we can{' '}
              <Text as="span" fontWeight="500" color={theme.text}>
                manually transfer
              </Text>{' '}
              your farming rewards to you)
            </li>
            <li>
              You can get in touch with us by joining our{' '}
              <ExternalLink href="https://discord.gg/H8AQVhwBz9">Discord channel ↗</ExternalLink> and we will assist you
              with your questions or transfer of rewards.
            </li>
            <li>
              We will soon deploy a{' '}
              <Text as="span" fontWeight="500" color={theme.text}>
                new
              </Text>{' '}
              Elastic farming contract, and you will be able to migrate your liquidity positions into this contract to
              continue earning rewards
            </li>
          </Flex>

          <Text fontStyle="italic" marginTop="16px">
            We really apologize for the trouble.
          </Text>
        </>
      )}
    </Wrapper>
  )
}

export default FarmIssueAnnouncement
