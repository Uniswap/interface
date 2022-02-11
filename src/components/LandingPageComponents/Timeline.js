import React, {useState, useEffect, useRef} from 'react'
import styled from 'styled-components'
import Layout from './layout/Layout'
import {breakpoints} from './../../utils/theme'
import {TimelineData} from './../../utils/milestones'

import Milestone from './Milestone'
import BottomRail from './BottomRail'
import NavigationButton from './../../assets/images/timeline-assets/navigation-button.png'
import BackgroundBlurTop from './../../assets/images/timeline-assets/background-blur-top.png'
import BackgroundBlur from './../../assets/images/timeline-assets/background-blur.png'

const Timeline = () => {
    const [currentMilestoneGroup, setCurrentMilestoneGroup] = useState([]);
    const [currentMilestonePosition, setCurrentMilestonePosition] = useState(null);
    const [currentMilestoneGroupPosition, setCurrentMilestoneGroupPosition] = useState(null);
    const [isCurrentPost, setIsCurrentPost] = useState(null);
    
    const [stepNumber, setStepNumber] = useState(1);
    const [timelineDirection, setTimelineDirection] = useState(null);

    const timelineContentRef = useRef(null);

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
        
        setTimelineDirection(null);
    }

    const prevStep = () => {
        setTimelineDirection('left');
        setStepNumber(stepNumber - 1)
    }
    
    const nextStep = () => {
        setTimelineDirection('right');
        setStepNumber(stepNumber + 1)
    }

    useEffect(() => {
        let newGroup = buildGroup();
        setCurrentMilestoneGroup(newGroup);

        for (let i = 0; i < TimelineData.length; i++) {
            if (TimelineData[i].current) {
                setCurrentMilestonePosition(i + 1);
                return; 
            }
        }
        // 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        handleElementsAnimation()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        for (let i = 0; i < currentMilestoneGroup.length; i++) {
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
    }, [currentMilestoneGroup, currentMilestonePosition, stepNumber])

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
                            <Milestone 
                                milestoneIndex={key}
                                milestoneData={timelineItem} 
                            />
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
            <BottomRail 
                isCurrentPost={isCurrentPost}
                currentMilestoneGroupPosition={currentMilestoneGroupPosition}
            />
        </StyledTimeline>
    )
}

const StyledTimeline = styled(Layout)`
    position: relative;
    @media screen and (max-width: ${breakpoints.l}) {
        display: flex;
        .timeline {
            transform: scale(0.8);
            transform-origin: 50% 50%;
            margin-bottom: 360px !important;
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
                    opacity: 0;
                    pointer-events: none;
                    @media screen and (max-width: 959px) {
                        /* opacity: 0.5; */
                    }
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