import Row from "components/Row";
import { Trans, t } from "i18n";
import { useMemo } from "react";
import { ArrowRightCircle } from "react-feather";
import styled from "styled-components";
import { ClickableStyle, ExternalLink } from "theme/components";
import { NumberType, useFormatter } from "utils/formatNumbers";

import { Body1, Box, H2 } from "../components/Generics";
import { StatCard } from "../components/StatCard";
import { useInView } from "./useInView";
import { useProtocolVolume } from "hooks/useProtocolVolume";
import { useActiveIncentives } from "hooks/useActiveIncentives";

const Container = styled.div`
  width: 100%;
  max-width: 1360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40px;

  @media (max-width: 960px) {
    max-height: 360px;
  }

  @media (max-width: 768px) {
    max-height: none;
    padding: 0 48px;
  }
  @media (max-width: 468px) {
    padding: 0 24px;
  }
`;
const SectionLayout = styled(Box)`
  width: 100%;
  max-width: 1280px;
`;
const HideWhenLarge = styled(Box)`
  @media (min-width: 768px) {
    display: none;
  }
`;
const HideWhenSmall = styled(Box)`
  @media (max-width: 768px) {
    display: none;
  }
`;
const LeftTop = styled.div`
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 3;
`;
const RightTop = styled.div`
  grid-column-start: 3;
  grid-column-end: 5;
  grid-row-start: 1;
  grid-row-end: 3;
`;
const LeftBottom = styled.div`
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 3;
  grid-row-end: 5;
`;
const RightBottom = styled.div`
  grid-column-start: 3;
  grid-column-end: 5;
  grid-row-start: 3;
  grid-row-end: 5;
`;
const CardLayout = styled.div`
  width: 100%;
  height: 100%;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  grid-column-gap: 16px;
  grid-row-gap: 16px;

  overflow: hidden;

  @media (max-width: 768px) {
    height: 320px;
    grid-column-gap: 12px;
    grid-row-gap: 12px;
  }

  @media (max-width: 468px) {
    grid-column-gap: 8px;
    grid-row-gap: 8px;
  }
`;
const Layout = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 234px);
  @media (max-width: 960px) {
    grid-template-rows: repeat(2, 160px);
  }
  @media (max-width: 768px) {
    grid-template-rows: repeat(2, 200px);
  }
  grid-column-gap: 24px;
  grid-row-gap: 16px;
`;
const Left = styled.div`
  grid-column-start: 1;
  grid-column-end: 2;
  grid-row-start: 1;
  grid-row-end: 3;
  height: 100%;
`;
const Right = styled.div`
  grid-column-start: 2;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 3;
  height: 100%;
`;
const LearnMoreButton = styled(ExternalLink)`
  padding: 12px 16px;
  border-radius: 24px;
  border: 0;
  background-color: ${({ theme }) => theme.surface2};
  font-family: Basel;
  font-size: 20px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px;
  color: ${({ theme }) => theme.neutral1};
  ${ClickableStyle}
`;
const LearnMoreArrow = styled(ArrowRightCircle)`
  size: 24px;
  stroke: ${({ theme }) => theme.surface2};
  fill: ${({ theme }) => theme.neutral1};
`;
const ProtocolDescription = () => (
  <Trans i18nKey="landing.protocolDescription" />
);
function LearnMore() {
  return (
    <LearnMoreButton href={`${process.env.REACT_APP_INFO_ROOT}/#`}>
      <Row gap="sm" align="center">
        <Trans i18nKey="common.learnMore.link" />
        <LearnMoreArrow />
      </Row>
    </LearnMoreButton>
  );
}
export function Stats() {
  const { ref, inView } = useInView();

  return (
    <Container>
      <SectionLayout ref={ref}>
        <HideWhenSmall>
          <Layout>
            <Left>
              <Box
                direction="column"
                justify-content="space-between"
                height="100%"
              >
                <H2>
                  <Trans i18nKey="landing.trusted" />
                </H2>
                <Box
                  bottom="0"
                  position="absolute"
                  direction="column"
                  maxWidth="480px"
                  gap="24px"
                >
                  <Body1>
                    <ProtocolDescription />
                  </Body1>
                  <LearnMore />
                </Box>
              </Box>
            </Left>
            <Right>
              <Cards inView={inView} />
            </Right>
          </Layout>
        </HideWhenSmall>
        <HideWhenLarge maxWidth="1280px" direction="column" gap="32px">
          <H2>
            <Trans i18nKey="landing.trusted" />
          </H2>
          {/* <Cards inView={inView} /> */}
          <Body1>
            <ProtocolDescription />
          </Body1>
          <LearnMore />
        </HideWhenLarge>
      </SectionLayout>
    </Container>
  );
}

function Cards({ inView }: { inView: boolean }) {
  const { formatNumber } = useFormatter();
  const { dailyVolume, lifetimeVolume, lifetimeFees } = useProtocolVolume();
  const { count } = useActiveIncentives();
  return (
    <CardLayout>
      <LeftTop>
        <StatCard
          title={t("stats.allTimeVolume")}
          value={formatNumber({
            input: lifetimeVolume,
            type: NumberType.FiatTokenStats,
          })}
          delay={0}
          inView={inView}
        />
      </LeftTop>
      <RightTop>
        <StatCard
          title={t("stats.activeIncentives")}
          value={formatNumber({
            input: count,
            type: NumberType.WholeNumber,
          })}
          delay={0.2}
          inView={inView}
        />
      </RightTop>
      <LeftBottom>
        <StatCard
          title={t("stats.allTimeFees")}
          value={formatNumber({
            input: lifetimeFees,
            type: NumberType.FiatTokenStats,
          })}
          delay={0.4}
          inView={inView}
        />
      </LeftBottom>
      <RightBottom>
        <StatCard
          title={t("stats.24volume")}
          value={formatNumber({
            input: dailyVolume,
            type: NumberType.FiatTokenStats,
          })}
          live
          delay={0.6}
          inView={inView}
        />
      </RightBottom>
    </CardLayout>
  );
}
