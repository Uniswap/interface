import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import { gradients } from '../../utils/theme'
import { CommunityLinksContent } from '../../utils/ui-constants'
import { breakpoints } from '../../utils/theme'
import Layout from './layout/Layout'
import Button from './common/Button'

import CommunityGradient from './../../assets/images/community-gradient.png'


const CommunityLinks = () => {
    return (
        <StyledCommunityLinks data-aos={'fade-up'} id={'community-links'} width={'full-width'}>
            <div className="community-gradient" />
            <Layout 
                data-aos={'fade-up'} 
                id={'community-links'} 
                width={'main-width'}
            >
                <span className="pre-header">
                    {CommunityLinksContent.preHeader}
                </span>
                <h2>
                    {CommunityLinksContent.title}
                </h2>
                <ul>
                    {CommunityLinksContent.links.map((link, key) => (
                        <li key={key}>
                            <div className="logo-container">
                                <img className='logo' src={link.image} alt={link.alt} title={link.title}/>
                            </div>
                            <div className='content'>
                                {link.content}
                            </div>
                            <Button
                                type='dark-outline'
                                label={link.button.label}
                                to={link.button.href}
                                size={'small'}
                            />
                        </li>
                    ))}
                </ul>
            </Layout>
        </StyledCommunityLinks>
    )
}

const StyledCommunityLinks = styled(Layout)`
    position: relative;
    &#community-links {
        text-align: center;
        margin-bottom: 240px;
        .pre-header {
            font-size: 20px;
            line-height: 30px;
            margin-bottom: 16px;
            color: ${(props) => (props.theme.gray)};
        }
        h2 {
            font-size: 49px;
            line-height: 63px;
            font-weight: 500;
            background: ${gradients.heroMainText};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 84px;
        }
        ul {
            display: flex;
            justify-content: center;
            li {
                margin: 0 52px;
                width: 180px;
                .logo-container {
                    height: 104px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    padding-bottom: 44px;
                    position: relative;
                    &:after {
                        height: 3px;
                        width: 42px;
                        background: ${gradients.cta};
                        position: absolute;
                        content: '';
                        bottom: 0;
                        left: calc(50% - 21px);
                    }
                }
                .content {
                    margin: 40px auto 24px;
                    color: ${(props) => (props.theme.gray)};
                    font-size: 16px;
                    line-height: 24px;
                    font-weight: 200;

                }
                .button {
                    a {
                        width: fit-content;
                    }
                }
            }
        }
        @media screen and (max-width: ${breakpoints.md}) {
            .community-gradient {
                background: url(${CommunityGradient});
                width: 100vw;
                height: 2000px;
                background-size: 100%;
                position: absolute;
                background-repeat: no-repeat;
                top: -600px;
                left: 0;
                pointer-events: none;
            }
            .pre-header {
                font-size: 18px;
            }
            h2 {
                font-size: 31px;
                /* width: 300px; */
                margin-left: auto;
                margin-right: auto;
                line-height: 31px;
                margin-top: 16px;
            }
            ul {
                flex-direction: column;
                align-items: center;
                li {
                    width: 100%;
                    margin-bottom: 66px;
                    .logo-container {
                        height: 154px;
                        .logo {
                            max-width: 96px;
                            max-height: 72px;
                        }
                    }
                    .content {
                        width: 230px;
                    }
                }
            }
        }
    }
`;

export default CommunityLinks;