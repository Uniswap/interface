import React, {useState, useEffect} from 'react'
import styled, {keyframes} from 'styled-components'
import { gradients, breakpoints } from './../../utils/theme'
import { CommunityBannerContent } from './../../utils/ui-constants'
import Layout from './layout/Layout'
import Button from './common/Button'

import dxDaoLogo from './../../assets/images/logo-dxdao.svg'
import BannerGraphic1 from './../../assets/images/owned-by-1.png'
import BannerGraphic2 from './../../assets/images/owned-by-2.png'
import BannerGraphic3 from './../../assets/images/owned-by-3.png'

const CommunityBanner = () => {
    return (
        <StyledCommunityBanner data-aos={'fade-up'} width={'main-width'} id={'community-banner'}>
            <div className="banner-inner-content">
                <img 
                    className="dxdao-logo" 
                    src={dxDaoLogo} 
                    title={'dxDao'} 
                    alt={'dxDao Logo'} 
                />
                <span className="pre-header">
                    {CommunityBannerContent.preHeader}
                </span>
                <h2>
                    {CommunityBannerContent.content}
                </h2>
                <div className="banner-footer-buttons">
                    {CommunityBannerContent.buttons.map((button, key) => (
                        <Button 
                            key={key} 
                            label={button.label} 
                            type={button.type} 
                        />
                    ))}
                </div>
            </div>
            <div className="banner-graphic-1"></div>
            <div className="banner-graphic-2"></div>
            <div className="banner-graphic-3"></div>
        </StyledCommunityBanner>
    )
}

const rotate = keyframes`
    0% {transform: rotate(0deg) scale(1)};
    50% {transform: rotate(180deg) scale(0.9)};
    100% {transform: rotate(360deg) scale(1)};
`;

const StyledCommunityBanner = styled(Layout)`
    &#community-banner {
        display: flex;
        margin-top: 308px;
        position: relative;
        margin-bottom: 372px;
        .banner-inner-content {
            margin-left: auto;
            width: 492px;
            display: flex;
            flex-direction: column;
            z-index: 100;
            position: relative;
            .dxdao-logo {
                margin-bottom: 64px;
                width: 92px;
            }
            .pre-header {
                margin-bottom: 24px;
                color: ${(props) => (props.theme.gray)};
                font-size: 20px;
                line-height: 30px;
                letter-spacing: 0.04em;
                font-weight: 300;
            }
            h2 {
                font-size: 49px;
                line-height: 63px;
                font-weight: 500;
                background: ${gradients.heroMainText};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 64px; 
            }
            .banner-footer-buttons {
                display: flex;
                .button {
                    margin-right: 24px;
                    width: 180px;
                }
            }
        }
        .banner-graphic-1,
        .banner-graphic-2,
        .banner-graphic-3 {
            width: 580px;
            height: 602px;
            background: url('${BannerGraphic1}');
            background-repeat: no-repeat;
            position: absolute;
            top: -100px;
            left: 20px;
            transform-origin: 50% 50%;
            animation: ${rotate} 5s infinite forwards linear;
            z-index: 1;
        }
        .banner-graphic-2 {
            width: 580px;
            height: 602px;
            background: url('${BannerGraphic2}');
            top: -100px;
            left: 20px;
            animation: ${rotate} 7s infinite forwards linear;
            z-index: 2;
        }
        .banner-graphic-3 {
            width: 958px;
            height: 958px;
            background: url('${BannerGraphic3}');
            background-size: contain;
            background-position: center;
            top: -260px;
            left: -180px;
            animation: ${rotate} 9s infinite forwards linear;
            z-index: 2;
        }
        @media screen and (max-width: ${breakpoints.l}) {
            width: 100%;
            .banner-inner-content {
                width: 390px;
            }
        }
        @media screen and (max-width: ${breakpoints.md}) {
            flex-direction: column;
            margin-top: 526px;
            .banner-graphic {
                background-size: contain;
                background-position: center;
                background-size: cover;
            }
            .banner-graphic-1 {
                background-size: cover;
                height: 320px;
                width: 320px;
                top: -380px;
                left: calc(50% - 160px);
            }
            .banner-graphic-2 {
                background-size: cover;
                height: 340px;
                width: 340px;
                top: -390px;
                left: calc(50% - 170px);
            }
            .banner-graphic-3 {
                background-size: cover;
                height: 540px;
                width: 540px;
                top: -490px;
                left: calc(50% - 270px);
            }
            .banner-inner-content {
                /* margin-top: 240px; */
                width: 100%;
                h2 {
                    font-size: 31px;
                    line-height: 37px;
                }
            }
        }
    }
`;

export default CommunityBanner;