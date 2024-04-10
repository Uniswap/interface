import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { MissingDataIcon } from 'components/Table/icons'
import { lighten } from 'polished'
import { PropsWithChildren, ReactNode } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { opacify } from 'theme/utils'
import { ChartType } from './utils'

const ChartErrorContainer = styled(Row)`
  position: absolute;
  width: max-content;
  align-items: flex-start;
  max-width: 320px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 20px;
  border: 1.3px solid ${({ theme }) => theme.surface3};
  background-color: ${({ theme }) => theme.surface1};
  padding: 12px 20px 12px 12px;
  gap: 12px;
  ${textFadeIn};
`
const ErrorTextColumn = styled(Column)`
  white-space: normal;
`

function ChartErrorView({ children }: PropsWithChildren) {
  return (
    <ChartErrorContainer data-cy="chart-error-view">
      <div>
        <MissingDataIcon />
      </div>
      <ErrorTextColumn gap="xs">
        <ThemedText.SubHeader color="neutral1">
          <Trans>Missing chart data</Trans>
        </ThemedText.SubHeader>
        <ThemedText.BodySmall color="neutral2">{children}</ThemedText.BodySmall>
      </ErrorTextColumn>
    </ChartErrorContainer>
  )
}

function ChartSkeletonAxes({
  height,
  fillColor,
  tickColor,
  hideYAxis,
}: {
  height: number
  fillColor: string
  tickColor: string
  hideYAxis?: boolean
}) {
  return (
    <g>
      <rect width="180" height="32" rx="4" y="0" fill={fillColor} />
      <rect width="80" height="13" rx="4" y="48" fill={fillColor} />
      <g transform={`translate(0, ${height - 14})`}>
        <rect width="7%" height="6" rx="3" x="10%" fill={tickColor} />
        <rect width="7%" height="6" rx="3" x="28.25%" fill={tickColor} />
        <rect width="7%" height="6" rx="3" x="46.5%" fill={tickColor} />
        <rect width="7%" height="6" rx="3" x="64.75%" fill={tickColor} />
        <rect width="7%" height="6" rx="3" x="83%" fill={tickColor} />
      </g>
      {!hideYAxis && (
        <g transform="translate(0, 10)">
          <rect width="24" height="6" rx="3" y={(0 * height) / 5} x="96%" fill={tickColor} />
          <rect width="24" height="6" rx="3" y={(1 * height) / 5} x="96%" fill={tickColor} />
          <rect width="24" height="6" rx="3" y={(2 * height) / 5} x="96%" fill={tickColor} />
          <rect width="24" height="6" rx="3" y={(3 * height) / 5} x="96%" fill={tickColor} />
          <rect width="24" height="6" rx="3" y={(4 * height) / 5} x="96%" fill={tickColor} />
        </g>
      )}
    </g>
  )
}

