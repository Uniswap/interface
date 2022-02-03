import React, {useState, useEffect} from 'react'
import styled, {keyframes} from 'styled-components'
import { HeroContent, RoutingThroughContent } from './../../../utils/ui-constants'
import { watchPosition } from '../../../utils/helper-functions'
import { gradients, breakpoints } from '../../../utils/theme'
import HeroImage from './../../../assets/images/hero-graphic-desktop.png'
import HeroImageLeft from './../../../assets/images/hero-graphic-left.png'
import Layout from './Layout'
import Button from './../common/Button'

import Arrow from './../../../assets/images/arrow-down-hero.svg'
import Marquee from 'react-fast-marquee'

const arrowIndicatorAnimation = keyframes`
  0% {opacity: 1}
  10% {opacity: 0.3}
  20% {opacity: 1}
  100% {opacity: 1}
`

const ArrowIndicator = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80px;
  .arrow {
    width: 12px;
    height: 5px;
    margin-bottom: 2px;
    background-image: url('${Arrow}');
    background-size: contain;
    bakground-position: center;
    animation: ${arrowIndicatorAnimation} infinite;
    animation-duration: 3s;
    background-repeat: no-repeat;
    &:nth-child(2) {
      animation-delay: 0.4s;
    }
    &:nth-child(3) {
      animation-delay: 0.8s;
    }
  }
`;

const Hero = (props) => {

    let [isHeroActive, setIsHeroActive] = useState(true);
    let [logosArrays, setLogosArrays] = useState([]);
    useEffect(() => {
        let options = {
            root: null,
            rootMargin: '0px 0px 0px 0px',
            threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
        };

        let callback = (entries, observer) => {
            entries.forEach(entry => {
                let elementHeight = entry.boundingClientRect.height;
                let pixelsShown = 
                    entry.boundingClientRect.top < 0 ?
                        -entry.boundingClientRect.top :
                        0
                let showElement = pixelsShown < elementHeight / 4;
                setIsHeroActive(showElement);
            });
        };

        let observer = new IntersectionObserver(callback, options);

        let target = document.querySelector('#index-hero');
        observer.observe(target);

    }, []);

    useEffect(() => {
        let i,j, temporary, chunk = 2;
        let temporaryArray = [];
        for (i = 0,j = HeroContent.heroLogos.length; i < j; i += chunk) {
            temporary = HeroContent.heroLogos.slice(i, i + chunk);
            temporaryArray.push(temporary);
        }
        setLogosArrays(temporaryArray);
    }, [])


    return (
        <StyledHero id={'index-hero'} className={isHeroActive ? 'hero-active' : ''}>
            <Layout width="main-width" className={'inner-hero'}>
                {HeroContent ? (
                    props.children
                ) : (
                    <div className="hero-content" data-aos="fade-up">
                        <h1>{HeroContent.mainText}</h1>
                        <ul className="hero-logos-list">
                            {logosArrays.map((item, key) => (
                                <div 
                                    key={key} 
                                    className="hero-logo-group"
                                >
                                    {item.map((logo, key) => (
                                        <li key={key}>
                                            <img src={logo.img} title={logo.title} />
                                        </li>
                                    ))}
                                </div>
                            ))}
                        </ul>
                        <ul className="hero-button-list">
                            {HeroContent.heroButtons.map((button, key) => (
                                <li key={key}>
                                    <Button type={button.type} label={button.label} to={button.href}/>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="hero-background">
                    <div className="hero-image hero-image-right"></div>
                    <div className="hero-image hero-image-left"></div>
                </div>
                <div className="routing-through" data-aos='fade-up'>
                    <div className="routing-through-header">
                        <div className="left-line"></div>
                        <div className="label">{RoutingThroughContent.title}</div>
                        <div className="right-line"></div>
                    </div>
                    <div className="routing-through-body" >
                        <Marquee speed={50} gradientColor={[12,11,18]}>
                            <div className="marquee-inner">
                                {RoutingThroughContent.companies.map((company, key) => (
                                    <img key={key} src={company.img} />
                                ))}
                                {RoutingThroughContent.companies.map((company, key) => (
                                    <img key={key + '-copy'} src={company.img} />
                                ))}
                            </div>
                        </Marquee>
                    </div>
                </div>
                <ArrowIndicator>
                    <div className="arrow" />
                    <div className="arrow" />
                    <div className="arrow" />
                </ArrowIndicator>
            </Layout>
        </StyledHero>
    )
}

const zoomOut = keyframes`
    0% {transform: scale(1.2); opacity: 0;}
    100% {transform: scale(1); opacity: 0.7;}
