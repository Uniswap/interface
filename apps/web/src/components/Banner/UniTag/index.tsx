import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column, { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { Icons } from 'ui/src'
import pfp1 from './assets/pfp1.png'
import pfp2 from './assets/pfp2.png'
import pfp3 from './assets/pfp3.png'
import { useUniTagBanner } from './useUniTagBanner'

const Container = styled(Row)`
  width: 100%;
  height: 100%;
  max-height: 154px;
  @media screen and (max-width: 1440px) {
    max-height: 170px;
  }
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  margin-top: 12px;
  box-shadow: 0px 0px 10px 0px rgba(34, 34, 34, 0.04);
  @media screen and (max-width: 310px) {
    display: none;
  }
`
const ContentContainer = styled(Column)`
  padding: 16px;
  padding-right: 0px;
  gap: 16px;
  max-width: 290px;
  @media screen and (min-width: ${BREAKPOINTS.sm}px) and (max-width: 1440px) {
    max-width: 205px;
  }
`
const GraphicsContainer = styled.div`
  position: absolute;
  right: 0px;
  bottom: 0px;
  height: 100%;
  overflow: hidden;
  padding: 0px 8px;
`
const GraphicsInner = styled(Column)`
  gap: 8px;
  margin-top: -14px;
  @media screen and (min-width: ${BREAKPOINTS.sm}px) and (max-width: 1440px) {
    margin-top: -6px;
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
  box-shadow: 0px 0px 10.178px 0px rgba(0, 0, 0, 0.09);
`
export function Copy({ large }: { large?: boolean }) {
  return (
    <Column gap="4px">
      <Row gap="4px" align="center">
        <Title large={large}>
          <Trans>Introducing uni.eth usernames</Trans>
        </Title>
        {large && <Icons.Unitag size={18} />}
      </Row>
      <Subtitle large={large}>
        <Trans>
          Build a personalized web3 profile and easily share your address with friends. Get yours now in the Uniswap
          mobile app.
        </Trans>
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
    <Row gap={large ? '12px' : '8px'}>
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
      <ContentContainer gap="16px">
        <Copy />
        <Buttons onAccept={handleAccept} onReject={handleReject} />
      </ContentContainer>
      <GraphicsContainer>
        <GraphicsInner>
          <Profile pfp={pfp1} name="maggie" color="#67bcff" rotation={-2} />
          <Profile pfp={pfp2} name="hayden" color="#8CD698" rotation={3} />
          <Profile pfp={pfp3} name="unicorn" color="#E89DE5" rotation={-2} />
        </GraphicsInner>
      </GraphicsContainer>
    </Container>
  )
}
