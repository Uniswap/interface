
import styled from 'styled-components'
import { Trans } from 'i18n'
import Missing from '../../assets/images/missing_uni.png'

const TitleDiv = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  font-size: 17px;
  align-items: flex-start;
  padding-bottom:8px;
  gap: 20px;
  border-bottom: 1px solid #ccc; // Specify a color for the border
`;

const ResultDiv = styled.div`
  display: flex;
  justify-content: center;
  font-size: 17px;
  align-items: flex-start;
  padding-bottom:8px;
  gap: 20px;
`;

const ImageWrapper = styled.div`
  display: flex;
  margin-top:100px;
  margin-bottom:20px;
  justify-content: center; // Center the image horizontally
  align-items: center; // Center the image vertically
  flex: 1; // Allow ImageWrapper to take available space
`;

export default function Incentives() {
  return (
    <>
      <TitleDiv>
        <div><Trans i18nKey="common.incentives.pool.fee" /></div>
        <div><Trans i18nKey="common.incentives.duration" /></div>
        <div><Trans i18nKey="common.incentives.vesting.period" /></div>
        <div><Trans i18nKey="common.incentives.pool.tv1" /></div>
        <div><Trans i18nKey="common.incentives.total.program.rewards" /></div>
        <div><Trans i18nKey="common.incentives.token.reward" /></div>

      </TitleDiv>
      <ImageWrapper>
        <img src={Missing} alt="Description of image" width={100} />
      </ImageWrapper>
      <ResultDiv><Trans i18nKey="common.incentives.noresults" /></ResultDiv>
      <ResultDiv><Trans i18nKey="common.incentives.try.again" />
      </ResultDiv>
    </>
  );
}
