import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import { mainNavigation } from '../../utils/ui-constants'
import Layout from './Layout'
import Button from './../common/Button'
import { scrollTo } from './../../utils/helper-functions.js'
import { breakpoints } from '../../utils/theme'

import SwaprLogo from './../../images/swapr-logo.svg'
import CloseIcon from './../../images/close-icon.png'
import HamburgerIcon from './../../images/hamburger-icon.svg'
import GradientImageTop from './../../images/gradient-mobile-nav-top.png'
import GradientImageBottom from './../../images/gradient-mobile-nav-bottom.png'

const MainNavigation = () => {

    const [isOpen, setIsOpen] = useState(false);

    // Remove scroll when using Mobile Navbar
    useEffect(() => {
        let html = document.getElementsByTagName('html')[0];
        html.style.overflowY = isOpen ? 'hidden' : 'unset'
    }, [isOpen]);

    return (
        <StyledMainNavigation>
            <Layout width="main-width" className="inner-navigation">
                <a className="swapr-logo" href="/" title="Swapr | Home">
                    <img 
                        className="swapr-logo-image" 
                        src={SwaprLogo} 
                        alt="Swapr Logo" 
                        title="Swapr"
                    />
                </a>
                <nav className="desktop-navigation">
                    <ul>
                        {mainNavigation.map((navigationItem, key) => (
                            <li key={key} className={`${navigationItem.cta ? 'cta' : 'regular'}`}>
                                {navigationItem.cta && (
                                    <Button size={'small'} label={navigationItem.label}/>
                                )}
                                {navigationItem.href && !navigationItem.cta && (
                                    <a 
                                        href={navigationItem.href && navigationItem.href}
                                    >
                                        {navigationItem.label}
                                    </a>
                                )}
                                {navigationItem.targetId && (
                                    <a onClick={() => {scrollTo(navigationItem.targetId)}}
                                    >
                                        {navigationItem.label}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
                <button className="mobile-nav-toggle" onClick={() => {
                    setIsOpen(!isOpen);
                }}>
                    <div className={`hamburguer-icon ${isOpen ? 'open' : ''}`}>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                <nav className={`mobile-navigation ${isOpen ? 'open' : ''}`}>
                    <img src={GradientImageTop} className="gradient-image mobile-gradient-top"/>
                    <img src={GradientImageBottom} className="gradient-image mobile-gradient-bottom"/>
                    <ul>
                        {mainNavigation.map((navigationItem, key) => (
                            <li key={key} className={`${navigationItem.cta ? 'cta' : 'regular'}`}>
                                {navigationItem.cta ? (
                                    <Button size={'small'} label={navigationItem.label}/>
                                ) : (
                                    <a 
                                        href={navigationItem.href && navigationItem.href }
                                        onClick={
                                            () => {
                                                setIsOpen(false);
                                                scrollTo(navigationItem.targetId)}
                                        }
                                        >{navigationItem.label}</a>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </Layout>
        </StyledMainNavigation>
    )
}

const StyledMainNavigation = styled(Layout)`
    height: 136px;
    z-index: 100;

    .inner-navigation {
        display: flex;
        justify-content: space-between;
        height: 100%;
        align-items: center;
        .swapr-logo {
            .swapr-logo-image {
                width: 113px;
            }
        }
        nav.desktop-navigation {
            ul {
                display: flex;
                align-items: center;
                li {
                    margin-left: 48px;
                    cursor: pointer;
                    &.regular {
                        a {
                            opacity: 0.7;
                        }
                    }
                    a {
                        transition: 0.25s ease-in-out opacity;
                        font-weight: 400;
                        letter-spacing: 0.85px;
                        &:hover {
                            opacity: 1;
                        }
                    }
                }
            }
        }
        .mobile-nav-toggle,
        .swapr-logo {
            z-index: 200;
        }
        .mobile-nav-toggle {
            display: none;
            background: none;
            border: 0;
            outline: 0;
            .hamburguer-icon {
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                cursor: pointer;
                &.open {
                    span {
                        transform: translateY(-5px) translateX(4px) rotate(45deg);
                        &:last-child {
                            transform: translateY(5px) translateX(4px) rotate(-45deg);
                        }
                    }
                }
                span {
                    width: 100%;
                    height: 2px;
                    background: white;
                    display: inline-block;
                    margin: 0;
                    transform-origin: 0 50%;
                    transition: 0.25s ease-in-out transform;
                    &:last-child {
                        position: relative;
                        top: 8px;
                    }
                }
            }
        }
        nav.mobile-navigation {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(12, 11, 18, 1);
            pointer-events: none;
            opacity: 0;
            transition: 0.35s ease-in-out;
            display: flex;
            flex-direction: column;
            padding: 100px 24px 49px;
            .gradient-image {
                position: absolute;
                pointer-events: none;
                &.mobile-gradient-top {
                    top: 0;
                    right: 0;
                }
                &.mobile-gradient-bottom {
                    top: 180px;
                    left: 0;
                }
            }
            ul {
                height: 100%;
                display: flex;
                flex-direction: column;
                position: relative;
                top: 200px;
                transition: 0.5s ease-in-out top;
                .cta {
                    margin-top: auto;
                    margin-bottom: 100px;
                }
                .regular {
                    padding: 24px 0;
                    font-size: 20px;
                    line-height: 24px;
                    position: relative;
                    &:before {
                        content: '';
                        position: absolute;
                        left: 0;
                        bottom: 0;
                        height: 1px;
                        width: 100%;
                        background: linear-gradient(90deg, rgba(135, 128, 191, 0) 0%, #8780BF 51.04%, rgba(135, 128, 191, 0) 100%);
                    }
                }
            }
            &.open {
                opacity: 1;
                top: 0;
                pointer-events: unset;
                ul {
                    top: 0;
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.l}) {
        /* flex-direction: column; */
        width: 928px;
        margin: 0 auto;
        .inner-navigation {
            width: 100% !important;
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        /* flex-direction: column; */
        height: 93px;
        padding: 0 24px;
        width: 100%;
        .desktop-navigation {
            display: none;
        }
        .mobile-nav-toggle {
            display: block !important;
        }
    }
    @media screen and (max-width: ${breakpoints.s}) {
        padding: 0;
    }
`;

export default MainNavigation;