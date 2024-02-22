import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column, { ColumnCenter } from 'components/Column'
import Row from 'components/Row'
import styled, { css } from 'styled-components'
import pfp1 from './assets/pfp1.png'
import pfp2 from './assets/pfp2.png'
import pfp3 from './assets/pfp3.png'

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
`
const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  ${({ theme }) => theme.neutral1};
`
const Subtitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-wrap: pretty;
  color: ${({ theme }) => theme.neutral2};
`
const ButtonStyles = css`
  height: 32px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
`
const AcceptButton = styled(ThemeButton)`
  ${ButtonStyles}
  color: ${({ theme }) => theme.white};
  background: ${({ theme }) => theme.accent1};
`
const RejectButton = styled(ThemeButton)`
  ${ButtonStyles}
  color: ${({ theme }) => theme.neutral2};
  background: ${({ theme }) => theme.surface1};
`
const ProfilePicture = styled.img`
  height: 35px;
  width: 35px;
  border-radius: 50%;
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
function Profile({ pfp, name, color, rotation }: { pfp: string; name: string; color: string; rotation: number }) {
  return (
    <ColumnCenter>
      <ProfilePicture src={pfp} />
      <UserName $color={color} $rotation={rotation}>
        {name}
      </UserName>
    </ColumnCenter>
  )
}

export function UniTagBanner() {
  return (
    <Container justify="space-between">
      <Column gap="16px">
        <Column gap="4px">
          <Title>
            <Trans>Claim your Uniswap username</Trans>
          </Title>
          <Subtitle>
            <Trans>Sharing your address has never been easier. Claim now in the mobile app!</Trans>
          </Subtitle>
        </Column>
        <Row gap="4px">
          <AcceptButton size={ButtonSize.medium} emphasis={ButtonEmphasis.promotional}>
            <Trans>Claim now</Trans>
          </AcceptButton>
          <RejectButton size={ButtonSize.medium} emphasis={ButtonEmphasis.promotional}>
            <Trans>No thanks</Trans>
          </RejectButton>
        </Row>
      </Column>
      <Column gap="2px">
        <Profile pfp={pfp1} name="maggie" color="#67bcff" rotation={-2} />
        <Profile pfp={pfp2} name="hayden" color="#8CD698" rotation={3} />
        <Profile pfp={pfp3} name="phil" color="#E89DE5" rotation={-2} />
      </Column>
    </Container>
  )
}
