import { thorify } from 'thorify'
import { extend } from 'thorify/dist/extend';
import { isEmpty } from 'lodash';
import * as Arkane from '@arkane-network/arkane-connect';

import { watchBalance } from './web3connect';

import {
  INITIALIZE,
  UPDATE_ACCOUNT,
  UPDATE_NETWORK_ID,
} from './creators'

const Web3 = require("web3");

const arkane = async (dispatch, getState) => {
  const { web3connect } = getState();

  return new Promise(async (resolve, reject) => {
    if (web3connect.web3) {
      resolve(web3connect.web3);
      return;
    }

    window.arkaneConnect = new Arkane.ArkaneConnect('Arketype', { environment: 'staging' });
    const web3 = thorify(new Web3(), "http://localhost:8669");

    extend(web3);


    const result = await window.arkaneConnect.checkAuthenticated();

    result
      .authenticated((auth) => {
        window.arkaneConnect.addOnTokenRefreshCallback(auth.updateToken);

        dispatch({
          type: INITIALIZE,
          payload: web3,
          meta: {
            arkaneConnect: window.arkaneConnect,
            provider: 'arkane'
          },
        });

        resolve(web3);
        return;
      })
      .notAuthenticated((auth) => {
        reject(auth);
        console.log("This user is not authenticated", auth); 
      });
  });
};

export default arkane;
