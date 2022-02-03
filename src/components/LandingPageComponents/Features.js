import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import { FeaturesContent } from './../../utils/ui-constants'
import { gradients, breakpoints } from './../../utils/theme'
import Layout from './layout/Layout'
import FeatureItem from './FeatureItem'
import BackgroundTitleGradient from './../../assets/images/gradient-features.png'

const Features = () => {
    return (
        <StyledFeatures id={'features'} width="main-width">
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
        .pre-header {
            font-size: 20px;
            line-height: 30px;
            font-weight: 300;
            letter-spacing: 0.5px;
            color: ${(props) => (props.theme.gray)};
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
        @media screen and (max-width: ${breakpoints.l}) {
            width: 928px;
        }
        @media screen and (max-width: ${breakpoints.md}) {
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
    }
`;

export default Features;