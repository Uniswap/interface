import React from 'react'
import styled, { keyframes } from 'styled-components'
import { breakpoints } from '../../utils/theme';

import SwaprTimelineLogo from './../../assets/images/timeline-assets/swapr.svg'

const fadeLeftIn = keyframes`
    0% {transform: translateX(0); opacity: 1;}
    100% {transform: translateX(-64px); opacity: 0;}
`;

const fadeRightIn = keyframes`
    0% {transform: translateX(0); opacity: 1;}
    100% {transform: translateX(64px); opacity: 0;}
`;

const fadeLeftOut = keyframes`
    0% {transform: translateX(-64px); opacity: 0;}
    100% {transform: translateX(0px); opacity: 1;}
`;

const fadeRightOut = keyframes`
    0% {transform: translateX(64px); opacity: 0;}
    100% {transform: translateX(0px); opacity: 1;}
`;

const fadeUpIn = keyframes`
    0% {transform: translateY(0); opacity: 1;}
    100% {transform: translateY(-64px); opacity: 0;}
`;

const fadeDownIn = keyframes`
    0% {transform: translateY(0); opacity: 1;}
    100% {transform: translateY(64px); opacity: 0;}
`;

const fadeUpOut = keyframes`
    0% {transform: translateY(-64px); opacity: 0;}
    100% {transform: translateY(0px); opacity: 1;}
`;

const fadeDownOut = keyframes`
    0% {transform: translateY(64px); opacity: 0;}
    100% {transform: translateY(0px); opacity: 1;}
`;

const Milestone = (props) => {
    let {milestoneData, milestoneIndex} = props
    return (
        <StyledMilestone className={`milestone ${milestoneData.past ? 'past-milestone' : 'future-milestone'}`}>
            <div className="milestone-content" data-aos="fade" data-aos-delay={milestoneIndex * 100}>
                <span className="title">{milestoneData.title}</span>
                <ul className="milestone-features">
                    <div className="feature-list-underlay" />
                    {milestoneData.content.map((contentItem, key2) => (
                        <li className="milestone-feature" key={key2}>
                            {contentItem}
                        </li>
                    ))}
                </ul>
                {milestoneData.releaseTag && (
                    <div className="milestone-logo-container">
                        <div className="milestone-logo">
                            <img className="logo" src={SwaprTimelineLogo} title="Swapr" alt="Swapr"/>
                            <div className="release-tag">
                                {milestoneData.releaseTag}
                            </div>
                        </div>
                    </div>
                )}
                <div className="milestone-line milestone-line-bottom" />
            </div>
            <div className="milestone-pointer"> 
                <div className="milestone-pointer-inner" />
            </div>
        </StyledMilestone>
    )
}

