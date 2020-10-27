import * as React from 'react';
import CookieBanner from 'react-cookie-banner';
import Modal from '../Modal';
import {RowBetween} from '../Row';
import {Text} from 'rebass';
import styled from 'styled-components';
import {AutoColumn} from '../Column';

const Wrapper = styled.div`
  width: 100%;
`;
const Section = styled(AutoColumn)`
  padding: 24px;
`;

const styles = {
  banner: {
    cursor: 'pointer',
    height: 60,
    background: '#EDEEF2',
    backgroundSize: '20px 20px',
    backgroundColor: '',
    fontSize: '16px',
    fontWeight: 600,
    position: 'fixed',
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
    borderRadius: 5,
    // marginBottom: -10,
    // marginTop: -10
  },
  button: {
    position: 'static',
    border: '1px solid #888D9B',
    borderRadius: 4,
    width: 120,
    height: 40,
    background: 'transparent',
    color: '#888D9B',
    fontSize: '14px',
    fontWeight: 600,
    opacity: 1,
    top: 0,
    marginTop: 0,
    right: 0,
    marginLeft: 40,
    marginRight: 32,
  },
  message: {
    display: 'block',
    lineHeight: 1.5,
    textAlign: 'left',
    color: '#888D9B',
    marginLeft: 32,
    // fontWeight: "bold"
    fontSize: '17px',
  },
  link: {
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

// drop cookie document.cookie = 'swoop-accept=; Max-Age=0'
export const Disclaimer = () => {
  const [isAccepted, setIsAccepted] = React.useState(false);
  const [isModalOpen, setModalState] = React.useState(false);

  return (<>
      <div onClick={() => !isAccepted && setModalState(true)}>
        <CookieBanner
          styles={styles}
          message="This project is a tech demo in beta. Use at your own risk."
          onAccept={()=>setIsAccepted(true)}
          cookie="swoop-accept"
          dismissOnScroll={false}
          dismissOnClick={false}
        />
      </div>
      <Modal isOpen={!isAccepted && isModalOpen} onDismiss={() => setModalState(false)} maxHeight={90}>
        <Wrapper>
          <Section>
            <RowBetween>
              <Text fontWeight={500} fontSize={15}>
                This project is a tech demo in beta. You understand and expressly accept that the beta version of SWOOP
                is
                provided to you at your own risk on an “AS IS” and “UNDER DEVELOPMENT” basis. THE DEVELOPERS OF SWOOP
                MAKE
                NO
                WARRANTY WHATSOEVER WITH RESPECT TO THE BETA DEMO, INCLUDING ANY (A) WARRANTY OF MERCHANTABILITY; (B)
                WARRANTY OF
                FITNESS FOR A PARTICULAR PURPOSE; (C) WARRANTY OF TITLE; OR (D) WARRANTY AGAINST INFRINGEMENT OF
                INTELLECTUAL
                PROPERTY RIGHTS OF A THIRD PARTY; WHETHER ARISING BY LAW, COURSE OF DEALING, COURSE OF PERFORMANCE,
                USAGE
                OF
                TRADE, OR OTHERWISE.
                Nationals and residents of the following countries are restricted from participation: Afghanistan, Cuba,
                Democratic Republic of the Congo, Guinea-Bissau, Iran, Iraq, Lebanon, Libya, Myanmar, North Korea,
                Somalia, Sudan,
                Syria, Yemen, Zimbabwe, and the Crimea region of Ukraine.
                The project is operated by Pangaea Community around the globe and Hemenglian Technology outside the
                United
                States.
              </Text>
            </RowBetween>
          </Section>
        </Wrapper>
      </Modal>
    </>
  );
};
