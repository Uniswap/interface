import { Protocol } from '@uniswap/router-sdk'
import UniswapXBrandMark from 'components/Logo/UniswapXBrandMark'
import QuestionHelper from 'components/QuestionHelper'
import Column from 'components/deprecated/Column'
import Row, { RowBetween } from 'components/deprecated/Row'
import { isUniswapXSupportedChain } from 'constants/chains'
import { atom, useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { ReactNode, useCallback } from 'react'
import { RouterPreference } from 'state/routing/types'
import { ExternalLink, ThemedText } from 'theme/components'
import { Switch } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Trans, t } from 'uniswap/src/i18n'

const LabelWrapper = styled(Column)`
  height: 100%;
  justify-content: center;
`

interface RoutingPreference {
  router: RouterPreference
  protocols: Protocol[]
}

enum RoutePreferenceOption {
  Optimal = 'Optimal',
  UniswapX = 'UniswapX',
  v3 = 'v3',
  v2 = 'v2',
}

type RoutePreferenceOptionsType =
  | {
      [RoutePreferenceOption.Optimal]: false
      [RoutePreferenceOption.UniswapX]: boolean
      [RoutePreferenceOption.v3]: boolean
      [RoutePreferenceOption.v2]: boolean
    }
  | {
      [RoutePreferenceOption.Optimal]: true
      [RoutePreferenceOption.UniswapX]: false
      [RoutePreferenceOption.v3]: false
      [RoutePreferenceOption.v2]: false
    }

const DEFAULT_ROUTE_PREFERENCE_OPTIONS: RoutePreferenceOptionsType = {
  [RoutePreferenceOption.Optimal]: true,
  [RoutePreferenceOption.UniswapX]: false,
  [RoutePreferenceOption.v3]: false,
  [RoutePreferenceOption.v2]: false,
}
const DEFAULT_ROUTING_PREFERENCE: RoutingPreference = {
  router: RouterPreference.X,
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
}

export const routingPreferencesAtom = atom(DEFAULT_ROUTING_PREFERENCE)
const routePreferenceOptionsAtom = atom<RoutePreferenceOptionsType>(DEFAULT_ROUTE_PREFERENCE_OPTIONS)

function UniswapXPreferenceLabel() {
  return (
    <Row>
      <UniswapXBrandMark />
      <QuestionHelper
        text={
          <>
            <Trans i18nKey="routing.aggregateLiquidity" />{' '}
            <ExternalLink href={uniswapUrls.helpArticleUrls.uniswapXInfo}>
              <Trans i18nKey="common.button.learn" />
            </ExternalLink>
          </>
        }
        placement="right"
      />
    </Row>
  )
}

const ROUTE_PREFERENCE_TO_LABEL: Record<RoutePreferenceOption, ReactNode> = {
  [RoutePreferenceOption.Optimal]: t('common.defaultTradeOptions'),
  [RoutePreferenceOption.UniswapX]: <UniswapXPreferenceLabel />,
  [RoutePreferenceOption.v3]: t('pool.v3'),
  [RoutePreferenceOption.v2]: t('pool.v2'),
}

function RoutePreferenceToggle({
  preference,
  isActive,
  text,
  subheading,
  disabled,
  toggle,
}: {
  preference: RoutePreferenceOption
  isActive: boolean
  text?: ReactNode
  subheading?: ReactNode
  disabled?: boolean
  toggle: () => void
}) {
  return (
    <RowBetween gap="md" padding="2px 0px" align="start">
      <LabelWrapper gap="xs">
        <ThemedText.BodyPrimary>{ROUTE_PREFERENCE_TO_LABEL[preference]}</ThemedText.BodyPrimary>
        {text && <ThemedText.BodySmall color="neutral2">{text}</ThemedText.BodySmall>}
        {subheading && <ThemedText.BodySmall color="neutral2">{subheading}</ThemedText.BodySmall>}
      </LabelWrapper>
      <Switch
        testID={`route-preference-toggle-${preference}`}
        checked={isActive}
        disabled={disabled}
        variant="branded"
        onCheckedChange={toggle}
      />
    </RowBetween>
  )
}

