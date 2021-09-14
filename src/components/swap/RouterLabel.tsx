import { Trans } from '@lingui/macro'
import Badge from 'components/Badge'
import { AutoRow } from 'components/Row'
import { Version } from 'hooks/useToggledVersion'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { ReactComponent as AutoRouterIcon } from '../../assets/svg/auto_router.svg'

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 16px;
  width: 16px;
  stroke: #2172e5;
`

const VersionBadge = styled(Badge)`
  height: 24px;
  /* compensates for container padding */
  margin: -0.5rem 0;
`

const GradientText = styled(TYPE.black)<{ pulsing: boolean }>`
  line-height: 1rem;

  /* fallback color */
  color: ${({ theme }) => theme.green1};

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

export function RouterLabel({ syncing = false, version }: { syncing?: boolean; version?: Version }) {
  const routingAPIEnabled = useRoutingAPIEnabled()

  return routingAPIEnabled ? (
    <AutoRow gap="4px" width="auto">
      <StyledAutoRouterIcon />
      <GradientText fontSize={14} pulsing={syncing}>
        Auto Router
      </GradientText>
    </AutoRow>
  ) : version ? (
    <VersionBadge>
      <TYPE.black fontSize={12}>{version === Version.v2 ? <Trans>V2</Trans> : <Trans>V3</Trans>}</TYPE.black>
    </VersionBadge>
  ) : (
    <TYPE.black fontSize={14}>
      <Trans>Routes</Trans>
    </TYPE.black>
  )
}
