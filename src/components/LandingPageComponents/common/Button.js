import React from "react"
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { gradients, breakpoints } from "../../../utils/theme";

const Button = (props) => {
    const {
        to, 
        label, 
        type, 
        size, 
        dataAOS, 
        dataAOSDelay, 
        iconImage, 
        title, 
        className,
        onClick,
        external,
        elementTag} = props;

    return (
        <StyledButtonWrapper 
            data-aos={dataAOS} 
            data-aos-delay={dataAOSDelay}
            className={`button ${type} ${size} ${className}`}
        >
            <a href={to && to} onClick={onClick && onClick} title={title} target={external ? '_blank' : ''}>
                {type == 'dark' && (
                    <>
                        <svg width="0" height="0">
                            <linearGradient id="button-grad" x1="0" x2="0" y1="100%" y2="0">
                                <stop offset="0%"/>
                                <stop offset="50%"/>
                                <stop offset="100%"/>
                            </linearGradient>
                            <symbol id="button-border" overflow="visible">
                                <rect width="100%" height="100%" rx={'25'} ry={'25'}/>
                            </symbol>
                        </svg>
                        <svg className="button-border">
                            <use href="#button-border"/>
                        </svg>
                    </>
                )}
                {type == 'dark-outline' && (
                    <>
                        <svg width="0" height="0">
                            <linearGradient id="button-grad-dark-outline" x1="0%" x2="100%">
                                <stop offset="0%"/>
                                <stop offset="50%"/>
                                <stop offset="100%"/>
                            </linearGradient>
                            <symbol id="button-border-dark-outline" overflow="visible">
                                <rect width="100%" height="100%" rx={'20'} ry={'20'}/>
                            </symbol>
                        </svg>
                        <svg className="button-border-dark-outline"><use href="#button-border-dark-outline"/></svg>
                    </>
                )}
                {type != 'icon' ? (
                    <>
                        <span className="label">{label}</span>
                        <span className="default-background"></span>
                        <span className="active-background"></span>
                        <span className="hover-background"></span>
                    </>
                ) : (
                    <img src={iconImage}/>
                )}
            </a>
        </StyledButtonWrapper>
    )
};

Button.propTypes = {
    type: PropTypes.oneOf(['primary', 'secondary', 'outline', 'icon', 'dark','dark-outline']),
    size: PropTypes.oneOf(['regular', 'small']),
    label: PropTypes.string,
    iconImage: PropTypes.string,
    title: PropTypes.string,
    className: PropTypes.string,
    elementTag: PropTypes.oneOf(['a', 'button'])
};

Button.defaultProps = {
    type: 'primary',
    size: 'regular',
    className: '',
    elementTag: 'a'
}