export default function MultipleRoutingOptions({ chainId }: { chainId?: number }) {
  const [routePreferenceOptions, setRoutePreferenceOptions] = useAtom(routePreferenceOptionsAtom)
  const [, setRoutingPreferences] = useAtom(routingPreferencesAtom)
  const shouldDisableProtocolOptionToggle =
    !routePreferenceOptions[RoutePreferenceOption.v2] || !routePreferenceOptions[RoutePreferenceOption.v3]
  const uniswapXSupportedChain = chainId && isUniswapXSupportedChain(chainId)
  const handleSetRoutePreferenceOptions = useCallback(
    (options: RoutePreferenceOptionsType) => {
      if (options[RoutePreferenceOption.Optimal]) {
        setRoutePreferenceOptions(options)
        setRoutingPreferences({
          router: RouterPreference.X,
          protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
        })
        return
      }

      const routingPreferences: RoutingPreference = {
        router: options[RoutePreferenceOption.UniswapX] ? RouterPreference.X : RouterPreference.API,
        protocols: [],
      }

      if (options[RoutePreferenceOption.v2] && options[RoutePreferenceOption.v3]) {
        routingPreferences.protocols = [Protocol.V2, Protocol.V3, Protocol.MIXED]
      } else if (options[RoutePreferenceOption.v2]) {
        routingPreferences.protocols = [Protocol.V2]
      } else if (options[RoutePreferenceOption.v3]) {
        routingPreferences.protocols = [Protocol.V3]
      }

      setRoutePreferenceOptions(options)
      setRoutingPreferences(routingPreferences)
    },
    [setRoutePreferenceOptions, setRoutingPreferences],
  )

  const handleRoutePreferenceToggle = useCallback(
    (toggledPreferenceOption: RoutePreferenceOption) => {
      if (toggledPreferenceOption === RoutePreferenceOption.Optimal) {
        routePreferenceOptions[RoutePreferenceOption.Optimal]
          ? handleSetRoutePreferenceOptions({
              [RoutePreferenceOption.Optimal]: false,
              [RoutePreferenceOption.UniswapX]: true,
              [RoutePreferenceOption.v2]: true,
              [RoutePreferenceOption.v3]: true,
            })
          : handleSetRoutePreferenceOptions({
              [RoutePreferenceOption.Optimal]: true,
              [RoutePreferenceOption.UniswapX]: false,
              [RoutePreferenceOption.v2]: false,
              [RoutePreferenceOption.v3]: false,
            })
        return
      }

      handleSetRoutePreferenceOptions({
        ...routePreferenceOptions,
        [toggledPreferenceOption]: !routePreferenceOptions[toggledPreferenceOption],
      })
    },
    [handleSetRoutePreferenceOptions, routePreferenceOptions],
  )

  return (
    <Column gap="sm">
      <RoutePreferenceToggle
        preference={RoutePreferenceOption.Optimal}
        isActive={routePreferenceOptions[RoutePreferenceOption.Optimal]}
        text={<Trans i18nKey="routing.cheapest" />}
        subheading={
          routePreferenceOptions[RoutePreferenceOption.Optimal] &&
          uniswapXSupportedChain && (
            <Row gap="xs">
              <Trans i18nKey="common.includes" />
              <UniswapXBrandMark />
            </Row>
          )
        }
        toggle={() => handleRoutePreferenceToggle(RoutePreferenceOption.Optimal)}
      />
      {!routePreferenceOptions[RoutePreferenceOption.Optimal] &&
        [RoutePreferenceOption.UniswapX, RoutePreferenceOption.v3, RoutePreferenceOption.v2].map((preference) => {
          if (preference === RoutePreferenceOption.UniswapX && !uniswapXSupportedChain) {
            return null
          }

          return (
            <RoutePreferenceToggle
              key={preference}
              preference={preference}
              isActive={routePreferenceOptions[preference]}
              disabled={
                preference !== RoutePreferenceOption.UniswapX &&
                routePreferenceOptions[preference] &&
                shouldDisableProtocolOptionToggle
              }
              toggle={() => handleRoutePreferenceToggle(preference)}
            />
          )
        })}
    </Column>
  )
}
