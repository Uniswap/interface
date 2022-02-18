import React, {useState, useEffect, useRef} from 'react'
import styled from 'styled-components'
import Layout from './layout/Layout'
import {breakpoints} from './../../utils/theme'
import {TimelineData} from './../../utils/milestones'

import Milestone from './Milestone'
import TimelineControls from './TimelineControls'
import BottomRail from './BottomRail'
import BackgroundBlurTop from './../../assets/images/timeline-assets/background-blur-top.png'
import BackgroundBlur from './../../assets/images/timeline-assets/background-blur.png'

const Timeline = () => {
    const [currentMilestoneGroup, setCurrentMilestoneGroup] = useState([]);
    const [currentMilestonePosition, setCurrentMilestonePosition] = useState(null);
    const [currentMilestoneGroupPosition, setCurrentMilestoneGroupPosition] = useState(null);
    const [isCurrentPost, setIsCurrentPost] = useState(null);
    
    const [stepNumber, setStepNumber] = useState(1);
    const [timelineDirection, setTimelineDirection] = useState(null);
    const [isMobileTimeline, setIsMobileTimeline] = useState(false);

    const timelineContentRef = useRef(null);

    const buildGroup = () => {
        if (!isMobileTimeline) {
            return TimelineData.slice(stepNumber - 1, stepNumber + 6);
        } else {
            return TimelineData.slice(stepNumber -1, stepNumber + 3);
        }
    }

    const handleElementsAnimation = () => {
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

    useEffect(() => {
        window.addEventListener('resize', (e) => {
            setIsMobileTimeline(e.target.innerWidth < 960);
        })
    }, []);

    useEffect(() => {
        setIsMobileTimeline(window.innerWidth < 960);
    }, []);

    useEffect(() => {
        if (!isMobileTimeline && TimelineData.length <= 7) {
            setStepNumber(1)
        }

        if(isMobileTimeline) {
            setStepNumber(2)
        }
    }, [isMobileTimeline]);

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
    }, [isMobileTimeline, stepNumber])

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
        }
    }, [currentMilestoneGroup, 
        currentMilestonePosition, 
        stepNumber]
    )

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
                                key={key}
                                milestoneIndex={key}
                                milestoneData={timelineItem} 
                            />
                        ))}
                    </ul>
                </div>
                <TimelineControls 
                    stepNumber={stepNumber}
                    timelineData={TimelineData}
                    isMobileTimeline={isMobileTimeline}
                    prevStep={prevStep}
                    nextStep={nextStep}
                />
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