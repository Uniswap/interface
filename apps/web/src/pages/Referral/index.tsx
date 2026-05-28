import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { useAccount } from 'hooks/useAccount'
import { useAppHeaderHeight } from 'hooks/useAppHeaderHeight'
import { useScroll } from 'hooks/useScroll'
import { useScrollCompact } from 'hooks/useScrollCompact'
import { InviteRebatesTable } from 'pages/Referral/Components/InviteRebatesTable'
import { InviteesTable } from 'pages/Referral/Components/InviteesTable'
import { ReferralOverview } from 'pages/Referral/Components/Overview'
import { ReferralAddressDisplay } from 'pages/Referral/Components/ReferralAddressDisplay'
import { ReferralCodeModal } from 'pages/Referral/Components/ReferralCodeModal'
import { Rules } from 'pages/Referral/Components/Rules'
import { SelfRebatesTable } from 'pages/Referral/Components/SelfRebatesTable'
import { PointTxList } from 'pages/Referral/Components/TransactionList'
import {
  UserReferralActivitiesTable,
  UserReferralActivityItem,
} from 'pages/Referral/Components/UserReferralActivitiesTable'
import {
  INVITEES_API_URL,
  INVITE_REBATES_API_URL,
  POINTS_TOTAL_API_URL,
  REFERRAL_API_Activity_URL,
  SELF_REBATES_API_URL,
  USER_REFERRAL_ACTIVITIES_API_URL,
} from 'pages/Referral/Constants/url'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Flex, Separator, Text, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { getInternalLinkHref } from 'utils/routing'

const HEADER_TRANSITION = 'all 0.2s ease'
const REFERRAL_CODE_STORAGE_KEY = 'referralCode'

type TransactionPoint = {
  txHash: string
  createdAt: string
  chain?: string
  swapPoints?: string | number
  invitePoints?: string | number
  volumeUSD?: string | number
  token0Symbol?: string
  token1Symbol?: string
  token0Quantity?: string | number
  token1Quantity?: string | number
  protocolVersion?: string
  feeBps?: number
  timestamp?: number
  source?: 'self' | 'invite'
}

type SelfRebateRecord = {
  id: string
  txHash: string
  inviteeAddress?: string
  chain?: string
  volumeUSD: number
  selfRebatePoints: number
  createdAt: string
  timestamp?: number
}

