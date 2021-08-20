import { TransactionResponse } from '@ethersproject/providers'
import { t } from '@lingui/macro'
import { abi as GOV_ABI } from '@uniswap/governance/build/GovernorAlpha.json'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNISWAP_GRANTS_PROPOSAL_DESCRIPTION } from 'constants/proposals/uniswap_grants_proposal_description'
import { BRAVO_PROPOSAL_DESCRIPTION } from 'constants/proposals/bravo_proposal_description'
import { Contract } from 'ethers'
import { defaultAbiCoder, formatUnits, Interface, isAddress, LogDescription } from 'ethers/lib/utils'
import {
  useGovernanceV0Contract,
  useGovernanceV1Contract,
  useLatestGovernanceContract,
  useUniContract,
} from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo } from 'react'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { SupportedChainId } from '../../constants/chains'
import { BRAVO_START_BLOCK, UNISWAP_GRANTS_START_BLOCK } from '../../constants/proposals'
import { UNI } from '../../constants/tokens'
import { useLogs } from '../logs/hooks'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
import { useTransactionAdder } from '../transactions/hooks'

interface ProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  status: ProposalState
  forCount: number
  againstCount: number
  startBlock: number
  endBlock: number
  details: ProposalDetail[]
  governorIndex: number // index in the governance address array for which this proposal pertains
}

export interface CreateProposalData {
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
  description: string
}

export enum ProposalState {
  UNDETERMINED = -1,
  PENDING,
  ACTIVE,
  CANCELED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
}

const GovernanceInterface = new Interface(GOV_ABI)

// get count of all proposals made in the latest governor contract
function useProposalCount(contract: Contract | null): number | undefined {
  const { result } = useSingleCallResult(contract, 'proposalCount')

  return result?.[0]?.toNumber()
}

