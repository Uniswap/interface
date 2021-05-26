import React from 'react'
import styled from "styled-components";
import QuestionHelper from '../QuestionHelper';
import arrowIcon from '../../assets/svg/arrow-bright.svg'

const Tag = styled.div`
  display: inline-block;
  padding: 3px 4px;
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  text-transform: uppercase;
  border-radius: 4px;
`;

export const TagPrimary = styled(Tag)`
  background: rgba(104, 110, 148, 0.2);
  border: 1px solid rgba(104, 110, 148, 0.2);
  color: ${({ theme }) => theme.bg5};
`;

export const TagSuccess = styled(Tag)`
  color: #118761;
  background: rgba(14, 159, 110, 0.15);
`;

export const TagSuccessArrow = styled(TagSuccess)`
  position: relative;
  padding-right: 20px;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
    width: 12px;
    height: 7px;
    background: url(${arrowIcon}) center no-repeat;
    background-size: contain;
  }
`

const TagWarning = styled(Tag)`
  display: inline-flex;
  align-items: center;
  color: #a86e3f;
  background: rgba(242, 153, 74, 0.16);
`;

const QuestionHelperWarning = styled(QuestionHelper)`
  width: 10px;
  height: 10px;
  color: #a86e3f;
  margin-left: 3px;
`;

export const TagPending = () => (
  <TagWarning>
    Pending
    <QuestionHelperWarning
      text="Lorem ipsum Lorem ipsum Lorem ipsum"
    />
  </TagWarning>
)



