import React from 'react'
import styled from 'styled-components'
import { breakpoints } from '../../utils/theme'

const BottomRail = (props) => {
    return (
        <>
            <StyledBottomRail className={`bottom-rail-container ${
                    props.isCurrentPost ? 
                        'future-steps-' + (8 - props.currentMilestoneGroupPosition) : 
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
            </StyledBottomRail>
            <div className="bottom-rail-image" data-aos="fade"/>
        </>
    )
}

const StyledBottomRail = styled.section`
    display: flex;
    width: 100%;
    justify-content: center;
    position: absolute;
    bottom: -390px;
    left: 0;
    @media screen and (max-width: ${breakpoints.l}) {
        top: 640px;
    }
    @media screen and (max-width: ${breakpoints.md}) {
        display: none;
    }
    &.future-steps-7, &.is-prev {
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
`;

export default BottomRail;