`;

const StyledHero = styled(Layout)`
    position: relative;
    padding-bottom: 120px;
    width: calc(100% + 32px) !important;
    .inner-hero {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 240px);
    }
    &:not(.hero-active) {
        .hero-image-left,
        .hero-image-right {
            opacity: 0;
        }
        .hero-image-right {
            transform: translateY(-100px);
        }
        .hero-image-left {
            transform: translateY(-30px);
        }
    }
    .hero-content {
        padding: 0 144px;
        margin-top: 80px;
        position: relative;
        z-index: 4;
        h1 {
            width: 665px;
            span {
                font-size: 61px;
                font-weight: 600;
                background: ${gradients.heroMainText};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                line-height: 74px;
                br {
                    display: none;
                }
            }
        }
        .hero-logos-list {
            margin-top: 65px;
            display: flex;
            align-items: center;
            position: relative;
            z-index: 3;
            .hero-logo-group {
                display: flex;
                align-items: center;
                li {
                    margin-right: 31px;
                    opacity: 0.7;
                }
            }
        }
        .hero-button-list {
            display: flex;
            margin-top: 65px;
            li {
                margin-right: 40px;
            }
        }
    }
    .hero-background {
        animation: ${zoomOut} 500ms 1750ms ease-out forwards;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        z-index: 2;
    }
    .hero-image-left,
    .hero-image-right {
        position: absolute;
        pointer-events: none;
        background-repeat: no-repeat;
        background-position: right;
        transition: 1s ease-in-out all;
        /* transition: 0.25s ease-in-out transform; */
    }
    .hero-image-right {
        background-image: url('${HeroImage}');
        width: 1198px;
        height: 905px;
        top: -172px;
        right: 0;
        z-index: 1;
    }
    .hero-image-left {
        background-image: url('${HeroImageLeft}');
        width: 1680px;
        height: 1680px;
        top: -172px;
        right: 0;
        background-position: left top;
        background-size: 100% auto;
        z-index: 1;
        @media screen and (min-width: 1680px) {
            width: 100%;
        }
    }
    .routing-through {
        margin-top: auto;
        position: relative;
        z-index: 0;
        .routing-through-header {
            height: 28px;
            display: flex;
            align-items: center;
            letter-spacing: 1px;
            .left-line,
            .right-line {
                position: relative;
                height: 100%;
                flex-grow: 1;
                &:after {
                    content: '';
                    position: absolute;
                    width: 100%;
                    bottom: 14px;
                    height: 1px;
                    background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
                }
            }
            .label {
                color: ${(props) => (props.theme['blueGray'])};
                margin: 0 10px;
            }
        }
        .routing-through-body {
            position: relative;
            &:after {
                content: '';
                position: absolute;
                width: 100%;
                bottom: -14px;
                height: 1px;
                background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
            }
            .marquee {
                min-width: unset;
                .marquee-inner {
                    padding: 18px 0;
                    img {
                        margin: 0 25px;
                    }
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        .hero-content {
            margin-top: 42px;
            padding: 0px;
            h1 {
                /* max-width: 303px; */
                span {
                    font-size: 48px;
                    line-height: 54px;
                    font-weight: 500;
                }
            }
            .hero-logos-list {
                flex-wrap: wrap;
                margin-right: 30px;
                margin-top: 48px;
                flex-direction: column;
                align-items: flex-start;
                li {
                    margin-bottom: 30px;
                    img {
                        max-width: 107px;
                        max-height: 64px;
                    }
                }
            }
            .hero-button-list {
                flex-wrap: wrap;
                margin-top: 10px;
                li {
                    margin-bottom: 16px;
                    .button {
                        a {
                            width: 163px;
                            font-size: 10px;
                            padding: 0;
                            &,
                            & .label {
                                height: 36px;
                                line-height: 36px;
                            }
                        }
                    }
                }
            }
        }
        .routing-through {
            .routing-through-header {
                .left-line {
                    display: none;
                }
            }
        }
        .hero-image-right {
            width: 1198px;
            height: 905px;
            top: -422px;
            right: -340px;
            z-index: 1;
            transform: scale(0.8) !important;
        }
        .hero-image-left {
            display: none;
        }
    }
    @media screen and (max-width: ${breakpoints.s}) {
        .hero-content {
            h1 {
                max-width: 80%;
                span {
                    font-size: 39px;
                    line-height: 46.8px;
                    font-weight: 500;
                    br {
                        /* display: unset; */
                    }
                }
            }
        }
    }
    @media screen and (max-width: 460px) {
        .hero-content {
            h1 {
                br {
                    display: unset;
                }
            }
        }
    }
    @media not all and (min-resolution:.001dpcm)
    { @supports (-webkit-appearance:none) {
        .hero-content {
            h1 {
                color: #DFDCFD !important;
                span {
                    background: unset;
                    -webkit-background-clip: unset;
                    -webkit-text-fill-color: unset;
                    br {
                        display: none;
                    }
                }
            }
        }
    }}
`;

export default Hero;