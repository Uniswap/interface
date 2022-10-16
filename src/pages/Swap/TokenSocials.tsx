import { Globe, Twitter } from 'react-feather'
import { MenuItem, SidebarHeader } from "react-pro-sidebar";

import { CTooltip } from "@coreui/react";
import React from "react";
import { TYPE } from "theme";
import { lighten } from 'polished'
import styled from 'styled-components/macro'
import useTheme from 'hooks/useTheme'

const StyledGlobe = styled(Globe) <{ disabled?: boolean, color: string }>`
  font-size: 12px;
  color: ${props => props.color};
  margin-top: 2px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  &:hover {
    color: ${props => lighten(0.1, props.color)};
    transition: ease all 0.1s;
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  }
`;

const StyledTwitter = styled(Twitter) <{ disabled?: boolean, color: string }>`
  font-size: 12px;
  color: #fff;
  margin-top: 2px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  &:hover {
    color: ${props => lighten(0.1, props.color)};

    transition: ease all 0.1s;
    cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  }
`;

const SocialsMemo = function (props: { tokenInfo: any, tokenSymbol: string, theme: any }) {
  const { tokenInfo, tokenSymbol, theme } = props;
  if (tokenInfo) {
    let twitter = tokenInfo?.twitter;
    let coingecko = tokenInfo?.coingecko;
    let website = tokenInfo?.website;
    if (tokenSymbol?.toLowerCase() == "kiba") {
      twitter = "KibaInuWorld";
      website = "https://kibainu.org";
      coingecko = "kiba-inu";
    }
    return (
      <React.Fragment>
        <SidebarHeader>
          <TYPE.small
            style={{
              marginBottom: 3,
              borderBottom: `1px solid #444`,
            }}
          >
            {" "}
            {tokenInfo?.symbol} Socials
          </TYPE.small>
        </SidebarHeader>
        <MenuItem
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", columnGap: 10 }}
          >
            {twitter ? (
              <CTooltip
                placement="bottom"
                content={`${tokenInfo?.name} Twitter`}
              >
                <a
                  style={{ display: "inline-block" }}
                  href={`https://twitter.com/${twitter}`}
                >
                  <StyledTwitter color={theme.text1} />
                </a>
              </CTooltip>
            ) : (
              <CTooltip
                placement="bottom"
                content={`Unable to find ${tokenInfo?.name} twitter`}
              >
                <span style={{ display: "inline-block" }}>
                  <StyledTwitter color={theme.text1} disabled />
                </span>
              </CTooltip>
            )}
            {website ? (
              <CTooltip
                placement="bottom"
                content={`${tokenInfo?.name} Website`}
              >
                <a style={{ display: "inline-block" }} href={website}>
                  <StyledGlobe color={theme.text1} />
                </a>
              </CTooltip>
            ) : (
              <CTooltip
                placement="bottom"
                content={`Unable to find ${tokenInfo?.name} website`}
              >
                <span style={{ display: "inline-block" }}>
                  <StyledGlobe color={theme.text1} disabled />
                </span>
              </CTooltip>
            )}
            {coingecko && (
              <CTooltip
                placement="bottom"
                content={`${tokenInfo?.name} Coin Gecko Listing`}
              >
                <a
                  style={{ display: "inline-block" }}
                  href={`https://coingecko.com/en/coins/${coingecko}`}
                >
                  <img
                    src="https://cdn.filestackcontent.com/MKnOxRS8QjaB2bNYyfou"
                    style={{ height: 25, width: 25 }}
                  />
                </a>
              </CTooltip>
            )}
          </div>
        </MenuItem>
      </React.Fragment>
    );
  }
  return null;
};

export default SocialsMemo;