interface FormattedProposalLog {
  description: string
  details: { target: string; functionSig: string; callData: string }[]
}
/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
function useFormattedProposalCreatedLogs(contract: Contract | null): FormattedProposalLog[] | undefined {
  // create filters for ProposalCreated events
  const filter = useMemo(() => contract?.filters?.ProposalCreated(), [contract])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs?.map((log) => {
      let parsed: LogDescription['args']
      try {
        parsed = GovernanceInterface.parseLog(log).args
      } catch {
        parsed = GovernanceInterface.parseLog({
          topics: log.topics,
          data: log.data.replace(
            '2223205570677261646520476f7665726e616e636520436f6e747261637420746f20436f6d706f756e64277320476f7665726e6f7220427261766f202023232050726576696f75732044697363757373696f6e3a20205b54656d706572617475726520436865636b5d2868747470733a2f2f676f762e756e69737761702e6f72672f742f74656d70657261747572652d636865636b2d757067726164652d676f7665726e616e63652d636f6e74726163742d746f2d676f7665726e6f722d627261766f2f313336313029207c205b536e617073686f745d2868747470733a2f2f736e617073686f742e6f72672f232f756e69737761702f70726f706f73616c2f516d53634e4c65616a694632685168317a3944597154464b47677252684877724869735634796e6d44455177784829205b436f6e73656e73757320436865636b5d2868747470733a2f2f676f762e756e69737761702e6f72672f742f636f6e73656e7375732d636865636b2d757067726164652d676f7665726e616e63652d636f6e74726163742d746f2d676f7665726e6f722d627261766f2f313337303729207c205b536e617073686f745d2868747470733a2f2f736e617073686f742e6f72672f232f756e69737761702f70726f706f73616c2f516d5762677a484a386e4b325444616a364c46364278414d506168793937644d6d626255356b52427731516b5874292020232320544c3b44523a20205570677261646520556e697377617027732063757272656e7420676f7665726e616e636520636f6e74726163742066726f6d20476f7665726e6f7220416c70686120746f20476f7665726e6f7220427261766f20746f20696d70726f766520676f7665726e616e6365207570677261646162696c69747920616e642070726f746f636f6c207361666574792e20205b4f6e2d436861696e2050726f706f73616c5d2829202023232053756d6d61727920616e64204d6f7469766174696f6e3a20202a436f2d7772697474656e2077697468205b47657474792048696c6c5d2868747470733a2f2f747769747465722e636f6d2f67657474795f68696c6c292028404765747479292c205b45646479204c6565205d2868747470733a2f2f747769747465722e636f6d2f796573696d6564647929202840656c6565292c205b5975616e2048616e204c69205d2868747470733a2f2f747769747465722e636f6d2f7975616e5f68616e5f6c69292028407975616e2d68616e2d6c69292c205b4a6f686e2057616e67205d2868747470733a2f2f747769747465722e636f6d2f6a30686e77616e67292028406a6f686e77616e67292c20616e64205b416c69204b68616d62617469205d2868747470733a2f2f747769747465722e636f6d2f616c696b68616d626174693129202840616c696b68616d62617469292a2020476f7665726e6f7220416c7068612c207468652063757272656e7420676f7665726e616e636520636f6e747261637420757365642c2077617320612067726561742073746172742c2062757420696e206c69676874206f6620436f6d706f756e64277320616e64206f746865722070726f746f636f6c73207570677261646520746f20476f7665726e6f7220427261766f2c20556e69737761702073686f756c64206d69677261746520676976656e20427261766f2773206164646974696f6e616c207361666574792062656e656669747320616e64207570677261646162696c6974792e2020312e202a2a4e617469766520757067726164656162696c6974793a2a2a20556e64657220476f7665726e6f7220416c7068612c206368616e67657320746f20676f7665726e616e636520706172616d65746572732072657175697265206465706c6f79696e672061206e657720636f6e747261637420616e6420636f6d706c6574656c79206d6967726174696e6720746f2061206e657720616464726573732e205468697320697320706172746963756c61726c792064616d6167696e6720746f20676f7665726e616e63652070617274696369706174696f6e20617320697420696e74726f647563657320646f776e74696d6520616e64206173796e6368726f6e69636974792e204d616e7920676f7665726e616e636520746f6f6c7320616e6420637573746f6469616e732075736520666163746f727920636f6e74726163747320776869636820706f696e7420746f206120737065636966696320636f6e747261637420616464726573732c206d65616e696e672070617274696573206d757374206d616e75616c6c79207570677261646520746865697220696e6672617374727563747572652065766572792074696d6520676f7665726e616e636520706172616d657465727320617265206368616e67656420756e64657220476f7665726e6f7220416c7068612e205468697320696e636c7564657320746f6f6c7320666f72206372656174696e67206175746f6e6f6d6f75732070726f706f73616c73206c696b65205b666973682e766f7465205d2868747470733a2f2f7777772e666973682e766f74652f293b2066726f6e742d656e64732073756368206173205b54616c6c79205d2868747470733a2f2f7777772e7769746874616c6c792e636f6d2f292c205b537962696c5d2868747470733a2f2f737962696c2e6f72672f232f64656c6567617465732f756e6973776170292c20616e64205b426f617264726f6f6d205d2868747470733a2f2f6170702e626f617264726f6f6d2e696e666f2f292077686963682061676772656761746520616e6420646973706c617920676f7665726e616e636520726573756c747320666f7220766172696f75732070726f746f636f6c733b20616e642070726f66657373696f6e616c20637573746f6469616e73207768696368206172652075736564206279206c6172676520746f6b656e20686f6c646572732c2064656c6567617465732c20616e6420636f6d6d756e697479206d656d626572732e20456e61626c696e6720612073746174696320636f6e747261637420616464726573732074686174206861732070726f7879207570677261646162696c697479207061747465726e7320697320706172616d6f756e7420666f72206d6178696d697a696e672070617274696369706174696f6e2c20616e64206d61696e7461696e696e6720616e206f70656e20616e642073656375726520676f7665726e616e63652070726f636573732e20322e202a2a566f74696e6720726561736f6e20737472696e673a2a2a20476f7665726e6f7220427261766f20676976657320766f7465727320746865206f70706f7274756e69747920746f2061646420667265652d666f726d20636f6d6d656e747320287465787420737472696e67732920616c6f6e672077697468207468656972206f6e2d636861696e20766f7465732e204e6f74206f6e6c7920646f6573207468697320696e63726561736520746865207472616e73706172656e63792061726f756e642074686520726174696f6e616c652070656f706c65206861766520626568696e6420746865697220766f7465732c2062757420697420616c736f20666163696c697461746573206d6f726520696e2d646570746820616e64206e75616e6365642064697363757373696f6e2e20332e202a2a4e6577209880e26162737461696e2720766f74696e67206f7074696f6e3a2a2a20476f7665726e6f7220427261766f20656e61626c657320766f7465727320746f20666f726d616c6c79206162737461696e20726174686572207468616e20666f7263696e67207468656d20746f2063686f6f7365206265747765656e20766f74696e67207965732f6e6f206f72206e6f7420766f74696e6720617420616c6c2e20546869732077696c6c206769766520766f74657273206d6f726520666c65786962696c69747920616e6420616c736f20696e637265617365207472616e73706172656e637920696e746f2064656c6567617465206265686176696f722e20342e202a2a50726f706f73616c206e756d6265727320776f6e27742072657365743a2a2a20556e64657220476f7665726e6f7220416c7068612c20616e7920757067726164657320746f2074686520636f6e747261637420726573657473207468652070726f706f73616c206e756d62657220736368656d612e204e6f746963652074686174205b9880e250726f706f73616c20302e34275d2868747470733a2f2f6170702e756e69737761702e6f72672f232f766f74652f302f34292028776869636820726573756c74656420696e206465706c6f796d656e7420616e64206d6967726174696f6e20746f2061206e657720476f7665726e6f7220416c70686120636f6e74726163742064756520746f206d6f64696679696e67207468652070726f706f73616c207375626d697373696f6e207468726573686f6c6420706172616d6574657229206361757365642074686520666f6c6c6f77696e67206f6e2d636861696e2070726f706f73616c2066726f6d2040486172766172644c617742464920746f206265206e756d6265726564205b9880e250726f706f73616c20312e3127205d2868747470733a2f2f6170702e756e69737761702e6f72672f232f766f74652f312f31292e20556e64657220476f7665726e6f7220427261766f2c207468697320776f756c64206e6f7420626520616e20697373756520616e642070726f706f73616c206e756d6265727320776f756c6420626520636f6e74696e756f757320626563617573652074686520636f6e747261637420776f756c64206265206d61696e7461696e656420617420612073696e676c6520616464726573732e20352e202a2a50726f706f73616c2043616e63656c6c6174696f6e3a2a2a20427261766f20616c6c6f777320757365722d64697265637465642063616e63656c6c6174696f6e7320656e61626c696e67206572726f6e656f75732070726f706f73616c7320746f2062652063616e63656c6564206966206e6565642062652028726174686572207468616e20666f7263696e672070656f706c6520746f20766f7465206e6f2f6162737461696e292e20362e202a2a52657669657720506572696f643a2a2a20476f7665726e6f7220427261766f20616c6c6f777320676f7665726e616e636520746f20696e636c7564652061207265766965772f616e616c7973697320706572696f642e2043757272656e746c792c20436f6d706f756e642075736573206120313331343020626c6f636b20287e322d646179292072657669657720706572696f64207468617420616c6c6f777320686f6c6465727320746f20726576696577207468652070726f706f73616c2e2054686973206d65616e7320746861742075736572732077696c6c206861766520322d6461797320746f207072657061726520666f7220766f74696e672028652e672e2c2072656d6f766520554e492066726f6d2041617665292c20756e6c696b6520476f7665726e6f7220416c70686120776869636820696e7374616e746c7920736e617073686f74732075736572732720766f74696e6720706f7765722e20412072657669657720706572696f64207375627374616e7469616c6c7920696d70726f76657320746865206163636573736962696c69747920616e6420736166657479206f662074686520676f7665726e616e63652070726f636573732e2020232320496d706c656d656e746174696f6e3a20416674657220737065616b696e67207769746820746865204f70656e5a657070656c696e207465616d2061626f7574207468656972207265696d706c656d656e746174696f6e206f6620476f7665726e6f7220427261766f2c207765207468696e6b207573696e6720436f6d706f756e64277320476f7665726e6f7220427261766f20636f6e747261637420696e7374656164206d616b657320746865206d6f73742073656e736520617420746869732073746167652e2020416c74686f756768204f70656e205a657070656c696e277320476f7665726e6f7220636f6e74726163742074616b657320612073696d706c657220617070726f61636820746861742063616e20696e636c75646520616c6c20427261766f2066756e6374696f6e616c6974792c20697420646f6573206e6f7420646f20736f2062792064656661756c742e2054686520636f6e747261637420757365732073696d696c6172206c6f6769632c206275742074686520636f6465206973206e65772e2049742068617320676f6e65207468726f75676820616e20696e7465726e616c20617564697420616e64207265766965772070726f6365737320627574207374696c6c206e6565647320746f20676f207468726f75676820616e2065787465726e616c2061756469742e2020466f72207468652073616665747920616e642073696d706c6963697479206f6620556e69737761702c207765207468696e6b207573696e6720436f6d706f756e64277320476f7665726e6f7220427261766f20636f6e7472616374206973207468652062657374206465636973696f6e20666f72207468652074696d65206265696e672e20436f6d706f756e64277320476f7665726e6f7220636f6e74726163742068617320616c726561647920756e646572676f6e6520616e205b61756469745d2868747470733a2f2f626c6f672e6f70656e7a657070656c696e2e636f6d2f636f6d706f756e642d676f7665726e6f722d627261766f2d61756469742f29206279204f70656e5a657070656c696e20616e6420686173206265656e20776964656c7920757365642e2057652063616e20616c77617973206368616e67652f7570677261646520746f204f70656e205a657070656c696e20476f7665726e6f7220636f6e7472616374206174206120667574757265206461746520696620746865697220636f6e747261637420696e74726f6475636573206e65772066656174757265732f66756e6374696f6e616c6974792074686520636f6d6d756e69747920697320696e746572657374656420696e2e204d6f72652064657461696c73206f6e204f70656e5a657070656c696e277320636f64652063616e20626520666f756e6420686572653a205b4769746875625d2868747470733a2f2f6769746875622e636f6d2f4f70656e5a657070656c696e2f6f70656e7a657070656c696e2d636f6e7472616374732f747265652f6d61737465722f636f6e7472616374732f676f7665726e616e636529205b446f63735d2868747470733a2f2f646f63732e6f70656e7a657070656c696e2e636f6d2f636f6e7472616374732f342e782f6170692f676f7665726e616e636529205b4d6f726520696e666f5d2868747470733a2f2f6f70656e7a657070656c696e2e6e6f74696f6e2e736974652f436f6d706172696e672d436f6d706f756e642d476f7665726e6f722d746f2d4f70656e5a657070656c696e2d476f7665726e6f722d322d31306430666463663631626134373666616534393262323935383232656531332920204173206d656e74696f6e656420696e207468652070726576696f757320436f6e73656e73757320436865636b2c2077652068617665206465706c6f7965642074686520636f6e7472616374206f6e2074686520526f707374656e2074657374206e657420666f722074686520636f6d6d756e69747920746f20726576696577206f757220636f64653a205b476f7665726e6f7220427261766f2044656c656761746f725d2868747470733a2f2f726f707374656e2e65746865727363616e2e696f2f616464726573732f30783135646631356361616431326164616130333934393031346261356363343961383438303364306623636f646529205b476f7665726e6f7220427261766f2044656c65676174655d2868747470733a2f2f726f707374656e2e65746865727363616e2e696f2f616464726573732f30784438626636306466433531313546366342393962623530353032333436453762383633383030663123636f646529205b47697468756220666f7220636f6e7472616374735d2868747470733a2f2f6769746875622e636f6d2f6765747474792f756e69737761702d676f762920202a4e423a2054686520605f696e697469617465602066756e6374696f6e20686173206265656e20736c696768746c79206d6f64696669656420746f2074616b6520616e20696e697469616c2070726f706f73616c206e756d62657220617320616e20696e70757420726174686572207468616e2070756c6c696e672069742066726f6d20476f7665726e6f7220416c7068612e20546869732077617920556e69737761702063616e20726573756d652070726f7065722070726f706f73616c206e756d626572696e672e2a20202323205265736f75726365206c696e6b733a2020312e205b476f7665726e6f7220427261766f20446576656c6f706d656e74202d2050726f746f636f6c20446576656c6f706d656e74202d20436f6d706f756e6420436f6d6d756e69747920466f72756d205d2868747470733a2f2f7777772e636f6d702e78797a2f742f676f7665726e6f722d627261766f2d646576656c6f706d656e742f3934322920322e205b556e6465727374616e64696e6720476f7665726e6f7220427261766f2e204120726576696577206f66206b6579206368616e67657320766572737573a680e2207c206279206d6f6e6574737570706c79207c2054616c6c79207c204a756c2c2032303231207c204d656469756d205d2868747470733a2f2f6d656469756d2e636f6d2f74616c6c792d626c6f672f756e6465727374616e64696e672d676f7665726e6f722d627261766f2d3639623036663138373564612920332e205b436f6d706f756e64207c2050726f706f73616c2044657461696c20233432205d2868747470733a2f2f636f6d706f756e642e66696e616e63652f676f7665726e616e63652f70726f706f73616c732f34322920342e205b436f6d706f756e64207c2050726f706f73616c2044657461696c202334335d2868747470733a2f2f636f6d706f756e642e66696e616e63652f676f7665726e616e63652f70726f706f73616c732f34332922',
            '0'.repeat(13282)
          ),
        }).args
      }
      return {
        description: parsed.description,
        details: parsed.targets.map((target: string, i: number) => {
          const signature = parsed.signatures[i]
          const [name, types] = signature.substr(0, signature.length - 1).split('(')
          const calldata = parsed.calldatas[i]
          const decoded = defaultAbiCoder.decode(types.split(','), calldata)
          return {
            target,
            functionSig: name,
            callData: decoded.join(', '),
          }
        }),
      }
    })
  }, [useLogsResult])
}

