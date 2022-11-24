import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

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

const StyledUL = styled.ul`
  flex-shrink: 0;

  display: flex;
  flex-direction: column;
  margin: 0;
  padding-left: 24px;
  padding-right: 8px;
  width: 100%;
  row-gap: 8px;

  margin-block-start: 0;
  margin-block-end: 0;

  margin-inline-start: 0;
  margin-inline-end: 0;

  list-style-type: disc;
  list-style-position: outside;

  color: ${({ theme }) => theme.subText};

  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
`

const Highlighted = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const ContentForActiveFarms = () => {
  const theme = useTheme()
  return (
    <StyledUL style={{ marginTop: '8px' }}>
      <li>
        <Trans>
          We recently discovered an issue in our Elastic farming contract where you might not be able to harvest your
          rewards or withdraw your liquidity positions like you <Highlighted>normally</Highlighted> would.
        </Trans>
      </li>
      <li>
        <Trans>
          Don&apos;t worry, your funds are <Highlighted>100% safe</Highlighted>. And you are still earning farming
          rewards.
        </Trans>
      </li>
      <li>
        <Trans>
          If you still wish to withdraw your liquidity positions from the farm, you can use the{' '}
          <Highlighted style={{ color: theme.red }}>Force Withdraw</Highlighted> button as an emergency option. Note:
        </Trans>
        <StyledUL style={{ marginTop: '8px', listStyleType: 'circle' }}>
          <li>
            <Trans>
              If you do this, your farming rewards will <Highlighted>not</Highlighted> be automatically harvested but we
              can <Highlighted>manually transfer</Highlighted> your farming rewards to you.
            </Trans>
          </li>
          <li>
            <Trans>
              After force withdrawing your liquidity position from the farm, remember <Highlighted>not</Highlighted> to
              re-stake this in the farm.
            </Trans>
          </li>
          <li>
            <Trans>
              If you wish to continue participating in the farm, you should remove liquidity from the{' '}
              <Highlighted>pool</Highlighted>, create a <Highlighted>new</Highlighted> liquidity position by adding
              liquidity into the pool, and then stake this new liquidity position into the farm.
            </Trans>
          </li>
        </StyledUL>
      </li>
      <li>
        <Trans>
          You can get in touch with us by joining our{' '}
          <ExternalLink href="https://discord.gg/H8AQVhwBz9">Discord channel ↗</ExternalLink> and we will assist you
          with your questions or transfer of rewards.
        </Trans>
      </li>
    </StyledUL>
  )
}

const ContentForEndedFarms = () => {
  const theme = useTheme()
  return (
    <StyledUL style={{ marginTop: '8px' }}>
      <li>
        <Trans>
          We recently discovered an issue in our Elastic farming contract where you might not be able to harvest your
          rewards or withdraw your liquidity positions like you <Highlighted>normally</Highlighted> would.
        </Trans>
      </li>
      <li>
        <Trans>
          Don&apos;t worry, your funds are <Highlighted>100% safe</Highlighted>.
        </Trans>
      </li>
      <li>
        <Trans>
          You can use the <Highlighted style={{ color: theme.red }}>Force Withdraw</Highlighted> button as an emergency
          option. If you do this, your farming rewards will <Highlighted>not</Highlighted> be automatically harvested
          but we can <Highlighted>manually transfer</Highlighted> your farming rewards to you.
        </Trans>
      </li>
      <li>
        <Trans>
          You can get in touch with us by joining our{' '}
          <ExternalLink href="https://discord.gg/H8AQVhwBz9">Discord channel ↗</ExternalLink> and we will assist you
          with your questions or transfer of rewards.
        </Trans>
      </li>
    </StyledUL>
  )
}

type Props = {
  isEnded: boolean
}
const FarmIssueAnnouncement: React.FC<Props> = ({ isEnded }) => {
  const theme = useTheme()
  const [show, setShow] = useState(true)

  return (
    <Wrapper>
      <Flex
        justifyContent="space-between"
        onClick={() => setShow(prev => !prev)}
        sx={{
          cursor: 'pointer',
        }}
      >
        <Flex alignItems="center">
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M4.83333 16.6667H8.16667C8.16667 17.5833 7.41667 18.3333 6.5 18.3333C5.58333 18.3333 4.83333 17.5833 4.83333 16.6667ZM3.16667 15C3.16667 15.4583 3.54167 15.8333 4 15.8333H9C9.45833 15.8333 9.83333 15.4583 9.83333 15C9.83333 14.5417 9.45833 14.1667 9 14.1667H4C3.54167 14.1667 3.16667 14.5417 3.16667 15ZM12.75 7.91667C12.75 11.1 10.5333 12.8 9.60833 13.3333H3.39167C2.46667 12.8 0.25 11.1 0.25 7.91667C0.25 4.46667 3.05 1.66667 6.5 1.66667C9.95 1.66667 12.75 4.46667 12.75 7.91667ZM16.8083 6.14167L15.6667 6.66667L16.8083 7.19167L17.3333 8.33333L17.8583 7.19167L19 6.66667L17.8583 6.14167L17.3333 5L16.8083 6.14167ZM14.8333 5L15.6167 3.28333L17.3333 2.5L15.6167 1.71667L14.8333 0L14.05 1.71667L12.3333 2.5L14.05 3.28333L14.8333 5Z"
              fill="#FF9901"
            />
          </svg>
          <Text fontWeight="500" color={theme.warning} marginLeft="8px">
            <Trans>Important Announcement</Trans>
          </Text>
        </Flex>

        <Flex
          sx={{
            flex: '0 0 24px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <DropdownIcon data-flip={show} />
        </Flex>
      </Flex>

      {show && (
        <>
          {isEnded ? <ContentForEndedFarms /> : <ContentForActiveFarms />}

          <Text fontStyle="italic" marginTop="16px">
            <Trans>We really apologize for the trouble.</Trans>
          </Text>
        </>
      )}
    </Wrapper>
  )
}

export default FarmIssueAnnouncement
