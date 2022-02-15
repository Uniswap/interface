import React from 'react'
import styled from 'styled-components'
import { FooterContent } from './../../../utils/ui-constants'
import { breakpoints } from './../../../utils/theme'
import { scrollTo } from './../../../utils/helper-functions';
import Layout from './Layout'
import NavigationButton from './../../../assets/images/timeline-assets/navigation-button.png'

import SwaprLogo from './../../../assets/images/swapr-logo.svg'

const Footer = () => {
    return (
        <StyledFooter id="footer" width="main-width">
            <div className="footer-top">
                <img src={SwaprLogo} alt="Swapr"/>
            </div>
            <div className="footer-content">
                <ul className="footer-column-list">
                    {FooterContent.linkColumns.map((column, key) => (
                        <li key={key} className="footer-column">
                            <h4>{column.title}</h4>
                            <ul className="footer-link-list">
                                {column.footerLinks.map((link, key) => (
                                    <li key={key}className="footer-link-item">
                                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
                <div className="cta-container">
                    <div 
                        onClick={(e) => {
                            scrollTo('app-wrapper')
                        }} 
                        className="timeline-navigation-button up" 
                    />
                </div>
            </div>
        </StyledFooter>
    )
}

const StyledFooter = styled(Layout)`
    &#footer {
        display: flex;
        flex-direction: column;
        /* margin-bottom: 80px; */
        position: relative;
        .footer-top {
            margin-bottom: 42px;
            position: absolute;
            top: -12px;
            img {
                width: 113px;
            }
        }
        .footer-content {
            display: flex;
            position: relative;
            padding-bottom: 42px;
            .footer-column-list {
                display: flex;
                margin-left: auto;
                .footer-column {
                    width: 194px;
                    h4 {
                        font-size: 16px;
                        margin-bottom: 20px;
                        font-weight: 400;
                    }
                    .footer-link-list {
                        .footer-link-item {
                            margin-bottom: 12px;
                            font-size: 14px;
                            line-height: 22px;
                            font-weight: 200;
                            opacity: 0.5;
                            transition: 0.25s ease-in-out opacity;
                            &:hover {
                                opacity: 1;
                            }
                        }
                    }
                }
            }
            .cta-container {
                display: flex;
                align-items: center;
                height: 32px;
                .timeline-navigation-button {
                    width: 56px;
                    height: 56px;
                    background-image: url('${NavigationButton}');
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: contain;
                    cursor: pointer;
                    transition: ease-in-out 0.1s all;
                    transform: rotate(90deg);
                    &[disabled] {
                        opacity: 0;
                        pointer-events: none;
                    }
                    &:active {
                        transform: rotate(90deg) scale(0.9);
                    }
                }
            }
            &:after {
                content: '';
                position: absolute;
                bottom: 0;
                height: 1px;
                width: 100%;
                background: linear-gradient(270deg, rgba(135, 128, 191, 0) 0.56%, #8780BF 51.32%, rgba(135, 128, 191, 0) 100%);
            }
        }
        @media screen and (max-width: ${breakpoints.l}) {
            width: 928px;
            .footer-content {
                .footer-column-list {
                    .footer-column {
                        width: 152px;
                    }
                }
            }
        }
        @media screen and (max-width: ${breakpoints.md}) {
            .footer-top {
                position: unset;
            }
            .footer-content {
                flex-direction: column;
                .footer-column-list {
                    margin-left: 0;
                    /* margin-bottom: 80px; */
                    flex-wrap: wrap;
                    .footer-column {
                        width: 50%;
                        margin-bottom: 80px;
                    }
                }
                .cta-container {
                    .button {
                        width: fit-content;
                    }
                    .timeline-navigation-button {
                        margin-bottom: 72px;
                    }
                }
            }
        }
    }
`;

export default Footer;