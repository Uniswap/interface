import React, {useState, useEffect, useRef} from 'react'
import styled, {keyframes} from 'styled-components'
import Layout from './layout/Layout'
import {breakpoints} from './../../utils/theme'
import {TimelineData} from './../../utils/milestones'

import NavigationButton from './../../assets/images/timeline-assets/navigation-button.png'
import BackgroundBlurTop from './../../assets/images/timeline-assets/background-blur-top.png'
import BackgroundBlur from './../../assets/images/timeline-assets/background-blur.png'
// import NavigationButton from './../../assets/images/timeline-assets'

const Timeline = () => {
    const [currentMilestoneGroup, setCurrentMilestoneGroup] = useState([]);
    const [currentMilestonePosition, setCurrentMilestonePosition] = useState(null);
    const [currentMilestoneGroupPosition, setCurrentMilestoneGroupPosition] = useState(null);
    const [isCurrentPost, setIsCurrentPost] = useState(null);
    
    const [stepNumber, setStepNumber] = useState(2);
    const [timelineDirection, setTimelineDirection] = useState(null);

    const timelineContentRef = useRef(null);

    useEffect(() => {
        let newGroup = buildGroup();
        setCurrentMilestoneGroup(newGroup);

        for (let i = 0; i < TimelineData.length; i++) {
            // console.log(TimelineData[i])
            if (TimelineData[i].current) {
                setCurrentMilestonePosition(i + 1);
                return; 
            }
        }
    }, [])

    useEffect(() => {
        handleElementsAnimation()
    }, [stepNumber]);

    useEffect(() => {
        for (let i = 0; i < currentMilestoneGroup.length; i++) {
            // console.log(currentMilestoneGroup[i])
            if (currentMilestoneGroup[i].current) {
                setCurrentMilestoneGroupPosition(i + 1)
                return; 
            } else {
                if (currentMilestonePosition < stepNumber) {
                    setIsCurrentPost(false)
                } else {
                    setIsCurrentPost(true)
                }
            }
            setCurrentMilestoneGroupPosition(8)
        }
    }, [currentMilestoneGroup])

    const buildGroup = () => {
        return TimelineData.slice(stepNumber - 1, stepNumber + 6);
    }

    const handleElementsAnimation = (callback) => {
        const milestones = timelineContentRef.current.querySelectorAll('.milestone');
        milestones.forEach((el) => {
            const animableElements = el.querySelector('.milestone-content');
            let newGroup = buildGroup()
            if (timelineDirection != null) {
                animableElements.classList.add(`to-${timelineDirection}`);
                setTimeout(() => {
                    animableElements.classList.remove(`to-${timelineDirection}`)
                    setCurrentMilestoneGroup(newGroup);
                    animableElements.classList.add(`from-${timelineDirection}`)
                }, 250)
                
                setTimeout(() => {
                    animableElements.classList.remove(`from-${timelineDirection}`)
                }, 500)
            }
            
        })
        
        setTimelineDirection(null)
    }

    const prevStep = () => {
        setTimelineDirection('left');
        setStepNumber(stepNumber - 1)
    }
    
    const nextStep = () => {
        setTimelineDirection('right');
        setStepNumber(stepNumber + 1)
    }

    
    return (
        <StyledTimeline width={'full-width'}>
            <div className="background-blur-top"></div>
            <div className="background-blur-bottom"></div>
            <div className="timeline">
                <div className="mobile-title">
                    Swapr <br/>Roadmap
                </div>
                <div className="timeline-content" ref={timelineContentRef}>
                    <ul className="timeline-milestones">
                        {currentMilestoneGroup.map((timelineItem, key) => (
                            <li key={key} className={`milestone ${timelineItem.past ? 'past-milestone' : 'future-milestone'}`}>
                                <div className="milestone-content" data-aos="fade" data-aos-delay={key * 100}>
                                    <span className="title">{timelineItem.title}</span>
                                    <ul className="milestone-features">
                                        <div className="feature-list-underlay" />
                                        {timelineItem.content.map((contentItem, key2) => (
                                            <li className="milestone-feature" key={key2}>
                                                {contentItem}
                                            </li>
                                        ))}
                                    </ul>
                                    {timelineItem.logo && (
                                        <div className="milestone-logo-container">
                                            <div className="milestone-logo">
                                                <img className="logo" src={'/timeline-logos/' + timelineItem.logo} title="Swapr" />
                                                <div className="release-tag">
                                                    {timelineItem.releaseTag}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="milestone-line milestone-line-bottom" />
                                </div>
                                <div className="milestone-pointer"> 
                                    <div className="milestone-pointer-inner" />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="timeline-controls">
                    <div 
                        disabled={stepNumber <= 1}
                        onClick={(e) => {
                            prevStep();
                        }} 
                        className="timeline-navigation-button left" 
                    />
                    <div 
                        disabled={stepNumber > TimelineData.length - 7}
                        onClick={(e) => {
                            nextStep();
                        }} 
                        className="timeline-navigation-button right" 
                    />
                </div>
                <div className="timeline-text">
                    <span data-aos="fade">Swapr Roadmap</span>
                </div>
            </div>
            <div className={`bottom-rail-container ${
                isCurrentPost ? 
                    'future-steps-' + (8 - currentMilestoneGroupPosition) : 
                    'is-prev'
                }`}>
                <div className="bottom-rail">
                    <div className="rail">
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div className="rail-active">
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            </div>
            <div className="bottom-rail-image" data-aos="fade"/>
        </StyledTimeline>
    )
}

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

const StyledTimeline = styled(Layout)`
    position: relative;
    .bottom-rail-container {
        display: flex;
        width: 100%;
        justify-content: center;
        position: absolute;
        bottom: -390px;
        left: 0;
        @media screen and (max-width: ${breakpoints.md}) {
            display: none;
        }
        &.active {
            
        }
        &.future-steps-7, &.is-prev {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: calc(50%);
                        right: calc(50% + 90px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 89px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-6 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: calc(177px * 2);
                        right: calc(50% + 92px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 89px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-5 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: 177px;
                        right: calc(50% + 90px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 89px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-4 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: 0;
                        right: calc(50% + 92px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 89px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-3 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: 0;
                        right: calc(50% + 92px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:nth-child(2) {
                        transform: rotate(18deg) scaleX(0) !important;
                        /* right: calc(50% - 89px); */
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 89px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-2 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: 0;
                        right: calc(50% + 92px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:nth-child(2) {
                        transform: rotate(18deg) scaleX(0) !important;
                        /* right: calc(50% - 89px); */
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 277px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-1 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: 0;
                        right: calc(50% + 92px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:nth-child(2) {
                        transform: rotate(18deg) scaleX(0) !important;
                        /* right: calc(50% - 89px); */
                    }
                    &:last-child {
                        height: 5px;
                        width: calc(50% - 437px);
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        &.future-steps-0 {
            /* background: white; */
            .rail-active {
                div { 
                    &:first-child {
                        height: 5px;
                        width: 0;
                        right: calc(50% + 92px);
                        top: 1px;
                        background: linear-gradient(90deg, #3B0DEF, #6B09F5);
                    }
                    &:nth-child(2) {
                        transform: rotate(18deg) scaleX(0) !important;
                        /* right: calc(50% - 89px); */
                    }
                    &:last-child {
                        height: 5px;
                        width: 0;
                        right: 0;
                        top: 60px;
                        background: linear-gradient(-90deg, #A702FD, #6B09F5);
                    }
                }
            }
        }
        .bottom-rail {
            min-width: 1680px;
            height: 65px;
            .rail {
                div {
                    position: absolute;
                    &:first-child {
                        width: calc(50% - (180px / 2));
                        height: 5px;
                        background: rgba(135, 128, 191, 0.1);
                        top: 0;
                        left: 0;
                    }
                    &:nth-child(2) {
                        left: calc(50% - (180px / 2));
                        height: 5px;
                        background: rgba(135, 128, 191, 0.1);
                        top: 0;
                        width: 190px;
                        transform-origin: 0 50%;
                        transform: rotate(18deg);

                    }
                    &:last-child {
                        width: calc(50% - (180px / 2));
                        height: 5px;
                        background: rgba(135, 128, 191, 0.1);
                        top: 60px;
                        right: 0;
                    }
                }
            }
            .rail-active {
                div {
                    height: 5px;
                    position: absolute;
                    position: absolute;
                    transition: 0.25s ease-in-out all;
                    &:first-child {
                        /* width: calc(50% - 320px); */
                        /* background: white; */
                    }
                    &:nth-child(2) {
                        height: 5px;
                        transform-origin: 100% 50%;
                        transform: rotate(18deg);
                        top: 30px;
                        background: white;
                        height: 5px;
                        width: 193px;
                        right: calc(50% - 90px);
                        top: 60px;
                        background: #6B09F5;
                    }
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.l}) {
        display: flex;
        .timeline {
            transform: scale(0.8);
            transform-origin: 50% 50%;
            margin-bottom: 360px !important;
        }
        .bottom-rail-container {
            top: 640px;
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        display: unset;
        .timeline {
            transform: scale(1);
        }
    }
    .background-blur-top {
        background-image: url('${BackgroundBlurTop}');
        width: 961px;
        height: 821px;
        position: absolute;
        top: -80px;
        right: 0;
        @media screen and (max-width: 959px) {
            top: -600px;
        }
    }
    .background-blur-bottom {
        width: 853px;
        height: 821px;
        background-image: url('${BackgroundBlur}');
        position: absolute;
        top: 400px;
        left: 0;
        @media screen and (max-width: 959px) {
            display: none;
        }
    }
    .timeline {
        width: 1235px;
        padding: 96px 0;
        margin: 0 auto 590px;
        position: relative;
        @media screen and (max-width: 959px) {
            width: 238px;
            padding: 0;
            margin: 0 auto 180px;
            
        }
        .mobile-title {
            text-align: left;
            display: none;
            font-size: 31px;
            line-height: 38px;
            background: linear-gradient(270deg, #FFFFFF 1.98%, #DCD8FE 95.72%);;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 600;
            position: absolute;
            top: -200px;
            left: -52px;
            @media screen and (max-width: 959px) {
                display: unset;
            }

        }
        .timeline-navigation-button {
            position: absolute;
        }
        .timeline-milestones {
            width: inherit;
            display: flex;
            position: relative;
            @media screen and (max-width: 959px) {
                flex-direction: column;
            }
            .milestone {
                width: 177px;
                position: relative;
                min-height: 264px;
                @media screen and (max-width: 959px) {
                    width: 100%;
                    padding-bottom: 40px;
                    min-height: unset;
                }
                &:first-child,
                &:nth-child(2),
                &:last-child {
                    @media screen and (max-width: 959px) {
                        display: none;
                    }
                }
                /* FIRST CHILD ON MOBILE VIEW */
                &:nth-child(3) {
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
                &:nth-child(4) {
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
                &:nth-child(5) {
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
                &:nth-child(5),
                &:nth-child(6),
                &:nth-child(7) {
                    position: relative;
                    @media screen and (max-width: 959px) {
                        left: 32px;
                    }
                    .milestone-content {
                        padding: 92px 0 0;
                        position: absolute;
                        top: calc(100% + 60px);
                        @media screen and (max-width: 959px) {
                            padding: 0 0 60px;
                            position: relative;
                        }
                    }
                    &:before {
                        bottom: -56px;
                        @media screen and (max-width: 959px) {
                            bottom: 0;
                        }
                    }
                    .milestone-pointer {
                        bottom: -66px;
                        @media screen and (max-width: 959px) {
                            top: 0;
                            bottom: 0;
                        }
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
            }
        }
        .timeline-controls {
            position: absolute;
            top: calc(100% - 124px);
            width: 100%;
            @media screen and (max-width: 959px) {
                height: 100%;
                top: 0;
            }
            .timeline-navigation-button {
                width: 56px;
                height: 56px;
                position: absolute;
                top: 0;
                background-image: url('${NavigationButton}');
                background-position: center;
                background-repeat: no-repeat;
                background-size: contain;
                cursor: pointer;
                transition: ease-in-out 0.1s all;
                &[disabled] {
                    opacity: 0.5;
                    pointer-events: none;
                }
                &:active {
                    transform: scale(0.9);
                }
                &.left {
                    left: -76px;
                    @media screen and (max-width: 959px) {
                        left: -64px;
                        top: -100px;
                        transform: rotate(90deg);
                    }
                }
                &.right {
                    right: -42px;
                    transform: rotate(180deg);
                    top: 56px;
                    @media screen and (max-width: 959px) {
                        left: -34px;
                        bottom: -40px;
                        top: unset;
                        transform: rotate(-90deg);
                    }
                    &:active {
                        transform: rotate(180deg) scale(0.9);
                        @media screen and (max-width: 959px) {
                            transform: rotate(-90deg) scale(0.9);
                        }
                    }
                }
                /* filter: drop-shadow(0px 0px 10px #703FFF); */
            }
        }
        .timeline-text {
            position: absolute;
            bottom: -120px;
            span {
                font-weight: 500;
                font-size: 49px;
                line-height: 64px;
                background: linear-gradient(270deg, #FFFFFF 1.98%, #DCD8FE 95.72%);;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                @media screen and (max-width: 959px) {
                    display: none;
                }
            }
        }
    }
`;

export default Timeline;