const StyledButtonWrapper = styled.div`
    a {
        cursor: pointer;
        /* opacity: 0.8; */
        transition: 0.35s ease-in-out opacity;
        &:hover {
            opacity: 1;
        }
    }
    &:not(.icon) a {
        height: 52px;
        display: inline-block;
        padding: 0 40px;
        line-height: 52px;
        white-space: nowrap;
        border-radius: 35px;
        color: white;
        font-size: 12px;
        text-transform: uppercase;
        font-weight: 300;
        letter-spacing: 0.85px;
        position: relative;
        z-index: 3;
        transition: 0.35s ease-in-out all;
        width: 100%;
        text-align: center;
        @media screen and (max-width: ${breakpoints.md}) {
            height: 36px;
            line-height: 36px;
            padding: 0 26px;
            font-size: 10px;
        }
        &:hover {
            .hover-background {
                opacity: 1;
            }
        }
        &:active {
            .active-background {
                opacity: 1;
            }
        }
        .default-background,
        .active-background,
        .hover-background {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            border-radius: 35px;
            transition: 0.35s ease-in-out all;
        }
        .active-background,
        .hover-background {
            opacity: 0;
        }
        .label {
            position: relative;
            z-index: 3;
        }
        /* Button Shadows */
        &:after,
        &:before {
            position: absolute;
            content: '';
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 35px;
        }
    }
    &.small a {
        height: 36px;
        line-height: 36px;
        font-size: 10px;
        padding: 0 26px;
    }
    &.primary a {
        .label {
            background: ${gradients.primaryLabel};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .default-background {
            /* background: linear-gradient(226.37deg, #FF9833 15.42%, #FF5B67 95.96%); */
            background: ${gradients.primary};
            z-index: 0;
        }
        .hover-background {
            box-shadow: 0px 0px 36px 0px rgba(65, 0, 255, 3);
            z-index: 1;
        }
        .active-background {
            /* background: linear-gradient(226.37deg, #FF6433 15.42%, #FF5B67 95.96%);
            z-index: 2; */
        }
        /* &:after {
            box-shadow: 2px -2px 20px -1px #FF78827D;
        }
        &:before {
            box-shadow: -7px 6px 13px 0px #040D2DB2;
        } */
    }
    &.dark a {
        .label {
            color: white;
        }
        .default-background {
            /* background: linear-gradient(226.37deg, #FF9833 15.42%, #FF5B67 95.96%); */
            background: linear-gradient(265.51deg, rgba(42, 47, 78, 0.7) -7.41%, rgba(42, 47, 78, 0.217) 90.54%);
            z-index: 0;
        }
        .hover-background {
            box-shadow: 0px 0px 36px 0px rgba(65, 0, 255, 3);
            z-index: 1;
        }
        .active-background {
            /* background: linear-gradient(226.37deg, #FF6433 15.42%, #FF5B67 95.96%);
            z-index: 2; */
        }
        /* &:after {
            box-shadow: 2px -2px 20px -1px #FF78827D;
        }
        &:before {
            box-shadow: -7px 6px 13px 0px #040D2DB2;
        } */
        .button-border {
            position: absolute;
            overflow: visible;
            left: 0;
            width: 100%;
            top: 0;
            height: 100%;
            fill: none;
            stroke: url(#button-grad);
            stroke-width: 2px;
        }
        #button-grad stop:nth-child(1) {
            /* stop-color: #374284; */
            stop-color: rgba(135, 128, 191, 0);
        }
        #button-grad stop:nth-child(2) {
            /* stop-color: rgba(61, 90, 254, 1); */
            stop-color: ${(props) => (props.theme['blueGray'])};
        }
        #button-grad stop:nth-child(3) {
            /* stop-color: rgba(169, 182, 255, 0.19); */
            stop-color: rgba(135, 128, 191, 0);
        }
    }
    &.dark-outline a {
        .label {
            color: white;
        }
        .default-background {
            /* background: linear-gradient(226.37deg, #FF9833 15.42%, #FF5B67 95.96%); */
            /* background: #0C0B12; */
            z-index: 0;
        }
        .hover-background {
            box-shadow: 0px 0px 36px 0px rgba(65, 0, 255, 3);
            z-index: 1;
        }
        .active-background {
            /* background: linear-gradient(226.37deg, #FF6433 15.42%, #FF5B67 95.96%);
            z-index: 2; */
        }
        /* &:after {
            box-shadow: 2px -2px 20px -1px #FF78827D;
        }
        &:before {
            box-shadow: -7px 6px 13px 0px #040D2DB2;
        } */
        .button-border-dark-outline {
            position: absolute;
            overflow: visible;
            left: 0;
            width: 100%;
            top: 0;
            height: 100%;
            fill: none;
            stroke: url(#button-grad-dark-outline);
            stroke-width: 2px;
        }
        #button-grad-dark-outline stop:nth-child(1) {
            stop-color: rgba(135, 128, 191, 0.23);
        }
        #button-grad-dark-outline stop:nth-child(2) {
            stop-color: rgba(197, 190, 255, 0.23);
        }
        #button-grad-dark-outline stop:nth-child(3) {
            stop-color: rgba(135, 128, 191, 0.09);
        }
    }
    &.secondary a {
        .label {
            text-shadow: none;
        }
        .default-background {
            background: ${gradients.cta};
            z-index: 0;
        }
        .hover-background {
            box-shadow: 0px 0px 36px 0px rgba(65, 0, 255, 3);
            z-index: 1;
        }
        .active-background {
            /* background: #1F3CDD;
            z-index: 2; */
        }
        &:after {
            /* box-shadow: 0px 1.17857px 2.35714px rgba(0, 0, 0, 0.05); */
        }
        &:before {
            /* box-shadow: none; */
        }
    }
    &.outline a {
        .label {
            text-shadow: none;
        }
        .default-background {
            z-index: 1;
            background: linear-gradient(260.82deg, rgba(255, 255, 255, 0.15) 2.23%, rgba(255, 255, 255, 0) 92.98%);;
            &:after,
            &:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 35px;
                width: 100%;
                height: 100%;
                z-index: 0;
            }
            &:after {
                background: linear-gradient(260.82deg, rgba(255, 255, 255, 0.15) 2.23%, rgba(255, 255, 255, 0) 92.98%);
            }
            &:before {
                background: ${(props) => (props.theme.background)};
            }
        }
        .hover-background {
            background: linear-gradient(260.06deg, rgba(255, 255, 255, 0.23) 2.11%, rgba(255, 255, 255, 0.08) 94.1%);;
            z-index: 1;
        }
        .active-background {
            background: linear-gradient(260.06deg, rgba(255, 255, 255, 0.23) 2.11%, rgba(255, 255, 255, 0.23) 94.1%);;
            z-index: 2;
        }
        &:after {
            box-shadow: 0px 1.17857px 2.35714px rgba(0, 0, 0, 0.05);
        }
        &:before {
            box-shadow: none;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            top: -1px;
            left: -1px;
            background: linear-gradient(122.39deg, rgba(61, 90, 254, 0.03) 0%, rgba(61, 90, 254, 0.6) 22.92%, rgba(169, 182, 255, 0.6) 46.35%, rgba(61, 90, 254, 0.6) 78.65%, rgba(61, 90, 254, 0.03) 100%);
        }
    }
    &.icon a {
        height: 28px;
        width: 28px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
`;

export default Button;