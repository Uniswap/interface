import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import { AboutCardsContent } from './../utils/ui-constants.js'
import { gradients, breakpoints } from './../utils/theme.js'
import Layout from './layout/Layout'
import Button from './common/Button'

const AboutCards = () => {
    return (
        <StyledAboutCards width={'main-width'}>
            <ul>
                {AboutCardsContent.map((aboutCard, key) => (
                    <li key={key} data-aos={'fade-up'}>
                        <div className="image-wrapper">
                            <img src={aboutCard.image} />
                            <svg width="0" height="0">
                                <linearGradient id="button-grad" x1="100%" x2="0" y1="100%" y2="0">
                                    <stop offset="0%"/>
                                    <stop offset="100%"/>
                                </linearGradient>
                                <symbol id="button-border" overflow="visible">
                                    <rect width="100%" height="100%" rx={'8px'} ry={'8px'}/>
                                </symbol>
                            </svg>
                            <svg className="button-border">
                                <use href="#button-border"/>
                            </svg>
                        </div>
                        <div className="content-wrapper">
                            <h2>{aboutCard.title}</h2>
                            <p>{aboutCard.content}</p>
                            <Button label={aboutCard.buttonLabel} type={'dark'} /> 
                            <svg width="0" height="0">
                                <linearGradient id="content-grad" x1="0" x2="100%" y1="0" y2="100%">
                                    <stop offset="0%"/>
                                    <stop offset="100%"/>
                                </linearGradient>
                                <symbol id="content-border" overflow="visible">
                                    <rect width="100%" height="100%" rx={'8px'} ry={'8px'}/>
                                </symbol>
                            </svg>
                            <svg className="content-border">
                                <use href="#content-border"/>
                            </svg>
                        </div>
                    </li>
                ))}
            </ul>
        </StyledAboutCards>
    )
}

const StyledAboutCards = styled(Layout)`
    margin: 240px auto;
    li {
        display: flex;
        margin-bottom: 72px;
        &:last-child {
            margin-bottom: 0;
        }
        &:nth-child(even) {
            .image-wrapper {
                margin-left: auto;
            }
        }
        .image-wrapper,
        .content-wrapper {
            position: relative;
            height: 369px;
            border-radius: 11px;
        }
        .image-wrapper {
            width: 339px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-right: 6px;
            position: relative;
            &:after {
                background: linear-gradient(0deg, #435AFF 0%, #7342FF 48.44%, #D235CF 100%);
                height: 169px;
                width: 6px;
                right: -6px;
                content: '';
                position: absolute;
                top: calc(50% - (169px / 2));
            }
        }
        .content-wrapper {
            width: 582px;
            padding: 50px 68px;
            background: radial-gradient(59.99% 70.21% at -19.86% 50%,rgba(84,25,255,0.49) 0%,rgba(42,47,78,0.217) 100%);
            h2 {
                font-size: 25px;
                line-height: 40px;
                background: ${gradients.heroMainText};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 24px;
                font-weight: 300;
            }
            p {
                margin-bottom: 24px;
                font-size: 20px;
                line-height: 30px;
                color: rgba(183, 181, 203, 1);
                font-weight: 200;
            }
            .content-border {
                position: absolute;
                overflow: visible;
                left: 0;
                width: 100%;
                top: 0;
                height: 100%;
                fill: none;
                stroke: url(#button-grad);
                stroke-width: 1px;
            }
            .button {
                width: fit-content;
            }
            #content-grad stop:nth-child(1) {
                /* stop-color: #374284; */
                stop-color: rgba(200, 194, 255, 0.5);
            }
            #content-grad stop:nth-child(2) {
                /* stop-color: rgba(61, 90, 254, 1); */
                stop-color: rgba(42, 47, 78, 0.26);
            }
        }
        .image-wrapper {
            background: radial-gradient(59.99% 70.21% at 119.86% 50%,rgba(84,25,255,0.49) 0%,rgba(42,47,78,0.217) 100%);
            .button-border {
                position: absolute;
                overflow: visible;
                left: 0;
                width: 100%;
                top: 0;
                height: 100%;
                fill: none;
                stroke: url(#button-grad);
                stroke-width: 1px;
            }
            #button-grad stop:nth-child(1) {
                stop-color: rgba(200, 194, 255, 0.5);
            }
            #button-grad stop:nth-child(2) {
                stop-color: rgba(42, 47, 78, 0.26);
            }
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        li {
            flex-direction: column;
            .image-wrapper {
                width: 100%;
                background: none;
                .button-border {
                    display: none;
                }
                &:after {
                    display: none;
                }
            }
            .content-wrapper {
                width: 100%;
                height: unset;
                background: none;
                padding: 0 16px;
                .content-border {
                    display: none;
                }
            }
        }
    }
`;

export default AboutCards;