const StyledMilestone = styled.li`
    width: 177px;
    position: relative;
    min-height: 304px;
    @media screen and (max-width: 959px) {
        width: 100%;
        padding-bottom: 40px;
        min-height: unset;
    }
    &:first-child {
        /* background: blue !important; */
        @media screen and (max-width: 959px) {
            &:before {
                height: calc(100% - 24px);
            }
            &:after {
                position: absolute;
                top: -60px;
                height: 60px;
                width: 1px;
                left: -36px;
                content: '';
                background: rgba(135,128,191,0.5);
            }
            &.past-milestone {
                &:after {
                    background: linear-gradient(90.22deg, #3C0FEF 0.62%, #B300FF 105.85%);
                }
            }
        }
    }
    &:nth-child(2) {
        @media screen and (max-width: 959px) {
            margin-bottom: 34px;
        }
        &.past-milestone {
            &:after {
                background: linear-gradient(90.22deg, #3C0FEF 0.62%, #B300FF 105.85%);
            }
            & + .milestone {
                &:after {
                    background: #AB01FE;
                }
            }
        }
        & + .milestone {
            &:after {
                background: rgba(135,128,191,0.5);
            }
        }
        &:after {
            @media screen and (max-width: 959px) {
                position: absolute;
                width: 1px;
                height: 46px;
                background: rgba(135,128,191,0.5);
                content: '';
                left: -36px;
                bottom: -46px;
                transform-origin: 50% 0;
                transform: rotate(-45deg);
            }
        }
    }
    &:nth-child(3) {
        /* background: blue !important; */
        @media screen and (max-width: 959px) {
            margin-top: 74px;
        }
        &:after {
            @media screen and (max-width: 959px) {
                position: absolute;
                content: '';
                width: 1px;
                height: 74px;
                background: rgba(135,128,191,0.5);
                left: -36px;
                top: -75px;
                /* transform-origin: 50% 0; */
                /* transform: rotate(-45deg); */
            }
        }
    }
    &:nth-child(3),
    &:nth-child(4) {
        @media screen and (max-width: 959px) {
            left: 32px;
        }
        .milestone-content {
            @media screen and (max-width: 959px) {
                padding: 0 0 60px;
                position: relative;
            }
        }
        &:before {
            @media screen and (max-width: 959px) {
                bottom: 0;
            }
        }
        .milestone-pointer {
            @media screen and (max-width: 959px) {
                top: 0;
                bottom: 0;
            }
        }
    }
    .milestone-content {
        padding: 0 24px 0 12px;
        /* min-height: 272px; */
        height: 100%;
        display: flex;
        flex-direction: column;
        @media screen and (max-width: 959px) {
            min-height: unset;
            padding-bottom: 60px;
        }
        &.to-right,
        &.to-left,
        &.from-right,
        &.from-left {
            .milestone-line {
                opacity: 0;
            }
        }
        &.to-right {
            animation: ${fadeLeftIn} 0.25s forwards;
            @media screen and (max-width: 959px) {
                animation: ${fadeUpIn} 0.25s forwards;
            }
        }
        &.to-left {
            animation: ${fadeRightIn} 0.25s forwards;
            @media screen and (max-width: 959px) {
                animation: ${fadeDownIn} 0.25s forwards;
            }
        }
        &.from-left {
            animation: ${fadeLeftOut} 0.25s forwards;
            @media screen and (max-width: 959px) {
                animation: ${fadeUpOut} 0.25s forwards;
            }
        }
        &.from-right {
            animation: ${fadeRightOut} 0.25s forwards;
            @media screen and (max-width: 959px) {
                animation: ${fadeDownOut} 0.25s forwards;
            }
        }
        &.hidden {
            opacity: 0;
        }
        .title {
            color: rgba(110, 104, 157, 1);
            font-size: 20px;
            font-weight: 400;
            margin-bottom: 24px;
            display: inline-block;
            color: #B7B5CB;
        }
        .milestone-line {
            height: calc(100%);
            left: -12px;
            width: 1px;
            background: linear-gradient(0deg, #8780BF 0%, rgba(135, 128, 191, 0) 100%);
            /* position: absolute; */
            bottom: 0px;
            position: relative;
            opacity: 1;
            transition: 0.3s ease-in-out opacity;
            @media screen and (max-width: 959px) {
                display: none;
            }
        }
        .milestone-features {
            position: relative;
            .milestone-feature {
                font-size: 12px;
                line-height: 21px;
                color: #B7B5CB;
                font-weight: 200;
                position: relative;
                /* margin-bottom: 4px; */
                z-index: 2;
                &:before {
                    position: absolute;
                    top: 7px;
                    left: -16px;
                    content: '';
                    width: 6px;
                    height: 6px;
                    border-radius: 10px;
                    border: 1px solid rgba(110, 104, 157, 0.4);
                }
            }
            .feature-list-underlay {
                background: #0C0B12;
                height: calc(100% + 12px);
                position: absolute;
                top: 0;
                left: -19px;
                width: 16px;
                z-index: 1;
                transition: ease-in-out 0.25s all;
                @media screen and (max-width: 959px) {
                    display: none;
                }
            }
        }
        .milestone-logo-container {
            position: relative;
            height: 0;
            .milestone-logo {
                margin-top: 12px;
                position: relative;
                .release-tag {
                    font-size: 6px;
                    color: white;
                    font-weight: 700;
                    letter-spacing: 0.2em;
                    padding: 0 3px;
                    margin-top: 3px;
                    border: 1px solid rgba(46, 23, 242, 1);
                    border-radius: 4px;
                    width: fit-content;
                    margin-left: 24px;
                    height: 12px;
                    background: #1B1C27;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            }
        }
    }
    .milestone-pointer {
        width: 24px;
        height: 24px;
        bottom: -12px;
        left: -12px;
        border-radius: 24px;
        border: 1px solid rgba(200, 194, 255, 1);
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        transition: ease-in-out 0.25s all;
        background: black;
        @media screen and (max-width: 959px) {
            bottom: unset;
            top: 0;
            left: -48px;
        }
        .milestone-pointer-inner {
            width: 10px;
            height: 10px;
            background: rgba(255, 255, 255, 1);
            border-radius: 10px;
            box-shadow: 0 0 20px 2px white;
            transition: ease-in-out 0.25s all;
        }
    }
    &:before {
        content: '';
        position: absolute;
        bottom: 0;
        height: 2px;
        width: 100%;
        left: 0;
        background: rgba(135, 128, 191, 0.5);
        @media screen and (max-width: 959px) {
            height: 100%;
            width: 1px;
            left: -36px;
        }
    }
    &.past-milestone {
        .milestone-content {
            .title {
                color: #6E689D;
            }
            .milestone-features {
                .milestone-feature {
                    color: #6E689D;
                }
            }
        }
        .milestone-pointer {
            border-color: rgba(135, 128, 191, 1);
            .milestone-pointer-inner {
                background: rgba(197, 194, 223, 1);
                box-shadow: unset;
            }
        }
        .milestone-line {
            background: rgba(135, 128, 191, 0.25);
        }
        &:after,
        &:before {
            background: linear-gradient(90.22deg, #3C0FEF 0.62%, #B300FF 105.85%) !important;
        }
        /* &:before {
            background: linear-gradient(90deg, rgba(60, 15, 239, 1),rgba(179, 0, 255, 1));
        } */
    }
    &:nth-child(4) {
        &:before {
            @media screen and (min-width: 959px) {
                transform-origin: 0 50%;
                transform: rotate(17.6deg);
                width: calc(100% + 9px);
            }
            @media screen and (min-width: ${breakpoints.l}) {
                transform: rotate(18deg);
            }
        }
    }
    &:nth-child(7) {
        position: relative;
        &:after {
            position: absolute;
            width: 1000px;
            height: 2px;
            background: rgba(135,128,191,0.5);
            left: 100%;
            content: '';
            top: calc(100% + 54px);
        }
    }
    &:nth-child(5),
    &:nth-child(6),
    &:nth-child(7) {
        position: relative;
        .milestone-content {
            padding: 92px 0 0;
            position: absolute;
            top: calc(100% + 60px);
        }
        &:before {
            bottom: -56px;
        }
        .milestone-pointer {
            bottom: -66px;
        }
        .milestone-line {
            height: 80px;
            left: 0px;
            width: 1px;
            position: absolute;
            top: 0;
            background: linear-gradient(180deg, #8780BF 0%, rgba(135, 128, 191, 0) 100%);
        }
    }
`;

export default Milestone;