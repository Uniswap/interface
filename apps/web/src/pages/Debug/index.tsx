import { BlueCard, DarkCard, DarkGrayCard, GrayCard, LightCard, OutlineCard, YellowCard } from 'components/Card'
import { AutoColumn, Column } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 870px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 800px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`

export const TwoColumnAuto = styled(Row)<{ gap?: string; justify?: string }>`
  flex-wrap: wrap;
  column-gap: 40px;
  row-gap: 15px;

  & > * {
    width: calc(50% - 20px);
  }

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
    & > * {
      width: 100%;
    }
  }
`

const Divider = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface3}`};
  width: 100%;
  margin: 20px 0;
`

const SmallBox = styled.div<{ themeColor: string }>`
  width: 30px;
  height: 30px;
  background-color: ${({ theme, themeColor }) => (theme as any)[themeColor]};
`

function DebugPage() {
  return (
    <PageWrapper gap="20px">
      <LightCard>
        <ThemedText.MediumHeader>ThemedText</ThemedText.MediumHeader>
        <Divider />
        <TwoColumnAuto>
          <ThemedText.BodyPrimary>BodyPrimary</ThemedText.BodyPrimary>
          <ThemedText.BodySecondary>BodySecondary</ThemedText.BodySecondary>
          <ThemedText.BodySmall>BodySmall</ThemedText.BodySmall>
          <ThemedText.Caption>Caption</ThemedText.Caption>
          <ThemedText.H1Large>H1Large</ThemedText.H1Large>
          <ThemedText.H1Medium>H1Medium</ThemedText.H1Medium>
          <ThemedText.H1Small>H1Small</ThemedText.H1Small>
          <ThemedText.HeadlineLarge>HeadlineLarge</ThemedText.HeadlineLarge>
          <ThemedText.HeadlineMedium>HeadlineMedium</ThemedText.HeadlineMedium>
          <ThemedText.HeadlineSmall>HeadlineSmall</ThemedText.HeadlineSmall>
          <ThemedText.Hero>Hero</ThemedText.Hero>
          <ThemedText.LabelMicro>LabelMicro</ThemedText.LabelMicro>
          <ThemedText.LabelSmall>LabelSmall</ThemedText.LabelSmall>
          <ThemedText.LargeHeader>LargeHeader</ThemedText.LargeHeader>
          <ThemedText.Link>Link</ThemedText.Link>
          <ThemedText.MediumHeader>MediumHeader</ThemedText.MediumHeader>
          <ThemedText.SubHeader>SubHeader</ThemedText.SubHeader>
          <ThemedText.SubHeaderLarge>SubHeaderLarge</ThemedText.SubHeaderLarge>
          <ThemedText.SubHeaderSmall>SubHeaderSmall</ThemedText.SubHeaderSmall>
          <ThemedText.UtilityBadge>UtilityBadge</ThemedText.UtilityBadge>
        </TwoColumnAuto>
        <Divider />
        <TwoColumnAuto>
          <ThemedText.DeprecatedBlack>DeprecatedBlack</ThemedText.DeprecatedBlack>
          <ThemedText.DeprecatedBlue>DeprecatedBlue</ThemedText.DeprecatedBlue>
          <ThemedText.DeprecatedBody>DeprecatedBody</ThemedText.DeprecatedBody>
          <ThemedText.DeprecatedDarkGray>DeprecatedDarkGray</ThemedText.DeprecatedDarkGray>
          <ThemedText.DeprecatedError error>DeprecatedError true</ThemedText.DeprecatedError>
          <ThemedText.DeprecatedError error={false}>DeprecatedError false</ThemedText.DeprecatedError>
          <ThemedText.DeprecatedGray>DeprecatedGray</ThemedText.DeprecatedGray>
          <ThemedText.DeprecatedItalic>DeprecatedItalic</ThemedText.DeprecatedItalic>
          <ThemedText.DeprecatedLabel>DeprecatedLabel</ThemedText.DeprecatedLabel>
          <ThemedText.DeprecatedLargeHeader>DeprecatedLargeHeader</ThemedText.DeprecatedLargeHeader>
          <ThemedText.DeprecatedLink>DeprecatedLink</ThemedText.DeprecatedLink>
          <ThemedText.DeprecatedMain>DeprecatedMain</ThemedText.DeprecatedMain>
          <ThemedText.DeprecatedMediumHeader>DeprecatedMediumHeader</ThemedText.DeprecatedMediumHeader>
          <ThemedText.DeprecatedSmall>DeprecatedSmall</ThemedText.DeprecatedSmall>
          <ThemedText.DeprecatedSubHeader>DeprecatedSubHeader</ThemedText.DeprecatedSubHeader>
          <ThemedText.DeprecatedWhite>DeprecatedWhite</ThemedText.DeprecatedWhite>
          <ThemedText.DeprecatedYellow>DeprecatedYellow</ThemedText.DeprecatedYellow>
        </TwoColumnAuto>
      </LightCard>
      <Divider />
      <LightCard>
        <ThemedText.MediumHeader>Colors</ThemedText.MediumHeader>
        <Divider />
        <TwoColumnAuto>
          <RowBetween>
            <SmallBox themeColor="white" />
            <ThemedText.BodyPrimary color="white">white</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="black" />
            <ThemedText.BodyPrimary color="black">black</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="brandedGradient" />
            <ThemedText.BodyPrimary color="brandedGradient">brandedGradient</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="promotional" />
            <ThemedText.BodyPrimary color="promotional">promotional</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="promotionalGradient" />
            <ThemedText.BodyPrimary color="promotionalGradient">promotionalGradient</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="background" />
            <ThemedText.BodyPrimary color="background">background</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutral1" />
            <ThemedText.BodyPrimary color="neutral1">neutral1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutral2" />
            <ThemedText.BodyPrimary color="neutral2">neutral2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutral3" />
            <ThemedText.BodyPrimary color="neutral3">neutral3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutralContrast" />
            <ThemedText.BodyPrimary color="neutralContrast">neutralContrast</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface1" />
            <ThemedText.BodyPrimary color="surface1">surface1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface2" />
            <ThemedText.BodyPrimary color="surface2">surface2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface3" />
            <ThemedText.BodyPrimary color="surface3">surface3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface4" />
            <ThemedText.BodyPrimary color="surface4">surface4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface5" />
            <ThemedText.BodyPrimary color="surface5">surface5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="accent1" />
            <ThemedText.BodyPrimary color="accent1">accent1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="accent2" />
            <ThemedText.BodyPrimary color="accent2">accent2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="accent3" />
            <ThemedText.BodyPrimary color="accent3">accent3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="token0" />
            <ThemedText.BodyPrimary color="token0">token0</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="token1" />
            <ThemedText.BodyPrimary color="token1">token1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="success" />
            <ThemedText.BodyPrimary color="success">success</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="critical" />
            <ThemedText.BodyPrimary color="critical">critical</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="critical2" />
            <ThemedText.BodyPrimary color="critical2">critical2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="scrim" />
            <ThemedText.BodyPrimary color="scrim">scrim</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="warning2" />
            <ThemedText.BodyPrimary color="warning2">warning2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text1" />
            <ThemedText.BodyPrimary color="text1">text1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text2" />
            <ThemedText.BodyPrimary color="text2">text2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text3" />
            <ThemedText.BodyPrimary color="text3">text3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text4" />
            <ThemedText.BodyPrimary color="text4">text4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text5" />
            <ThemedText.BodyPrimary color="text5">text5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg1" />
            <ThemedText.BodyPrimary color="bg1">bg1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg2" />
            <ThemedText.BodyPrimary color="bg2">bg2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg3" />
            <ThemedText.BodyPrimary color="bg3">bg3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg4" />
            <ThemedText.BodyPrimary color="bg4">bg4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg5" />
            <ThemedText.BodyPrimary color="bg5">bg5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary1" />
            <ThemedText.BodyPrimary color="primary1">primary1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary2" />
            <ThemedText.BodyPrimary color="primary2">primary2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary3" />
            <ThemedText.BodyPrimary color="primary3">primary3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary4" />
            <ThemedText.BodyPrimary color="primary4">primary4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary5" />
            <ThemedText.BodyPrimary color="primary5">primary5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primaryText1" />
            <ThemedText.BodyPrimary color="primaryText1">primaryText1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="modalBG" />
            <ThemedText.BodyPrimary color="modalBG">modalBG</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="advancedBG" />
            <ThemedText.BodyPrimary color="advancedBG">advancedBG</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red1" />
            <ThemedText.BodyPrimary color="red1">red1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red2" />
            <ThemedText.BodyPrimary color="red2">red2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red3" />
            <ThemedText.BodyPrimary color="red3">red3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red4" />
            <ThemedText.BodyPrimary color="red4">red4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="green1" />
            <ThemedText.BodyPrimary color="green1">green1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="yellow1" />
            <ThemedText.BodyPrimary color="yellow1">yellow1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="yellow2" />
            <ThemedText.BodyPrimary color="yellow2">yellow2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="blue1" />
            <ThemedText.BodyPrimary color="blue1">blue1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="secondary1" />
            <ThemedText.BodyPrimary color="secondary1">secondary1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="secondary2" />
            <ThemedText.BodyPrimary color="secondary2">secondary2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="secondary3" />
            <ThemedText.BodyPrimary color="secondary3">secondary3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_yellow1" />
            <ThemedText.BodyPrimary color="deprecated_yellow1">deprecated_yellow1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_yellow2" />
            <ThemedText.BodyPrimary color="deprecated_yellow2">deprecated_yellow2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_yellow3" />
            <ThemedText.BodyPrimary color="deprecated_yellow3">deprecated_yellow3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_blue4" />
            <ThemedText.BodyPrimary color="deprecated_blue4">deprecated_blue4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_backgroundScrolledSurface" />
            <ThemedText.BodyPrimary color="deprecated_backgroundScrolledSurface">
              deprecated_backgroundScrolledSurface
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentWarning" />
            <ThemedText.BodyPrimary color="deprecated_accentWarning">deprecated_accentWarning</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentWarningSoft" />
            <ThemedText.BodyPrimary color="deprecated_accentWarningSoft">
              deprecated_accentWarningSoft
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentFailureSoft" />
            <ThemedText.BodyPrimary color="deprecated_accentFailureSoft">
              deprecated_accentFailureSoft
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentTextLightPrimary" />
            <ThemedText.BodyPrimary color="deprecated_accentTextLightPrimary">
              deprecated_accentTextLightPrimary
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_deepShadow" />
            <ThemedText.BodyPrimary color="deprecated_deepShadow">deprecated_deepShadow</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_shallowShadow" />
            <ThemedText.BodyPrimary color="deprecated_shallowShadow">deprecated_shallowShadow</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_networkDefaultShadow" />
            <ThemedText.BodyPrimary color="deprecated_networkDefaultShadow">
              deprecated_networkDefaultShadow
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_stateOverlayHover" />
            <ThemedText.BodyPrimary color="deprecated_stateOverlayHover">
              deprecated_stateOverlayHover
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_stateOverlayPressed" />
            <ThemedText.BodyPrimary color="deprecated_stateOverlayPressed">
              deprecated_stateOverlayPressed
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_hoverState" />
            <ThemedText.BodyPrimary color="deprecated_hoverState">deprecated_hoverState</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_hoverDefault" />
            <ThemedText.BodyPrimary color="deprecated_hoverDefault">deprecated_hoverDefault</ThemedText.BodyPrimary>
          </RowBetween>
        </TwoColumnAuto>
      </LightCard>
      <Column>
        <ThemedText.MediumHeader>Colors</ThemedText.MediumHeader>
        <Divider />
        <TwoColumnAuto>
          <RowBetween>
            <SmallBox themeColor="white" />
            <ThemedText.BodyPrimary color="white">white</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="black" />
            <ThemedText.BodyPrimary color="black">black</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="brandedGradient" />
            <ThemedText.BodyPrimary color="brandedGradient">brandedGradient</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="promotional" />
            <ThemedText.BodyPrimary color="promotional">promotional</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="promotionalGradient" />
            <ThemedText.BodyPrimary color="promotionalGradient">promotionalGradient</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="background" />
            <ThemedText.BodyPrimary color="background">background</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutral1" />
            <ThemedText.BodyPrimary color="neutral1">neutral1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutral2" />
            <ThemedText.BodyPrimary color="neutral2">neutral2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutral3" />
            <ThemedText.BodyPrimary color="neutral3">neutral3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="neutralContrast" />
            <ThemedText.BodyPrimary color="neutralContrast">neutralContrast</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface1" />
            <ThemedText.BodyPrimary color="surface1">surface1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface2" />
            <ThemedText.BodyPrimary color="surface2">surface2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface3" />
            <ThemedText.BodyPrimary color="surface3">surface3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface4" />
            <ThemedText.BodyPrimary color="surface4">surface4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="surface5" />
            <ThemedText.BodyPrimary color="surface5">surface5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="accent1" />
            <ThemedText.BodyPrimary color="accent1">accent1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="accent2" />
            <ThemedText.BodyPrimary color="accent2">accent2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="accent3" />
            <ThemedText.BodyPrimary color="accent3">accent3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="token0" />
            <ThemedText.BodyPrimary color="token0">token0</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="token1" />
            <ThemedText.BodyPrimary color="token1">token1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="success" />
            <ThemedText.BodyPrimary color="success">success</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="critical" />
            <ThemedText.BodyPrimary color="critical">critical</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="critical2" />
            <ThemedText.BodyPrimary color="critical2">critical2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="scrim" />
            <ThemedText.BodyPrimary color="scrim">scrim</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="warning2" />
            <ThemedText.BodyPrimary color="warning2">warning2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text1" />
            <ThemedText.BodyPrimary color="text1">text1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text2" />
            <ThemedText.BodyPrimary color="text2">text2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text3" />
            <ThemedText.BodyPrimary color="text3">text3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text4" />
            <ThemedText.BodyPrimary color="text4">text4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="text5" />
            <ThemedText.BodyPrimary color="text5">text5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg1" />
            <ThemedText.BodyPrimary color="bg1">bg1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg2" />
            <ThemedText.BodyPrimary color="bg2">bg2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg3" />
            <ThemedText.BodyPrimary color="bg3">bg3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg4" />
            <ThemedText.BodyPrimary color="bg4">bg4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="bg5" />
            <ThemedText.BodyPrimary color="bg5">bg5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary1" />
            <ThemedText.BodyPrimary color="primary1">primary1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary2" />
            <ThemedText.BodyPrimary color="primary2">primary2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary3" />
            <ThemedText.BodyPrimary color="primary3">primary3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary4" />
            <ThemedText.BodyPrimary color="primary4">primary4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primary5" />
            <ThemedText.BodyPrimary color="primary5">primary5</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="primaryText1" />
            <ThemedText.BodyPrimary color="primaryText1">primaryText1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="modalBG" />
            <ThemedText.BodyPrimary color="modalBG">modalBG</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="advancedBG" />
            <ThemedText.BodyPrimary color="advancedBG">advancedBG</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red1" />
            <ThemedText.BodyPrimary color="red1">red1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red2" />
            <ThemedText.BodyPrimary color="red2">red2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red3" />
            <ThemedText.BodyPrimary color="red3">red3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="red4" />
            <ThemedText.BodyPrimary color="red4">red4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="green1" />
            <ThemedText.BodyPrimary color="green1">green1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="yellow1" />
            <ThemedText.BodyPrimary color="yellow1">yellow1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="yellow2" />
            <ThemedText.BodyPrimary color="yellow2">yellow2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="blue1" />
            <ThemedText.BodyPrimary color="blue1">blue1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="secondary1" />
            <ThemedText.BodyPrimary color="secondary1">secondary1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="secondary2" />
            <ThemedText.BodyPrimary color="secondary2">secondary2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="secondary3" />
            <ThemedText.BodyPrimary color="secondary3">secondary3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_yellow1" />
            <ThemedText.BodyPrimary color="deprecated_yellow1">deprecated_yellow1</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_yellow2" />
            <ThemedText.BodyPrimary color="deprecated_yellow2">deprecated_yellow2</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_yellow3" />
            <ThemedText.BodyPrimary color="deprecated_yellow3">deprecated_yellow3</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_blue4" />
            <ThemedText.BodyPrimary color="deprecated_blue4">deprecated_blue4</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_backgroundScrolledSurface" />
            <ThemedText.BodyPrimary color="deprecated_backgroundScrolledSurface">
              deprecated_backgroundScrolledSurface
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentWarning" />
            <ThemedText.BodyPrimary color="deprecated_accentWarning">deprecated_accentWarning</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentWarningSoft" />
            <ThemedText.BodyPrimary color="deprecated_accentWarningSoft">
              deprecated_accentWarningSoft
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentFailureSoft" />
            <ThemedText.BodyPrimary color="deprecated_accentFailureSoft">
              deprecated_accentFailureSoft
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_accentTextLightPrimary" />
            <ThemedText.BodyPrimary color="deprecated_accentTextLightPrimary">
              deprecated_accentTextLightPrimary
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_deepShadow" />
            <ThemedText.BodyPrimary color="deprecated_deepShadow">deprecated_deepShadow</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_shallowShadow" />
            <ThemedText.BodyPrimary color="deprecated_shallowShadow">deprecated_shallowShadow</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_networkDefaultShadow" />
            <ThemedText.BodyPrimary color="deprecated_networkDefaultShadow">
              deprecated_networkDefaultShadow
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_stateOverlayHover" />
            <ThemedText.BodyPrimary color="deprecated_stateOverlayHover">
              deprecated_stateOverlayHover
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_stateOverlayPressed" />
            <ThemedText.BodyPrimary color="deprecated_stateOverlayPressed">
              deprecated_stateOverlayPressed
            </ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_hoverState" />
            <ThemedText.BodyPrimary color="deprecated_hoverState">deprecated_hoverState</ThemedText.BodyPrimary>
          </RowBetween>

          <RowBetween>
            <SmallBox themeColor="deprecated_hoverDefault" />
            <ThemedText.BodyPrimary color="deprecated_hoverDefault">deprecated_hoverDefault</ThemedText.BodyPrimary>
          </RowBetween>
        </TwoColumnAuto>
      </Column>
      <Row>
        <DarkCard>DarkCard DarkCard DarkCard</DarkCard>
        <LightCard>LightCard LightCard LightCard</LightCard>
        <GrayCard>GrayCard GrayCard GrayCard</GrayCard>
        <DarkGrayCard>DarkGrayCard DarkGrayCard DarkGrayCard</DarkGrayCard>
      </Row>
      <Row>
        <OutlineCard>OutlineCard OutlineCard OutlineCard</OutlineCard>
        <YellowCard>YellowCard YellowCard YellowCard</YellowCard>
        <BlueCard>BlueCard BlueCard BlueCard</BlueCard>
      </Row>
      <Row>
        <Column>
          <RowBetween></RowBetween>
        </Column>
        <Column></Column>
      </Row>
      <Row>
        <WalletDebugInfo />
      </Row>
    </PageWrapper>
  )
}

const WalletDebugInfo: React.FC = () => {
  const isEthExists = !!window.ethereum
  let isMetamask = false
  let isBraveWallet = false
  let isRabby = false
  let isTrust = false
  let isLedgerConnect = false
  let ethKeys: string[] = []
  if (isEthExists) {
    isMetamask = Boolean(window.ethereum!.isMetaMask)
    isBraveWallet = Boolean(window.ethereum!.isBraveWallet)
    isRabby = Boolean(window.ethereum!.isRabby)
    isTrust = Boolean(window.ethereum!.isTrust)
    isLedgerConnect = Boolean(window.ethereum!.isLedgerConnect)
    ethKeys = Object.keys(window.ethereum!)
  }
  const ua = (navigator && navigator.userAgent) || ''
  return (
    <>
      <table>
        <tr>
          <td>window.ethereum exists</td>
          <td>{isEthExists.toString()}</td>
        </tr>
        <tr>
          <td>isMetamask</td>
          <td>{isMetamask.toString()}</td>
        </tr>
        <tr>
          <td>isBraveWallet</td>
          <td>{isBraveWallet.toString()}</td>
        </tr>
        <tr>
          <td>isRabby</td>
          <td>{isRabby.toString()}</td>
        </tr>
        <tr>
          <td>isTrust</td>
          <td>{isTrust.toString()}</td>
        </tr>
        <tr>
          <td>isLedgerConnect</td>
          <td>{isLedgerConnect.toString()}</td>
        </tr>
        <tr>
          <td>ethereum keys</td>
          <td>{ethKeys.join(', ')}</td>
        </tr>
        <tr>
          <td>user agent</td>
          <td>{ua}</td>
        </tr>
      </table>
    </>
  )
}

export default DebugPage
