import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column, { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import pfp1 from './assets/pfp1.png'
import pfp2 from './assets/pfp2.png'
import pfp3 from './assets/pfp3.png'
import unigramDark from './assets/unigramDark.png'
import unigramLight from './assets/unigramLight.png'
import { useUniTagBanner } from './useUniTagBanner'

const Container = styled(Row)`
  width: 100%;
  max-height: 140px;
  overflow: hidden;
  padding: 16px;
  gap: 16px;
  background: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  margin-top: 12px;
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);
  @media screen and (max-width: 1440px) {
    padding-right: 2px;
    gap: 6px;
  }
  @media screen and (max-width: 310px) {
    display: none;
  }
`
const Title = styled.div<{ large?: boolean }>`
  font-weight: 500;
  font-size: ${({ large }) => (large ? '18px' : '14px')};
  line-height: ${({ large }) => (large ? '24px' : '20px')};
  ${({ theme }) => theme.neutral1};
  ${({ large }) =>
    large &&
    css`
      @media screen and (max-width: ${BREAKPOINTS.md}px) {
        font-size: 16px;
        line-height: 20px;
      }
    `}
`
const Subtitle = styled.div<{ large?: boolean }>`
  max-width: 280px;
  font-weight: 500;
  font-size: ${({ large }) => (large ? '14px' : '12px')};
  line-height: ${({ large }) => (large ? '20px' : '16px')};
  text-wrap: pretty;
  color: ${({ theme }) => theme.neutral2};
  ${({ large }) =>
    large &&
    css`
      @media screen and (max-width: ${BREAKPOINTS.md}px) {
        max-width: 250px;
        font-size: 12px;
        line-height: 16px;
      }
    `}
`
const UniTagIcon = styled.img`
  height: 20px;
  width: 20px;
  margin: 4px;
  image-rendering: optimizeQuality;
`
const ButtonStyles = css<{ large?: boolean }>`
  height: ${({ large }) => (large ? '40px' : '32px')};
  width: 100%;
  border-radius: 12px;
  font-size: ${({ large }) => (large ? '16px' : '14px')};
  line-height: ${({ large }) => (large ? '24px' : '20px')};
  ${({ large }) =>
    large &&
    css`
      @media screen and (max-width: ${BREAKPOINTS.md}px) {
        height: 32px;
        font-size: 14px;
        line-height: 20px;
      }
    `}
  text-align: center;
  padding: 8px 12px;
`
const AcceptButton = styled(ThemeButton)`
  ${ButtonStyles}
  color: ${({ theme }) => theme.white};
  background: ${({ theme }) => theme.accent1};
`
const RejectButton = styled(ThemeButton)<{ large?: boolean }>`
  ${ButtonStyles}
  color: ${({ large, theme }) => (large ? theme.neutral1 : theme.neutral2)};
  background: ${({ large, theme }) => (large ? theme.surface2 : theme.surface1)};
`
const ProfileContainer = styled(ColumnCenter)<{ large?: boolean; $offset?: number }>`
  width: unset;
  margin-top: ${({ large }) => (large ? '-16px' : 'unset')};
  margin-right: ${({ $offset }) => $offset}px;
  ${({ large, $offset }) =>
    large &&
    css`
      @media screen and (max-width: ${BREAKPOINTS.md}px) {
        margin-top: -16px;
        margin-right: ${($offset ?? 0) - 20}px;
      }
    `}
`
const ProfilePicture = styled.img<{ large?: boolean }>`
  height: ${({ large }) => (large ? '38px' : '35px')};
  width: ${({ large }) => (large ? '38px' : '35px')};
  border-radius: 50%;
  ${({ large }) =>
    large &&
    css`
      @media screen and (max-width: ${BREAKPOINTS.md}px) {
        height: 32px;
        width: 32px;
      }
    `}
`
const UserName = styled.div<{ $color: string; $rotation: number }>`
  color: ${({ $color }) => $color};
  background: ${({ theme }) => theme.surface2};
  padding: 6px;
  border-radius: 100px;
  transform: rotate(${({ $rotation }) => $rotation}deg);
  font-size: 12px;
  font-weight: 535;
  line-height: 14px;
  margin-top: -8px;
`
export function Copy({ large }: { large?: boolean }) {
  const isDarkMode = useIsDarkMode()
  return (
    <Column gap="4px">
      <Row>
        <Title large={large}>
          <Trans>Claim your Uniswap username</Trans>
        </Title>
        {large && <UniTagIcon src={isDarkMode ? unigramDark : unigramLight} alt="uniTagIcon" />}
      </Row>
      <Subtitle large={large}>
        <Trans>Sharing your address has never been easier. Claim now in the mobile app!</Trans>
      </Subtitle>
    </Column>
  )
}

export function Buttons({
  large,
  onAccept,
  onReject,
}: {
  large?: boolean
  onAccept?: () => void
  onReject?: () => void
}) {
  return (
    <Row gap={large ? '12px' : '4px'}>
      <AcceptButton
        data-testid="unitag-banner-accept-button"
        size={ButtonSize.medium}
        emphasis={ButtonEmphasis.promotional}
        large={large}
        onClick={onAccept}
      >
        <Trans>Claim now</Trans>
      </AcceptButton>
      <RejectButton
        data-testid="unitag-banner-reject-button"
        size={ButtonSize.medium}
        emphasis={ButtonEmphasis.promotional}
        large={large}
        onClick={onReject}
      >
        <Trans>No thanks</Trans>
      </RejectButton>
    </Row>
  )
}

export function Profile({
  pfp,
  name,
  color,
  rotation,
  large,
  offset,
}: {
  pfp: string
  name: string
  color: string
  rotation: number
  large?: boolean
  offset?: number
}) {
  return (
    <ProfileContainer large={large} $offset={offset}>
      <ProfilePicture src={pfp} large={large} />
      <UserName $color={color} $rotation={rotation}>
        {name}
      </UserName>
    </ProfileContainer>
  )
}

export function UniTagBanner() {
  const { shouldHideUniTagBanner, handleAccept, handleReject } = useUniTagBanner()

  if (shouldHideUniTagBanner) {
    return null
  }

  return (
    <Container justify="space-between">
      <Column gap="16px">
        <Copy />
        <Buttons onAccept={handleAccept} onReject={handleReject} />
      </Column>
      <Column gap="8px">
        <Profile pfp={pfp1} name="maggie" color="#67bcff" rotation={-2} />
        <Profile pfp={pfp2} name="hayden" color="#8CD698" rotation={3} />
        <Profile pfp={pfp3} name="unicorn" color="#E89DE5" rotation={-2} />
      </Column>
    </Container>
  )
}
