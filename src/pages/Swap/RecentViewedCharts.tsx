import { ArrowDownRight, ArrowUpRight, Info } from "react-feather"
import  { StyledInternalLink, TYPE } from "theme"

import CurrencyLogo from "components/CurrencyLogo"
import { LightCard } from "components/Card"
import _ from "lodash"
import { darken } from 'polished'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from "hooks/web3"
import { useIsMobile } from "./SelectiveCharting"
import useTheme from 'hooks/useTheme'
import { useUserChartHistoryManager } from "state/user/hooks"

const RecentCard = styled(LightCard)`
  background: ${(props) => props.theme.bg5};
  color:${props => props.theme.text1};
  border: 1px solid #eee;
  border: none;
  &:hover {
    background: ${(props) => darken(0.1, props.theme.bg5)};
    > * {
      text-decoration: none;
    }
    transition: all ease 0.1s;
  }
`;

export const RecentlyViewedCharts = () => {
    const {chainId} = useActiveWeb3React()
    const isMobile = useIsMobile()
    const [userChartHistory] = useUserChartHistoryManager()
    const theme = useTheme()
    return (<div
        style={{
            width: "100%",
            padding: 10,
        }}
    >
        <div
            style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                marginBottom: 5,
            }}
        >
            <TYPE.black alignItems="center" display="flex">
                Recently Viewed Charts <ArrowDownRight />
            </TYPE.black>
        </div>
        <div
            style={{
                width: "100%",
                padding: 20,
                display: "grid",
                alignItems: "center",
                gridTemplateColumns: isMobile
                    ? "100%"
                    : "auto auto auto auto",
                gap: 20,
            }}
        >
            {_.orderBy(
                _.uniqBy(
                    userChartHistory, (a) =>
                    a?.token?.address?.toLowerCase()
                ).filter((item) => item?.chainId === chainId),
                (a) => a?.time
            )
                .reverse()
                .map((item: any) => (
                    <StyledInternalLink
                        key={item?.token?.address}
                        color={"#fff"}
                        to={`/selective-charts/${item?.token?.address}/${item?.token?.symbol
                            }/${item?.token?.name
                                ? item?.token?.name
                                : item?.token?.symbol
                            }/${item?.token?.decimals ? item?.token?.decimals : 18
                            }`}
                    >
                        <RecentCard>
                            <div
                                style={{
                                    color: theme.text1,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexFlow: "row wrap",
                                        gap: 5,
                                        alignItems: "center",
                                    }}
                                >
                                    <CurrencyLogo currency={item?.token} />
                                    <TYPE.small>
                                        <span>{item?.token?.symbol} </span>
                                        <br />
                                        <span> {item?.token?.name}</span>
                                    </TYPE.small>
                                </div>
                                <TYPE.black alignItems="center">
                                    <div
                                        style={{
                                            cursor: "pointer",
                                            display: "flex",
                                            flexFlow: "column wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>
                                            View Chart <ArrowUpRight />
                                        </span>
                                    </div>
                                </TYPE.black>
                            </div>
                        </RecentCard>
                    </StyledInternalLink>
                ))}

                {!Boolean(userChartHistory.length) && <RecentCard>
                    <Info />
                    <TYPE.main>Your most recent viewed charts will appear here</TYPE.main>
                </RecentCard>}
        </div>
    </div>)
}