const V0_PROPOSAL_IDS = [[1], [2], [3], [4]]

function countToIndices(count: number | undefined) {
  return typeof count === 'number' ? new Array(count).fill(0).map((_, i) => [i + 1]) : []
}

// get data for all past and active proposals
export function useAllProposalData(): { data: ProposalData[]; loading: boolean } {
  const { chainId } = useActiveWeb3React()
  const gov0 = useGovernanceV0Contract()
  const gov1 = useGovernanceV1Contract()

  const proposalCount0 = useProposalCount(gov0)
  const proposalCount1 = useProposalCount(gov1)

  const gov0ProposalIndexes = useMemo(() => {
    return chainId === SupportedChainId.MAINNET ? V0_PROPOSAL_IDS : countToIndices(proposalCount0)
  }, [chainId, proposalCount0])
  const gov1ProposalIndexes = useMemo(() => {
    return countToIndices(proposalCount1)
  }, [proposalCount1])

  const proposalsV0 = useSingleContractMultipleData(gov0, 'proposals', gov0ProposalIndexes)
  const proposalsV1 = useSingleContractMultipleData(gov1, 'proposals', gov1ProposalIndexes)

  // get all proposal states
  const proposalStatesV0 = useSingleContractMultipleData(gov0, 'state', gov0ProposalIndexes)
  const proposalStatesV1 = useSingleContractMultipleData(gov1, 'state', gov1ProposalIndexes)

  // get metadata from past events
  const formattedLogsV0 = useFormattedProposalCreatedLogs(gov0)
  const formattedLogsV1 = useFormattedProposalCreatedLogs(gov1)

  // early return until events are fetched
  return useMemo(() => {
    const proposalsCallData = proposalsV0.concat(proposalsV1)
    const proposalStatesCallData = proposalStatesV0.concat(proposalStatesV1)
    const formattedLogs = (formattedLogsV0 ?? [])
      .slice(0, proposalsV0.length)
      .concat((formattedLogsV1 ?? []).slice(0, proposalsV1.length))

    if (
      proposalsCallData.some((p) => p.loading) ||
      proposalStatesCallData.some((p) => p.loading) ||
      (gov0 && !formattedLogsV0) ||
      (gov1 && !formattedLogsV1)
    ) {
      return { data: [], loading: true }
    }

    return {
      data: proposalsCallData.map((proposal, i) => {
        let description = formattedLogs[i]?.description
        const startBlock = parseInt(proposal?.result?.startBlock?.toString())
        if (startBlock === UNISWAP_GRANTS_START_BLOCK) {
          description = UNISWAP_GRANTS_PROPOSAL_DESCRIPTION
        } else if (startBlock === BRAVO_START_BLOCK) {
          description = BRAVO_PROPOSAL_DESCRIPTION
        }
        return {
          id: proposal?.result?.id.toString(),
          title: description?.split(/# |\n/g)[1] ?? t`Untitled`,
          description: description ?? t`No description.`,
          proposer: proposal?.result?.proposer,
          status: proposalStatesCallData[i]?.result?.[0] ?? ProposalState.UNDETERMINED,
          forCount: parseFloat(formatUnits(proposal?.result?.forVotes?.toString() ?? 0, 18)),
          againstCount: parseFloat(formatUnits(proposal?.result?.againstVotes?.toString() ?? 0, 18)),
          startBlock,
          endBlock: parseInt(proposal?.result?.endBlock?.toString()),
          details: formattedLogs[i]?.details,
          governorIndex: i >= gov0ProposalIndexes.length ? 1 : 0,
        }
      }),
      loading: false,
    }
  }, [
    formattedLogsV0,
    formattedLogsV1,
    gov0,
    gov0ProposalIndexes.length,
    gov1,
    proposalStatesV0,
    proposalStatesV1,
    proposalsV0,
    proposalsV1,
  ])
}

export function useProposalData(governorIndex: number, id: string): ProposalData | undefined {
  const { data } = useAllProposalData()
  return data.filter((p) => p.governorIndex === governorIndex)?.find((p) => p.id === id)
}

// get the users delegatee if it exists
export function useUserDelegatee(): string {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()
  const { result } = useSingleCallResult(uniContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}

// gets the users current votes
export function useUserVotes(): { loading: boolean; votes: CurrencyAmount<Token> | undefined } {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const { result, loading } = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])
  return useMemo(() => {
    const uni = chainId ? UNI[chainId] : undefined
    return { loading, votes: uni && result ? CurrencyAmount.fromRawAmount(uni, result?.[0]) : undefined }
  }, [chainId, loading, result])
}

