import React from 'react';
import styled from 'styled-components'
import NavigationButton from './../../assets/images/timeline-assets/navigation-button.png'


const TimelineControls = (props) => {
    return (
        <StyledTimelineControls className="timeline-controls">
            <div 
                disabled={props.stepNumber <= 1}
                onClick={(e) => {
                    props.prevStep();
                }} 
                className="timeline-navigation-button left" 
            />
            <div 
                disabled={props.stepNumber > 
                    props.timelineData.length - (
                        !props.isMobileTimeline ? 7 : 4
                    )
                }
                onClick={(e) => {
                    props.nextStep();
                }} 
                className="timeline-navigation-button right" 
            />
        </StyledTimelineControls>
    )
}

const StyledTimelineControls = styled.div`
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
                opacity: 0.3;
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
`;

export default TimelineControls;