import { RowBetween, RowFixed } from "components/Row";

import Badge from "components/Badge";
import QuestionHelper from "components/QuestionHelper";
import React from 'react'
import { TYPE } from "theme";
import Toggle from "components/Toggle";
import _ from 'lodash'
import { abbreviateNumber } from "components/BurntKiba";
import { isMobile } from "react-device-detect";
import styled from "styled-components/macro";
import useTheme from "hooks/useTheme";

const VolumeContainer = styled.div`
display: flex;
align-items: center;
justfy-content: stretch;
gap: 20px;
`;
const StyledDiv = styled.div`
  font-family: "Open Sans";
  font-size: 14px;
  display: flex;
  gap: 20px;
  align-items: ${isMobile ? "stretch" : "center"};
  padding: 3px 8px;
  flex-flow: ${() => (isMobile ? "column wrap" : "row wrap")};
`;
const VolumePanelWrapper = styled.div`
display: flex;
align-items: start;
flex-flow: column wrap;
justify-content: start;
gap: 15px;
border-left: ${() => (isMobile ? 0 : 1)}px solid #444;
padding-left: ${() => (isMobile ? 0 : 25)}px;
`;

const StatsWrapper = styled.div`
display: flex;
background: ${props=>props.theme.chartSidebar};
color:${props => props.theme.text1};
box-shadow: 0px 0px 1px 0px;
padding: 9px 14px;
flex-flow: row wrap;
gap: 10px;
align-items: center;
margin-bottom: 10px;
border-radius: 14px;
`;

export const TokenStats = ({ tokenData }: { tokenData?: any }) => {
const getLabel = (key: string, label = "txns") => {
  switch (key) {
    case "h24":
      return "24 Hour " + label;
    case "h6":
      return "6 Hour " + label;
    case "h1":
      return "1 Hour " + label;
    case "m5":
      return "5 Min " + label;
    default:
      return key;
  }
};
const [showStats, setShowStats] = React.useState(false);
const toggleStats = () => setShowStats(!showStats);
const hasStats = Boolean(tokenData && Object.keys(tokenData)?.length > 0);
const theme=useTheme()
const ToggleElm = hasStats ? (
  <TYPE.small style={{ marginBottom: 5, marginTop: 5 }}>
    <RowBetween>
      <RowFixed>
        <TYPE.black fontWeight={400} fontSize={14} color={theme.text1}>
          Toggle Advanced Stats
        </TYPE.black>
        <QuestionHelper
          text={
            <>
              Shows advanced stats regarding transactions including detailed
              buy / sell counts and volume for different time ranges over the
              past 24hrs.
            </>
          }
        />
      </RowFixed>
      <Toggle
        id="toggle-advanced-stats-button"
        isActive={showStats}
        toggle={toggleStats}
      />
    </RowBetween>
  </TYPE.small>
) : null;
return showStats ? (
  tokenData && tokenData?.txns ? (
    <div>
      {ToggleElm}
      <StatsWrapper>
        {Object.keys(tokenData?.txns)
          .reverse()
          .map((key) => (
            <div
              key={key}
              style={{
                paddingRight:
                  key == _.last(Object.keys(tokenData?.txns).reverse())
                    ? 0
                    : 5,
                paddingBottom: 5,
                borderRight:
                  key == _.last(Object.keys(tokenData?.txns).reverse())
                    ? "none"
                    : "1px solid #444",
              }}
            >
              <StyledDiv style={{ fontSize: 12, color: "burntorange" }}>
                {getLabel(key)}
              </StyledDiv>
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                {Object.keys(tokenData.txns[key]).map((subKey) => (
                  <TYPE.white key={subKey} textAlign={"center"}>
                    <StyledDiv
                      style={{
                        color: subKey == "sells" ? "#f33645" : "#079a81",
                      }}
                    >
                      {subKey}
                    </StyledDiv>
                    <span
                      style={{
                        color: subKey == "sells" ? "#f33645" : "#079a81",
                      }}
                    >
                      {tokenData.txns[key][subKey]}
                    </span>
                  </TYPE.white>
                ))}
              </div>
            </div>
          ))}
        <VolumePanelWrapper>
          <TYPE.small>Hourly Volume</TYPE.small>
          <VolumeContainer>
            {Object.keys(tokenData?.volume)
              .reverse()
              .map((key) => (
                <div
                  key={key}
                  style={{
                    paddingRight:
                      _.last(Object.keys(tokenData.volume).reverse()) == key
                        ? 0
                        : 10,
                    borderRight:
                      _.last(Object.keys(tokenData.volume).reverse()) == key
                        ? "none"
                        : "1px solid #444",
                  }}
                >
                  <TYPE.small textAlign="center">
                    {getLabel(key, "Volume")}
                  </TYPE.small>
                  <TYPE.black>
                    ${abbreviateNumber(tokenData?.volume?.[key])}
                  </TYPE.black>
                </div>
              ))}
          </VolumeContainer>
        </VolumePanelWrapper>
     
      </StatsWrapper>
    </div>
  ) : (
    <p style={{ margin: 0 }}>Failed to load token data.</p>
  )
) : (
  <>{ToggleElm}</>
);
};
