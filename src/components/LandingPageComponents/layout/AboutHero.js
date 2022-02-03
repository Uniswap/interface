import React, {useState, useEffect, useRef} from 'react'
import styled, { keyframes } from 'styled-components'
import { AboutHeroContent } from './../../utils/ui-constants'
import { gradients, breakpoints } from '../../utils/theme'
import Layout from './Layout'
import Button from './../common/Button'
import HeroImageBottom from './../../images/hero-graphic-about-desktop.png'
import HeroArrow from './../../images/about-hero-arrow.png'

const Hero = () => {
    const [scrollPosition, setScrollPosition] = useState(null);

    useEffect(() => {
        window.addEventListener('scroll', listenToScroll)
    }, []);

    const listenToScroll = (e) => {
        setScrollPosition(window.scrollY);
    };

    return (
        <StyledHero heroImageOffsetTop={scrollPosition}>
            <Layout width="main-width">
                <div className="hero-content" data-aos="fade-up">
                    <h1>{AboutHeroContent.mainText}</h1>
                    <p>{AboutHeroContent.heroParagraph}</p>
                    <ul className="hero-button-list">
                        {AboutHeroContent.heroButtons.map((button, key) => (
                            <li key={key}>
                                <Button type={button.type} label={button.label} to={button.href}/>
                            </li>
                        ))}
                    </ul>
                </div>
            </Layout>
            <div className="hero-background">
                <div className={`hero-image hero-image-bottom`} style={{
                    // top: `calc(-138px + ${scrollPosition < 500 ? scrollPosition : 500 * 2}px)`,
                    opacity: 1 - (scrollPosition / 200),
                    transform: `translateY(calc(${scrollPosition}px)) scale(calc(1 + ${scrollPosition / 100})`
                }}/>
                <div 
                    className="hero-image hero-gradient-center"
                />
                <div
                    className="hero-image hero-arrow hero-arrow-left"
                />
                <div 
                    className="hero-image hero-arrow hero-arrow-right"
                />
            </div>
        </StyledHero>
    )
}

const fadeUp = keyframes`
    0% {transform: translateY(500px)};
    100% {transform: translateY(0)};
`;

const StyledHero = styled(Layout)`
    position: relative;
    padding-bottom: 120px;
    margin-bottom: 347px;
    .hero-background {
        position: absolute;
        height: 564px;
        width: 100%;
        top: 0;
        .hero-image {
            top: 0;
            position: absolute;
            background-repeat: no-repeat;
        }
        .hero-image-bottom {
            background-image: url(${HeroImageBottom});
            height: 100vh;
            width: 100vw;
            background-position: bottom;
            top: -138px;
            opacity: 1;
            pointer-events: none;
            transform-origin: 50% 100%;
        }
        .hero-arrow {
            background-image: url(${HeroArrow});
            height: 515px;
            width: 321px;
            left: 100px;
            background-position: center;
            &.hero-arrow-right {
                left: unset;
                right: 100px;
                transform: scaleX(-1);
            }
        }
    }
    .hero-content {
        padding: 0 144px;
        margin-top: 80px;
        position: relative;
        text-align: center;
        z-index: 1;
        h1 {
            font-size: 61px;
            font-weight: 600;
            background: ${gradients.heroMainText};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 74px;
            margin-bottom: 24px;
        }
        p {
            font-size: 25px;
            line-height: 40px;
            max-width: 736px;
            margin: 0 auto;
            color: rgba(183, 181, 203, 1);
        }
        .hero-button-list {
            display: flex;
            margin-top: 65px;
            justify-content: center;
            li {
                margin-right: 40px;
            }
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        .hero-content {
            margin-top: 42px;
            padding: 0px;
            max-width: 302px;
            h1 {
                font-size: 39px;
                line-height: 46.8px;
                font-weight: 500;
                text-align: left;
            }
            p {
                text-align: left;
                font-size: 20px;
                line-height: 30px;
            }
            .hero-button-list {
                flex-wrap: wrap;
                margin-top: 30px;
                justify-content: left;
                li {
                    margin-bottom: 16px;
                    &:last-child {
                        margin-right: 0;
                    }
                }
            }
        }
        .hero-background {
            /* display: none; */
            height: 100vh;
            top: -93px;
            .hero-arrow-left {
                display: none;
            }
            .hero-image-bottom {
                top: unset;
                background-size: 100%;
            }
            .hero-arrow {
                &.hero-arrow-right {
                    /* display: none; */
                    width: 164px;
                    height: 257px;
                    top: 30px;
                    left: 60vw;
                    background-size: contain;
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