function ChartLoadingStateMask({ type, height, id }: { type: ChartType; height: number; id: string }) {
  const theme = useTheme()

  switch (type) {
    case ChartType.TVL:
    case ChartType.PRICE:
      return (
        <>
          <defs>
            <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0" stopColor={theme.neutral3}>
                <animate attributeName="offset" values="-1;3" dur="1.3s" repeatCount="indefinite" />
              </stop>
              <stop offset="0.5" stopColor={lighten(0.24, theme.neutral3)}>
                <animate attributeName="offset" values="-0.5;3.5" dur="1.3s" repeatCount="indefinite" />
              </stop>
              <stop offset="1" stopColor={theme.neutral3}>
                <animate attributeName="offset" values="0;4" dur="1.3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <mask id={id} style={{ maskType: 'alpha' }}>
            <path
              transform="translate(5, 75)"
              d="M0 122.5L7.26 116.158L14.52 109.916L21.78 103.873L29.04 98.1233L36.3 92.7582L43.56 87.862L50.82 83.5121L58.08 79.7771L65.34 76.7159L72.6 74.3767L79.86 72.7964L87.12 72H94.38L101.64 72.7964L108.9 74.3767L116.16 76.7159L123.42 79.7771L130.68 83.5121L137.94 87.862L145.2 92.7582L152.46 98.1233L159.72 103.873L166.98 109.916L174.24 116.158L181.5 122.5L188.76 128.842L196.02 135.084L203.28 141.127L210.54 146.877L217.8 152.242L225.06 157.138L232.32 161.488L239.58 165.223L246.84 168.284L254.1 170.623L261.36 172.204L268.62 173H275.88L283.14 172.204L290.4 170.623L297.66 168.284L304.92 165.223L312.18 161.488L319.44 157.138L326.7 152.242L333.96 146.877L341.22 141.127L348.48 135.084L355.74 128.842L363 122.5L370.26 116.158L377.52 109.916L384.78 103.873L392.04 98.1233L399.3 92.7582L406.56 87.862L413.82 83.5121L421.08 79.7771L428.34 76.7159L435.6 74.3767L442.86 72.7964L450.12 72L457.38 72L464.64 72.7964L471.9 74.3767L479.16 76.7159L486.42 79.7771L493.68 83.5121L500.94 87.862L508.2 92.7582L515.46 98.1233L522.72 103.873L529.98 109.916L537.24 116.158L544.5 122.5L551.76 128.842L559.02 135.084L566.28 141.127L573.54 146.877L580.8 152.242L588.06 157.138L595.32 161.488L602.58 165.223L609.84 168.284L617.1 170.623L624.36 172.204L631.62 173H638.88L646.14 172.204L653.4 170.623L660.66 168.284L667.92 165.223L675.18 161.488L682.44 157.138L689.7 152.242L696.96 146.877L704.22 141.127L711.48 135.084L718.74 128.842L726 122.5"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </mask>
        </>
      )
    case ChartType.VOLUME:
      return (
        <>
          <defs>
            <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0" stopColor={theme.neutral3}>
                <animate attributeName="offset" values="-0.2;3.3" dur="1.3s" repeatCount="indefinite" />
              </stop>
              <stop offset="0.1" stopColor={lighten(0.05, theme.neutral3)}>
                <animate attributeName="offset" values="-0.1;3.4" dur="1.3s" repeatCount="indefinite" />
              </stop>
              <stop offset="0.2" stopColor={theme.neutral3}>
                <animate attributeName="offset" values="0;3.5" dur="1.3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <mask id={id} style={{ maskType: 'alpha' }}>
            <g transform={`translate(0, ${height - 30}) scale(1,-1)`}>
              <rect rx="3" width="9%" height="15%" x="0.0%" fill="white" />
              <rect rx="3" width="9%" height="30%" x="9.2%" fill="white" />
              <rect rx="3" width="9%" height="45%" x="18.4%" fill="white" />
              <rect rx="3" width="9%" height="60%" x="27.6%" fill="white" />
              <rect rx="3" width="9%" height="45%" x="36.8%" fill="white" />
              <rect rx="3" width="9%" height="30%" x="46.0%" fill="white" />
              <rect rx="3" width="9%" height="15%" x="55.2%" fill="white" />
              <rect rx="3" width="9%" height="30%" x="64.4%" fill="white" />
              <rect rx="3" width="9%" height="45%" x="73.6%" fill="white" />
              <rect rx="3" width="9%" height="60%" x="82.8%" fill="white" />
            </g>
          </mask>
        </>
      )
    default:
      return null
  }
}

export function ChartSkeleton({
  errorText,
  height,
  type,
  dim,
  hideYAxis,
}: {
  height: number
  errorText?: ReactNode
  type: ChartType
  dim?: boolean
  hideYAxis?: boolean
}) {
  const theme = useTheme()
  const neutral3Opacified = opacify(25, theme.neutral3)

  const fillColor = errorText || dim ? neutral3Opacified : theme.neutral3
  const tickColor = errorText ? opacify(12.5, theme.neutral3) : neutral3Opacified

  const maskId = `mask-${type}-${height}`

  return (
    <Row style={{ position: 'relative' }}>
      <svg width="100%" height={height} xmlns="http://www.w3.org/2000/svg" fill="none">
        <ChartSkeletonAxes height={height} fillColor={fillColor} tickColor={tickColor} hideYAxis={hideYAxis} />
        <ChartLoadingStateMask id={maskId} type={type} height={height} />
        <g mask={`url(#${maskId})`}>
          <rect width="94%" height={height} rx="4" fill={errorText ? fillColor : `url(#${maskId}-gradient)`} />
        </g>
      </svg>
      {errorText && <ChartErrorView>{errorText}</ChartErrorView>}
    </Row>
  )
}
