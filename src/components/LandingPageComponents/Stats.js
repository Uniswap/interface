import React, {useState, useEffect} from 'react'
import $ from 'jquery'
import styled from 'styled-components'
import { gradients, breakpoints } from '../../utils/theme'
import { StatsContent } from '../../utils/ui-constants'
import { toClassName } from './../../utils/helper-functions'
import Layout from './layout/Layout'
import BackgroundTitleGradient from './../../assets/images/gradient-stats.png'
import TextyAnim from 'rc-texty';

const Stats = () => {

    let [tvl, setTvl] = useState(0);
    let [isChartActive, setIsChartActive] = useState(false);

    useEffect(() => {
        const fetchPromise = fetch('https://api.llama.fi/tvl/swapr').then((data) => {
            return data.json();
        }).then((decodedTvl) => {
            let stringTvl = decodedTvl.toString();
            let splitTvlString = stringTvl.split('.');
            let integralTvl = splitTvlString[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            setTvl(integralTvl);
        })
    }, []);

    useEffect(() => {
        let options = {
            root: null,
            rootMargin: '200px 0px 500px 0px',
            threshold: 0.5
        }

        let callback = (entries, observer) => {
            entries.forEach(entry => {
                setIsChartActive(entry.isIntersecting)
            });
        };

        let observer = new IntersectionObserver(callback, options);

        let target = document.querySelector('#stats');
        observer.observe(target);


    }, []);

    let statsData = {
        'TVL': tvl,
    };

    return (
        <StyledStats id={'stats'} width={'main-width'} isChartActive={isChartActive}>
            <div className="background-gradient"></div>
            <h2>
                <span>{StatsContent.title}</span>
            </h2>
            <div className="stats-grid">
                {StatsContent.stats.map((statsItem, key) => (
                    <div key={key} className={`stats-module ${toClassName(statsItem.title)}`}>
                        <div className="poligon" />
                        <h3 className="">{statsItem.title}</h3>
                        {statsItem.value && (
                                <span className={`value ${!isChartActive ? 'hidden' : ''}`}>
                                    {isChartActive && (
                                        statsItem.headingDollar && (
                                            <TextyAnim type="flash">$</TextyAnim>
                                        ),
                                        statsItem.externalSource ? (
                                            <TextyAnim type="flash">
                                                {statsData[statsItem.title]}
                                            </TextyAnim>
                                            ) : (
                                            statsItem.value
                                        )
                                    )}
                                </span>
                            )
                        }
                        {statsItem.companies && (
                            <>
                                <ul className="routing-through-companies">
                                    {statsItem.companies.map((company, key) => (
                                        <li key={key} className="routing-company">
                                            <a href={company.href}>
                                                <img src={company.image} />
                                                <span>{company.name}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                                <span className="more-label">{statsItem.moreLabel}</span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </StyledStats>
    )
}

const StyledStats = styled(Layout)`
    position: relative;
    .background-gradient {
        position: absolute;
        width: 400px;
        height: 400px;
        background-repeat: no-repeat;
        background-image: url('${BackgroundTitleGradient}');
        background-size: contain;
        z-index: 0;
        top: -180px;
        left: -300px;
        background-position: center;
    }
    h2 {
        position: absolute;
        top: 0;
        span {
            font-size: 31px;
            line-height: 38px;
            font-weight: 400;
            background: ${gradients.heroMainText};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            z-index: 1;
            position: relative;
        }
    }
    .stats-grid {
        margin-top: 260px;
        display: grid;
        padding: 0 96px;
        grid-template-columns: 480px 63px auto;
        grid-template-rows: 185px 193px 211px;
        grid-template-areas: "totalvolume totalvolume trades" "totalvolume totalvolume totalfeescollected" "swprprice tvl tvl";
        .stats-module {
            position: relative;
            &:before,
            &:after {
                transition: ease-in-out 1s clip-path;
            }
        }
        .total-volume {
            grid-area: totalvolume;
            &:after {
                right: 0;
                height: 100%;
                clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 2px 0, 100% 100%, 0 100%);' : 
                    'polygon(0 0, 2px 0, 2px 0, 0 0);'
                };
                width: 1px;
                background: linear-gradient(180deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
            &:before {
                left: 0;
                bottom: 0;
                height: 1px;
                width: 180%;
                clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 100% 0, 100% 2px, 0 2px);' : 
                    'polygon(0 0, 0 0, 0 2px, 0 2px);'
                };
                background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
        }
        .trades {
            grid-area: trades;
            &:before {
                left: 0;
                top: 0;
                height: 1px;
                width: 100%;
                -webkit-clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 100% 0, 100% 2px, 0 2px);' : 
                    'polygon(0 0, 0 0, 0 2px, 0 2px);'
                };
                background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
        }
        .total-fees-collected {
            grid-area: totalfeescollected;
            &:before {
                left: 0;
                top: 0;
                height: 1px;
                clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 100% 0, 100% 2px, 0 2px);' : 
                    'polygon(0 0, 0 0, 0 2px, 0 2px);'
                };
                width: 100%;
                background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
        }
        .swpr-price {
            grid-area: swprprice;
            &:before {
                left: 0;
                bottom: 0;
                height: 1px;
                width: 100%;
                clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 100% 0, 100% 2px, 0 2px);' : 
                    'polygon(0 0, 0 0, 0 2px, 0 2px);'
                };
                background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
        }
        .tvl {
            grid-area: tvl;
            &:after {
                left: 0;
                height: 100%;
                -webkit-clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 2px 0, 2px 100%, 0 100%)' : 
                    'polygon(0 0, 100% 0, 100% 0, 0 0)'
                };
                width: 1px;
                background: linear-gradient(180deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
            &:before {
                left: 0;
                bottom: 0;
                height: 1px;
                width: 100%;
                clip-path: ${(props) => props.isChartActive ? 
                    'polygon(0 0, 100% 0, 100% 2px, 0 2px);' : 
                    'polygon(0 0, 0 0, 0 2px, 0 2px);'
                };
                background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
        }
        .routing-through {
            grid-area: routingthrough;
            display: none !important;
            &:after {
                left: 0;
                height: ${(props) => `${props.isChartActive ? `100%` : `0px` }`};
                width: 1px;
                background: linear-gradient(180deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
            .routing-through-companies {
                margin-top: 43px;
                .routing-company {
                    margin-bottom: 28px;
                    opacity: 0.6;
                    transition: 0.35s ease-in-out opacity;
                    &:hover {
                        opacity: 0.9;
                    }
                    a {
                        display: flex;
                        align-items: center;
                        span {
                            font-size: 20px;
                        }
                        img {
                            margin-right: 8px;
                        }
                    }
                }
            }
            .more-label {
                font-size: 16px;
                color: rgba(110, 104, 157, 1);
                font-weight: 300;
            }
        }
        .stats-module {
            display: flex;
            flex-direction: column;
            padding: 0 75px;
            justify-content: center;
            position: relative;
            &:after,
            &:before {
                content: '';
                position: absolute;
            }
            h3 {
                color: ${(props) => (props.theme.blueGray)};
                font-weight: 300;
                margin-bottom: 16px;
                letter-spacing: 1px;
            }
            .value {
                font-size: 49px;
                line-height: 62px;
                font-weight: 300;
                min-height: 62px;
                white-space: nowrap;
                .texty {
                    display: inline-block;
                    &.dim,
                    &.hiddable-mobile {
                        span {
                            color: #3E3C55;
                        }
                    }
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.l}) {
        width: 928px;
        .stats-grid {
            grid-template-columns: auto auto auto;
            padding: 0;
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        .stats-grid {
            grid-template-columns: 50% 25% 25%;
            grid-template-rows: 154px 148px 124px 124px;
            grid-template-areas: "totalvolume totalvolume totalvolume" "trades swprprice swprprice" "totalfeescollected totalfeescollected totalfeescollected" "tvl tvl tvl" "routingthrough routingthrough routingthrough";
            margin-top: 35px;
            padding: 0;
            .stats-module {
                padding: 0;
                h3 {
                    margin-top: 9px;
                    margin-bottom: 4px;
                }
                .value {
                    font-size: 35px;
                    min-height: 42px;
                    .hiddable-mobile {
                        display: none;
                    }
                }
                &.total-volume {
                    &:before {
                        -webkit-clip-path: ${(props) => props.isChartActive ? 
                            'polygon(0 0, 100% 0, 100% 2px, 0 2px)' : 
                            'polygon(0 0, 0 0, 0 2px, 0 2px)'
                        };
                        width: 100%;
                    }
                }
                &.routing-through {
                    padding: 30px 0;
                    /* &:before, */
                    &:after {
                        display: none;
                    }
                    &:before {
                        right: 25%;
                        bottom: 0;
                        width: 1px;
                        height: 100%;
                        -webkit-clip-path: ${(props) => props.isChartActive ? 
                            'polygon(0 0, 100% 0, 100% 100%, 0 100%);' : 
                            'polygon(0 0, 100% 0, 100%, 0 0);'
                        };
                        background: linear-gradient(180deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
                    }
                }
                &.tvl {
                    &:after {
                        top: 0;
                        height: 1px;
                        width: 100%;
                        -webkit-clip-path: ${(props) => props.isChartActive ? 
                            'polygon(0 0, 100% 0, 100% 2px, 0 2px);' : 
                            'polygon(0 0, 0 0, 0 2px, 0 2px);'
                        };
                        background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
                    }
                }
                &.swpr-price {
                    padding-left: 38px;
                    &:after {
                        left: 0;
                        height: 100%;
                        width: 2px;
                        -webkit-clip-path: ${(props) => props.isChartActive ? 
                            'polygon(0 0, 100% 0, 100% 100%, 0 100%);' : 
                            'polygon(0 0, 100% 0, 100%, 0 0);'
                        };
                        background: linear-gradient(180deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
                    }
                }
                &.total-fees-collected,
                &.tvl {
                    padding: 20px 38px;
                }
                &.total-fees-collected {
                    &:after {
                        left: 0;
                        height: 200%;
                        top: 0;
                        width: 1px;
                        background: linear-gradient(180deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
                    }
                }
            }
        }
        h2 {
            position: relative;

        }
    }
`;

export default Stats;