// fetch available votes as of block (usually proposal start block)
export function useUserVotesAsOfBlock(block: number | undefined): CurrencyAmount<Token> | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const uni = chainId ? UNI[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getPriorVotes', [account ?? undefined, block ?? undefined])
    ?.result?.[0]
  return votes && uni ? CurrencyAmount.fromRawAmount(uni, votes) : undefined
}

export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const uniContract = useUniContract()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!library || !chainId || !account || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!uniContract) throw new Error('No UNI Contract!')
      return uniContract.estimateGas.delegate(...args, {}).then((estimatedGasLimit) => {
        return uniContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(chainId, estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Delegated votes`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, library, uniContract]
  )
}

export function useVoteCallback(): {
  voteCallback: (proposalId: string | undefined, support: boolean) => undefined | Promise<string>
} {
  const { account, chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()

  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !latestGovernanceContract || !proposalId || !chainId) return
      const args = [proposalId, support]
      return latestGovernanceContract.estimateGas.castVote(...args, {}).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(chainId, estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract, chainId]
  )
  return { voteCallback }
}

export function useCreateProposalCallback(): (
  createProposalData: CreateProposalData | undefined
) => undefined | Promise<string> {
  const { account, chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const addTransaction = useTransactionAdder()

  return useCallback(
    (createProposalData: CreateProposalData | undefined) => {
      if (!account || !latestGovernanceContract || !createProposalData || !chainId) return undefined

      const args = [
        createProposalData.targets,
        createProposalData.values,
        createProposalData.signatures,
        createProposalData.calldatas,
        createProposalData.description,
      ]

      return latestGovernanceContract.estimateGas.propose(...args).then((estimatedGasLimit) => {
        return latestGovernanceContract
          .propose(...args, { gasLimit: calculateGasMargin(chainId, estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: t`Submitted new proposal`,
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, latestGovernanceContract, chainId]
  )
}

export function useLatestProposalId(address: string | undefined): string | undefined {
  const govContractV1 = useGovernanceV1Contract()
  const res = useSingleCallResult(govContractV1, 'latestProposalIds', [address])

  return res?.result?.[0]?.toString()
}

export function useProposalThreshold(): CurrencyAmount<Token> | undefined {
  const { chainId } = useActiveWeb3React()

  const latestGovernanceContract = useLatestGovernanceContract()
  const res = useSingleCallResult(latestGovernanceContract, 'proposalThreshold')
  const uni = chainId ? UNI[chainId] : undefined

  if (res?.result?.[0] && uni) {
    return CurrencyAmount.fromRawAmount(uni, res.result[0])
  }

  return undefined
}
