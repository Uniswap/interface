import React from 'react'
import styled from 'styled-components'
import { FeaturesContent } from './../../utils/ui-constants'
import { gradients, breakpoints } from './../../utils/theme'
import Layout from './layout/Layout'
import FeatureItem from './FeatureItem'
import BackgroundTitleGradient from './../../assets/images/gradient-features.png'

const Features = () => {
    return (
        <StyledFeatures id={'features'} width="main-width">
            <section className="top-banner" data-aos={'fade-up'}>
                <strong>{FeaturesContent.topBanner.title}</strong>
                <div className="top-banner-logos">
                    {FeaturesContent.topBanner.logos.map((logo, index) => <img key={index} src={logo} alt={'Swap, Farm, Bridge & Vote. DeFi unchained.'} />)}
                </div>
            </section>
            <span className="pre-header">
                {FeaturesContent.preHeader}
            </span>
            <h2>
                <div className="background-gradient" />
                <span>
                    {FeaturesContent.sectionTitle}
                </span>
            </h2>
            <section className="features-showcase">
                <ul className="features-list">
                    {FeaturesContent.features.map((feature, key) => (
                        <FeatureItem feature={feature} key={key} id={'feature-' + key}/>
                    ))}
                </ul>
            </section>
        </StyledFeatures>
    )
}

const StyledFeatures = styled(Layout)`
    &#features {
        padding-top: 96px;
        .top-banner {
            text-align: center;
            padding: 0 0 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            strong {
                font-size: 61px;
                line-height: 74px;
                font-weight: 600;
                background: ${gradients.heroMainText};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 32px;
                width: 820px;
            }
            .top-banner-logos {
                display: flex;
                align-items: center;
                margin-bottom: 176px;
                img {
                    margin-right: 32px;
                    opacity: 0.7;
                    &:last-child {
                        margin-right: 0;
                    }
                }
            }
        }
        .pre-header {
            font-size: 20px;
            line-height: 30px;
            font-weight: 300;
            letter-spacing: 0.5px;
            color: #B7B5CB;
            margin-bottom: 8px;
        }
        h2 {
            margin-bottom: 76px;
            position: relative;
            /* z-index: 1; */
            span {
                font-size: 49px;
                line-height: 64px;
                font-weight: 500;
                background: ${gradients.heroMainText};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                position: relative;
                z-index: 1;
            }
            .background-gradient {
                position: absolute;
                width: 500px;
                height: 300px;
                background-image: url('${BackgroundTitleGradient}');
                background-size: cover;
                bottom: -100px;
                z-index: 0;
            }
        }
        .features-showcase {
            .features-list {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                
            }
        }
        @media screen and (max-width: ${breakpoints.md}) {
            width: 928px;
            .top-banner {
                strong {
                    width: 600px;
                    font-size: 40px;
                    line-height: 56px;
                }
            }
            .pre-header {
                font-size: 18px;
            }
            h2 {
                /* padding-left: 20px; */
                span {
                    font-size: 31px;
                }
            }
            .features-showcase {
                padding: 0 16px;
                .features-list {
                    flex-direction: column;
                    .feature-item {
                        width: 100%;
                    }
                }
            }
        }
        @media screen and (max-width: ${breakpoints.s}) {
            padding-top: 0;
            .top-banner {
                align-items: baseline;
                text-align: left;
                strong {
                    font-size: 39px !important;
                    line-height: 47px !important;
                    width: 303px !important;
                }
                .top-banner-logos {
                    width: 260px;
                    flex-wrap: wrap;
                    img {
                        max-width: unset;
                        max-height: unset;
                        margin-right: 21px;
                        margin-bottom: 21px;
                        &:first-child {
                            width: 92px;
                        }
                        &:nth-child(2) {
                            width: 108px;
                        }
                        &:nth-child(3) {
                            width: 84px;
                        }
                    }
                }
            }
        }
        @media screen and (max-width: ${breakpoints.xs}) {
            .top-banner {
                strong {
                    font-size: 28px;
                    line-height: 44px;
                    width: unset;
                }
            }
        }
    }
`;

export default Features;