type SelfRebatesResponse = {
  data: SelfRebateRecord[]
  meta: {
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
}

type InviteRebateRecord = {
  id: string
  txHash: string
  inviteeAddress?: string
  chain?: string
  volumeUSD: number
  inviteRebatePoints: number
  createdAt: string
  timestamp?: number
}

type InviteRebatesResponse = {
  data: InviteRebateRecord[]
  meta: {
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
}

type InviteeRecord = {
  id: string
  address: string
  referralCode?: string | null
  contributedPoints: number
  invitedAt?: string | null
  createdAt: string
}

type InviteesResponse = {
  data: InviteeRecord[]
  historicalContributedPoints: number
  meta: {
    total: number
    page: number
    pageSize: number
    pageCount: number
  }
}

type UserReferralActivityRecord = {
  id?: string | number
  activityId?: string | number | null
  currentActivityId?: string | number | null
  campaignId?: string | number | null
  createdAt?: string | null
  updatedAt?: string | null
  participatedAt?: string | null
  timestamp?: number | null
  activityName?: string | null
  activity_title?: string | null
  activity_name?: string | null
  name?: string | null
  title?: string | null
  currentActivity?: {
    id?: string | number | null
    activityId?: string | number | null
    name?: string | null
    title?: string | null
    activityName?: string | null
  } | null
  activity?: {
    id?: string | number | null
    activityId?: string | number | null
    name?: string | null
    title?: string | null
    activityName?: string | null
    activity_name?: string | null
    activity_title?: string | null
    currentActivity?: {
      id?: string | number | null
      activityId?: string | number | null
      name?: string | null
      title?: string | null
      activityName?: string | null
    } | null
  } | null
  swapPoints?: string | number | null
  invitePoints?: string | number | null
  totalPoints?: string | number | null
  rewardUsd?: string | number | null
  rewardUSD?: string | number | null
  reward?: string | number | null
  usdReward?: string | number | null
  merkelRoot?: string | null
  merkleRoot?: string | null
  claimable?: boolean | null
  claimed?: boolean | null
  claimedAt?: string | null
  claimUrl?: string | null
}

type UserReferralActivitiesResponse = {
  data?: UserReferralActivityRecord[]
  meta?: {
    total?: number
    page?: number
    pageSize?: number
    pageCount?: number
  }
}

type ReferralActivityResponse = {
  startAt?: string | number | null
  endAt?: string | number | null
  startTime?: string | number | null
  endTime?: string | number | null
  startsAt?: string | number | null
  endsAt?: string | number | null
}

export type TotalPointsResponse = {
  id?: string | number
  address: string
  referralCode: string | null
  activeTime?: string | null
  hasInviter?: boolean | null
  referralLevel?: number
  inviterId?: string | null
  invitedAt?: string | null
  createdAt?: string
  referralLink?: string | null
  yourRebateRate?: string | number | null
  inviteeDiscountRate?: string | number | null
  currentRewards?: string | number | null
  invitedUsersCount?: number | null
  transactionCount?: number | null
  inviteTransactionCount?: number | null
  myTransactionVolume?: string | number | null
  invitedTransactionVolume?: string | number | null
  txPoints?: string | number | null
  referralPoints?: string | number | null
  swapPoints?: string | number | null
  invitePoints?: string | number | null
  totalPoints?: string | number | null
  isWalletUserActivated?: boolean | null
  walletUserBonusRate?: string | number | null
  _count?: { invitees?: number }
  inviter?: { referralCode: string } | null
  userTransactionPoint?: Array<{ txHash?: string; createdAt?: string | null; timestamp?: number | null }>
  invitedTransactionPoint?: Array<{ txHash?: string; createdAt?: string | null; timestamp?: number | null }>
}

type NormalizedPointsData = {
  referralCode: string
  referralLink: string
  inviterCode: string
  hasInviter: boolean
  yourRebateRate: number
  isWalletUserActivated: boolean
  walletUserBonusRate: number
  inviteeDiscountRate: number
  currentRewards: number
  invitedUsersCount: number
  transactionCount: number
  inviteTransactionCount: number
  myTransactionVolume: number
  invitedTransactionVolume: number
  txPoints: number
  referralPoints: number
  totalPoints: number
  rewards: number
  inviteesCount: number
  userTransactionPoint: TransactionPoint[]
  invitedTransactionPoint: TransactionPoint[]
}

type RecordTab = 'rebate' | 'invitees' | 'inviteCode' | 'activities' | 'rules'

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toCreatedAt(value?: string | null, timestamp?: number | null): string {
  if (value) {
    return value
  }
  if (typeof timestamp === 'number') {
    const msTimestamp = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000
    return new Date(msTimestamp).toISOString()
  }
  return ''
}

function getUserReferralActivityName(record: UserReferralActivityRecord): string {
  return (
    record.activityName ??
    record.activity_name ??
    record.activity_title ??
    record.name ??
    record.title ??
    record.currentActivity?.activityName ??
    record.currentActivity?.name ??
    record.currentActivity?.title ??
    record.activity?.activityName ??
    record.activity?.activity_name ??
    record.activity?.activity_title ??
    record.activity?.name ??
    record.activity?.title ??
    record.activity?.currentActivity?.activityName ??
    record.activity?.currentActivity?.name ??
    record.activity?.currentActivity?.title ??
    ''
  )
}

function getClaimActivityId(record: UserReferralActivityRecord): string | undefined {
  const value =
    record.activityId ??
    record.currentActivityId ??
    record.campaignId ??
    record.currentActivity?.activityId ??
    record.currentActivity?.id ??
    record.activity?.activityId ??
    record.activity?.id ??
    record.activity?.currentActivity?.activityId ??
    record.activity?.currentActivity?.id

  if (value === null || value === undefined || value === '') {
    return undefined
  }

  return String(value)
}

function normalizeUserReferralActivity(record: UserReferralActivityRecord, index: number): UserReferralActivityItem {
  const rewardUsd = toNumber(record.rewardUsd ?? record.rewardUSD ?? record.reward ?? record.usdReward)
  const swapPoints = toNumber(record.swapPoints)
  const invitePoints = toNumber(record.invitePoints)
  const totalPoints = toNumber(record.totalPoints)
  const createdAt = toCreatedAt(record.participatedAt ?? record.createdAt ?? record.updatedAt, record.timestamp)
  const claimable = Boolean(record.claimable ?? (rewardUsd > 0 && !record.claimed && !record.claimedAt))
  const claimed = Boolean(record.claimed ?? record.claimedAt)
  const merkleRoot = record.merkelRoot ?? record.merkleRoot ?? ''

  return {
    id: String(record.id ?? `${createdAt}-${index}`),
    claimActivityId: getClaimActivityId(record),
    createdAt,
    activityName: getUserReferralActivityName(record),
    swapPoints,
    invitePoints,
    totalPoints: totalPoints || swapPoints + invitePoints,
    rewardUsd,
    claimable,
    claimed,
    claimUrl: record.claimUrl ?? undefined,
    merkleRoot,
  }
}

function normalizeUserReferralActivitiesResponse(
  response: UserReferralActivitiesResponse | UserReferralActivityRecord[] | null,
): {
  data: UserReferralActivityItem[]
  total: number
  pageCount: number
} {
  const records = Array.isArray(response) ? response : response?.data ?? []
  const normalizedData = records.map(normalizeUserReferralActivity)
  const total = Array.isArray(response) ? normalizedData.length : response?.meta?.total ?? normalizedData.length
  const pageCount = Array.isArray(response) ? 1 : response?.meta?.pageCount ?? 1

  return {
    data: normalizedData,
    total,
    pageCount: Math.max(1, pageCount),
  }
}

function normalizeTransactions(
  transactions: Array<{ txHash?: string; createdAt?: string | null; timestamp?: number | null }> | undefined,
  source: 'self' | 'invite',
): TransactionPoint[] {
  return (transactions ?? [])
    .map((tx) => ({
      txHash: tx.txHash ?? '',
      createdAt: toCreatedAt(tx.createdAt, tx.timestamp),
      timestamp: tx.timestamp ?? undefined,
      source,
    }))
    .filter((tx) => tx.txHash.length > 0)
}

function extractReferralCodeFromLink(link?: string | null): string {
  if (!link) {
    return ''
  }

  try {
    const parsedUrl = new URL(link)
    const code = parsedUrl.searchParams.get('code')
    if (code) {
      return code.trim()
    }
  } catch {
    const queryString = link.includes('?') ? link.split('?')[1] : ''
    const params = new URLSearchParams(queryString)
    const code = params.get('code')
    if (code) {
      return code.trim()
    }
  }

  return ''
}

function buildReferralUrl(referralCode?: string | null, referralLink?: string | null): string {
  const code = (referralCode ?? '').trim() || extractReferralCodeFromLink(referralLink)

  if (typeof window === 'undefined' || !code) {
    return referralLink ?? ''
  }

  const internalPath = getInternalLinkHref(`/referral?code=${encodeURIComponent(code)}`)

  if (internalPath.startsWith('#')) {
    return `${window.location.origin}/${internalPath}`
  }

  return `${window.location.origin}${internalPath}`
}

function normalizePointsData(data: TotalPointsResponse | null): NormalizedPointsData {
  if (!data) {
    return {
      referralCode: '',
      referralLink: '',
      inviterCode: '',
      hasInviter: false,
      yourRebateRate: 0,
      isWalletUserActivated: false,
      walletUserBonusRate: 0,
      inviteeDiscountRate: 0,
      currentRewards: 0,
      invitedUsersCount: 0,
      transactionCount: 0,
      inviteTransactionCount: 0,
      myTransactionVolume: 0,
      invitedTransactionVolume: 0,
      txPoints: 0,
      referralPoints: 0,
      totalPoints: 0,
      rewards: 0,
      inviteesCount: 0,
      userTransactionPoint: [],
      invitedTransactionPoint: [],
    }
  }

  const totalPoints = toNumber(data.totalPoints)
  const rewards = toNumber((data as { rewards?: string | number | null }).rewards)
  const walletUserBonusRate = toNumber(data.walletUserBonusRate)

  return {
    referralCode: data.referralCode ?? '',
    referralLink: buildReferralUrl(data.referralCode, data.referralLink),
    inviterCode: data.inviter?.referralCode ?? '',
    hasInviter: Boolean(data.hasInviter),
    yourRebateRate: toNumber(data.yourRebateRate) + walletUserBonusRate,
    isWalletUserActivated: Boolean(data.isWalletUserActivated),
    walletUserBonusRate,
    inviteeDiscountRate: toNumber(data.inviteeDiscountRate),
    currentRewards: toNumber(data.currentRewards ?? rewards),
    invitedUsersCount: data.invitedUsersCount ?? data._count?.invitees ?? 0,
    transactionCount: data.transactionCount ?? 0,
    inviteTransactionCount: data.inviteTransactionCount ?? 0,
    myTransactionVolume: toNumber(data.myTransactionVolume),
    invitedTransactionVolume: toNumber(data.invitedTransactionVolume),
    txPoints: toNumber(data.txPoints ?? data.swapPoints),
    referralPoints: toNumber(data.referralPoints ?? data.invitePoints),
    totalPoints,
    rewards: rewards > 0 ? rewards : totalPoints / 100,
    inviteesCount: data._count?.invitees ?? 0,
    userTransactionPoint: normalizeTransactions(data.userTransactionPoint, 'self'),
    invitedTransactionPoint: normalizeTransactions(data.invitedTransactionPoint, 'invite'),
  }
}

function parseActivityDate(value?: string | number | null): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    const msTimestamp = value > 10_000_000_000 ? value : value * 1000
    const parsedDate = new Date(msTimestamp)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  const parsedNumber = Number(value)
  if (Number.isFinite(parsedNumber) && value.trim() !== '') {
    const msTimestamp = parsedNumber > 10_000_000_000 ? parsedNumber : parsedNumber * 1000
    const parsedDate = new Date(msTimestamp)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function formatActivityDateRange(
  activity: ReferralActivityResponse | null,
  locale: string,
  fallback: string = '--',
): string {
  if (!activity) {
    return fallback
  }

  const startDate = parseActivityDate(activity.startAt ?? activity.startTime ?? activity.startsAt)
  const endDate = parseActivityDate(activity.endAt ?? activity.endTime ?? activity.endsAt)

  if (!startDate || !endDate) {
    return fallback
  }

  return `${new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(startDate)} - ${new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(endDate)}`
}

const CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT = 200

const BOTTOM_SECTION_MARGIN = CONNECT_WALLET_FIXED_BOTTOM_SECTION_HEIGHT - 40

function getStoredReferralCode(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(REFERRAL_CODE_STORAGE_KEY)?.trim() ?? ''
}

export default function Referral() {
  const account = useAccount()
  const { address } = account
  const { t, i18n } = useTranslation()
  const media = useMedia()

  const { height: scrollY } = useScroll()
  const isCompact = useScrollCompact({ scrollY })
  const headerHeight = useAppHeaderHeight()
  const buttonSize = media.md || isCompact ? 'small' : 'medium'

  const [activeTab, setActiveTab] = useState<RecordTab>('rebate')
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [initialCode, setInitialCode] = useState('')
  const [pointsRefetchTrigger, setPointsRefetchTrigger] = useState(0)
  const [hasAppliedReferralCode, setHasAppliedReferralCode] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const [pointsData, setPointsData] = useState<TotalPointsResponse | null>(null)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [activityData, setActivityData] = useState<ReferralActivityResponse | null>(null)
  const [selfRebatesData, setSelfRebatesData] = useState<SelfRebateRecord[]>([])
  const [selfRebatesLoading, setSelfRebatesLoading] = useState(false)
  const [selfRebatesPage, setSelfRebatesPage] = useState(1)
  const [selfRebatesMeta, setSelfRebatesMeta] = useState({ total: 0, pageCount: 1 })
  const [inviteRebatesData, setInviteRebatesData] = useState<InviteRebateRecord[]>([])
  const [inviteRebatesLoading, setInviteRebatesLoading] = useState(false)
  const [inviteRebatesPage, setInviteRebatesPage] = useState(1)
  const [inviteRebatesMeta, setInviteRebatesMeta] = useState({ total: 0, pageCount: 1 })
  const [inviteesData, setInviteesData] = useState<InviteeRecord[]>([])
  const [inviteesLoading, setInviteesLoading] = useState(false)
  const [inviteesPage, setInviteesPage] = useState(1)
  const [inviteesMeta, setInviteesMeta] = useState({ total: 0, pageCount: 1 })
  const [userReferralActivitiesData, setUserReferralActivitiesData] = useState<UserReferralActivityItem[]>([])
  const [userReferralActivitiesLoading, setUserReferralActivitiesLoading] = useState(false)
  const [userReferralActivitiesPage, setUserReferralActivitiesPage] = useState(1)
  const [userReferralActivitiesMeta, setUserReferralActivitiesMeta] = useState({ total: 0, pageCount: 1 })

  useEffect(() => {
    setHasAppliedReferralCode(false)
    setSelfRebatesPage(1)
    setInviteRebatesPage(1)
    setInviteesPage(1)
    setUserReferralActivitiesPage(1)
  }, [address])

  useEffect(() => {
    let cancelled = false

    const fetchPointsData = async () => {
      if (!address) {
        setPointsData(null)
        setPointsLoading(false)
        return
      }

      setPointsLoading(true)

      try {
        const url = `${POINTS_TOTAL_API_URL}?address=${address}`
        const res = await fetch(url)
        const data = (await res.json()) as TotalPointsResponse
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        if (cancelled) {
          return
        }

        setPointsData(data)
      } catch {
        if (cancelled) {
          return
        }

        setPointsData(null)
      } finally {
        if (!cancelled) {
          setPointsLoading(false)
        }
      }
    }

    fetchPointsData()

    return () => {
      cancelled = true
    }
  }, [address, pointsRefetchTrigger])

  useEffect(() => {
    let cancelled = false

    const fetchActivityData = async () => {
      try {
        const res = await fetch(REFERRAL_API_Activity_URL)
        const data = (await res.json()) as ReferralActivityResponse
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        if (cancelled) {
          return
        }

        setActivityData(data)
      } catch {
        if (cancelled) {
          return
        }

        setActivityData(null)
      }
    }

    fetchActivityData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchSelfRebatesData = async () => {
      if (!address) {
        setSelfRebatesData([])
        setSelfRebatesMeta({ total: 0, pageCount: 1 })
        setSelfRebatesLoading(false)
        return
      }

      setSelfRebatesLoading(true)

      try {
        const url = `${SELF_REBATES_API_URL}?address=${address}&page=${selfRebatesPage}&pageSize=10`
        const res = await fetch(url)
        const result = (await res.json()) as SelfRebatesResponse
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        if (cancelled) {
          return
        }

        setSelfRebatesData(result.data || [])
        setSelfRebatesMeta({ total: result.meta.total, pageCount: result.meta.pageCount })
      } catch {
        if (cancelled) {
          return
        }
        setSelfRebatesData([])
        setSelfRebatesMeta({ total: 0, pageCount: 1 })
      } finally {
        if (!cancelled) {
          setSelfRebatesLoading(false)
        }
      }
    }

    fetchSelfRebatesData()

    return () => {
      cancelled = true
    }
  }, [address, selfRebatesPage])

  useEffect(() => {
    let cancelled = false

    const fetchInviteRebatesData = async () => {
      if (!address) {
        setInviteRebatesData([])
        setInviteRebatesMeta({ total: 0, pageCount: 1 })
        setInviteRebatesLoading(false)
        return
      }

      setInviteRebatesLoading(true)

      try {
        const url = `${INVITE_REBATES_API_URL}?address=${address}&page=${inviteRebatesPage}&pageSize=10`
        const res = await fetch(url)
        const result = (await res.json()) as InviteRebatesResponse
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        if (cancelled) {
          return
        }

        setInviteRebatesData(result.data || [])
        setInviteRebatesMeta({ total: result.meta.total, pageCount: result.meta.pageCount })
      } catch {
        if (cancelled) {
          return
        }
        setInviteRebatesData([])
        setInviteRebatesMeta({ total: 0, pageCount: 1 })
      } finally {
        if (!cancelled) {
          setInviteRebatesLoading(false)
        }
      }
    }

    fetchInviteRebatesData()

    return () => {
      cancelled = true
    }
  }, [address, inviteRebatesPage])

  useEffect(() => {
    let cancelled = false

    const fetchInviteesData = async () => {
      if (!address) {
        setInviteesData([])
        setInviteesMeta({ total: 0, pageCount: 1 })
        setInviteesLoading(false)
        return
      }

      setInviteesLoading(true)

      try {
        const url = `${INVITEES_API_URL}?address=${address}&page=${inviteesPage}&pageSize=10`
        const res = await fetch(url)
        const result = (await res.json()) as InviteesResponse
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        if (cancelled) {
          return
        }

        setInviteesData(result.data || [])
        setInviteesMeta({ total: result.meta.total, pageCount: result.meta.pageCount })
      } catch {
        if (cancelled) {
          return
        }
        setInviteesData([])
        setInviteesMeta({ total: 0, pageCount: 1 })
      } finally {
        if (!cancelled) {
          setInviteesLoading(false)
        }
      }
    }

    fetchInviteesData()

    return () => {
      cancelled = true
    }
  }, [address, inviteesPage])

  useEffect(() => {
    let cancelled = false

    const fetchUserReferralActivitiesData = async () => {
      if (!address) {
        setUserReferralActivitiesData([])
        setUserReferralActivitiesMeta({ total: 0, pageCount: 1 })
        setUserReferralActivitiesLoading(false)
        return
      }

      setUserReferralActivitiesLoading(true)

      try {
        const url = `${USER_REFERRAL_ACTIVITIES_API_URL}?address=${address}&page=${userReferralActivitiesPage}&pageSize=10`
        const res = await fetch(url)
        const result = (await res.json()) as UserReferralActivitiesResponse | UserReferralActivityRecord[]
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        if (cancelled) {
          return
        }

        const normalized = normalizeUserReferralActivitiesResponse(result)
        setUserReferralActivitiesData(normalized.data)
        setUserReferralActivitiesMeta({ total: normalized.total, pageCount: normalized.pageCount })
      } catch {
        if (cancelled) {
          return
        }
        setUserReferralActivitiesData([])
        setUserReferralActivitiesMeta({ total: 0, pageCount: 1 })
      } finally {
        if (!cancelled) {
          setUserReferralActivitiesLoading(false)
        }
      }
    }

    fetchUserReferralActivitiesData()

    return () => {
      cancelled = true
    }
  }, [address, userReferralActivitiesPage])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const hashQueryString = location.hash.includes('?') ? location.hash.split('?')[1] : ''
    const hashParams = new URLSearchParams(hashQueryString)
    const code = (searchParams.get('code') ?? hashParams.get('code') ?? '').trim()
    if (code) {
      if (typeof window !== 'undefined' && !getStoredReferralCode()) {
        window.localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code)
      }
      setInitialCode(code)
      setShowReferralModal(true)
    }
  }, [location.hash, location.search])

  const normalizedPointsData = useMemo(() => normalizePointsData(pointsData), [pointsData])
  const hasInviter = normalizedPointsData.hasInviter || hasAppliedReferralCode

  const referralCode = normalizedPointsData.referralCode
  const referralUrl =
    normalizedPointsData.referralLink ||
    (typeof window !== 'undefined' && referralCode ? `${window.location.origin}/referral?code=${referralCode}` : '')

  const mergedTransactions = useMemo(
    () => [...normalizedPointsData.userTransactionPoint, ...normalizedPointsData.invitedTransactionPoint],
    [normalizedPointsData.userTransactionPoint, normalizedPointsData.invitedTransactionPoint],
  )

  const currentTransactions = useMemo(() => {
    if (activeTab === 'rules') {
      return []
    }
    if (activeTab === 'invitees') {
      return normalizedPointsData.invitedTransactionPoint
    }
    if (activeTab === 'inviteCode') {
      return mergedTransactions
    }
    return normalizedPointsData.userTransactionPoint
  }, [
    activeTab,
    mergedTransactions,
    normalizedPointsData.invitedTransactionPoint,
    normalizedPointsData.userTransactionPoint,
  ])

  const tableLoading = pointsLoading
  const activityPeriod = useMemo(
    () => formatActivityDateRange(activityData, i18n.language || 'en-US'),
    [activityData, i18n.language],
  )
  const handleUserReferralActivityClaimed = useCallback((itemId: string) => {
    setUserReferralActivitiesData((prev) => {
      let changed = false
      const next = prev.map((item) => {
        if (item.id !== itemId || item.claimed) {
          return item
        }
        changed = true
        return { ...item, claimed: true, claimable: false }
      })
      return changed ? next : prev
    })
  }, [])

  return (
    <Flex
      flexDirection="column"
      gap="$spacing40"
      maxWidth="$maxWidth1200"
      width="100%"
      p="$spacing24"
      pt="$none"
      position="relative"
      mb={BOTTOM_SECTION_MARGIN}
      $sm={{ p: '$spacing8' }}
    >
      <Flex
        backgroundColor="$surface1"
        marginTop="$spacing8"
        paddingTop="$spacing16"
        zIndex="$header"
        $platform-web={{
          position: 'sticky',
          top: headerHeight,
        }}
        gap={isCompact ? '$gap12' : '$spacing40'}
        transition="gap 200ms ease"
      >
        <Flex gap="$spacing16">
          <Flex row gap="$spacing12" justifyContent="space-between" alignItems="center">
            <ReferralAddressDisplay isCompact={isCompact} />
            <Flex row gap="$spacing8" alignItems="center">
              <Button
                size={buttonSize}
                transition={HEADER_TRANSITION}
                emphasis="secondary"
                icon={hasInviter ? undefined : <Plus />}
                onPress={() => {
                  if (hasInviter) {
                    navigate('/swap')
                    return
                  }

                  setInitialCode(normalizedPointsData.inviterCode || getStoredReferralCode())
                  setShowReferralModal(true)
                }}
              >
                {hasInviter
                  ? t('referral.startTrading')
                  : media.sm
                    ? t('common.add.label')
                    : t('referral.enterReferralCode')}
              </Button>
            </Flex>
          </Flex>
        </Flex>
        <Separator />
      </Flex>
      <Flex flex={1} position="relative">
        <Flex gap="$spacing8" width="100%" mb="$spacing24">
          <Flex
            row
            justifyContent="space-between"
            alignItems="flex-start"
            width="100%"
            gap="$spacing24"
            $sm={{ flexDirection: 'column', gap: '$spacing8' }}
          >
            <Flex gap="$spacing8" flex={1} minWidth={0}>
              <Text variant="heading2" color="$neutral1" flex={1} minWidth={0}>
                {t('referral.defaultTitle')}
              </Text>
              <Text variant="body2" color="$neutral2">
                {t('referral.defaultDescription')}
              </Text>
            </Flex>
            <Flex gap="$spacing2" alignItems="flex-end" flexShrink={0} $sm={{ alignItems: 'flex-start' }}>
              <Text variant="body3" color="$neutral2">
                {t('referral.activityPeriodLabel')}
              </Text>
              <Text variant="subheading2" color="$neutral1" textAlign="right" $sm={{ textAlign: 'left' }}>
                {activityPeriod}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <ReferralOverview
          yourRebateRate={normalizedPointsData.yourRebateRate}
          inviteeDiscountRate={normalizedPointsData.inviteeDiscountRate}
          currentRewards={normalizedPointsData.currentRewards}
          referralCode={referralCode}
          referralLink={referralUrl}
          invitedUsersCount={normalizedPointsData.invitedUsersCount}
          inviteTransactionCount={normalizedPointsData.inviteTransactionCount}
          myTransactionVolume={normalizedPointsData.myTransactionVolume}
          invitedTransactionVolume={normalizedPointsData.invitedTransactionVolume}
          onOpenActivitiesTab={() => setActiveTab('activities')}
        />
      </Flex>
      <Flex
        position="relative"
        width="100%"
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        gap="$spacing20"
        flexDirection="column"
      >
        <Flex gap="$spacing16" width="100%">
          <Flex row gap="$spacing24" borderBottomWidth={1} borderColor="$surface3" pb="$spacing8" flexWrap="wrap">
            {[
              { key: 'rebate', label: t('referral.tabs.rebateRecords') },
              { key: 'invitees', label: t('referral.tabs.inviteRebateRecords') },
              { key: 'inviteCode', label: t('referral.tabs.inviteRecords') },
              { key: 'activities', label: t('referral.tabs.activities', 'Activities') },
              { key: 'rules', label: t('referral.tabs.rules') },
            ].map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <Flex
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as RecordTab)}
                  cursor="pointer"
                  py="$spacing4"
                  borderBottomWidth={isActive ? 2 : 0}
                  borderColor="$neutral1"
                  mb={-9}
                >
                  <Text variant="subheading2" color={isActive ? '$neutral1' : '$neutral2'}>
                    {tab.label}
                  </Text>
                </Flex>
              )
            })}
          </Flex>

          <Flex>
            {activeTab === 'rules' ? (
              <Rules />
            ) : activeTab === 'rebate' ? (
              <SelfRebatesTable
                data={selfRebatesData}
                loading={selfRebatesLoading}
                page={selfRebatesPage}
                pageCount={selfRebatesMeta.pageCount}
                total={selfRebatesMeta.total}
                onPageChange={setSelfRebatesPage}
              />
            ) : activeTab === 'invitees' ? (
              <InviteRebatesTable
                data={inviteRebatesData}
                loading={inviteRebatesLoading}
                page={inviteRebatesPage}
                pageCount={inviteRebatesMeta.pageCount}
                total={inviteRebatesMeta.total}
                onPageChange={setInviteRebatesPage}
              />
            ) : activeTab === 'inviteCode' ? (
              <InviteesTable
                data={inviteesData}
                loading={inviteesLoading}
                page={inviteesPage}
                pageCount={inviteesMeta.pageCount}
                total={inviteesMeta.total}
                onPageChange={setInviteesPage}
              />
            ) : activeTab === 'activities' ? (
              <UserReferralActivitiesTable
                data={userReferralActivitiesData}
                loading={userReferralActivitiesLoading}
                page={userReferralActivitiesPage}
                pageCount={userReferralActivitiesMeta.pageCount}
                total={userReferralActivitiesMeta.total}
                onPageChange={setUserReferralActivitiesPage}
                onClaimed={handleUserReferralActivityClaimed}
              />
            ) : (
              <PointTxList transactions={currentTransactions} loading={tableLoading} />
            )}
          </Flex>
        </Flex>
      </Flex>

      <ReferralCodeModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        initialCode={initialCode}
        inviteeDiscountRate={normalizedPointsData.inviteeDiscountRate}
        onApplied={() => {
          setHasAppliedReferralCode(true)
          setPointsRefetchTrigger((value) => value + 1)
        }}
      />
    </Flex>
  )
}
