import { Trans, t } from '@lingui/macro'
import { debounce } from 'lodash'
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useAckTelegramSubscriptionStatusMutation, useLazyGetConnectedWalletQuery } from 'services/notification'
import styled, { css } from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Checkbox from 'components/CheckBox'
import Column from 'components/Column'
import { Telegram } from 'components/Icons'
import MailIcon from 'components/Icons/MailIcon'
import Row from 'components/Row'
import ActionButtons from 'components/SubscribeButton/NotificationPreference/ActionButtons'
import Header from 'components/SubscribeButton/NotificationPreference/Header'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useNotification, { Topic } from 'hooks/useNotification'
import useTheme from 'hooks/useTheme'
import { useNotify } from 'state/application/hooks'
import { pushUnique } from 'utils'
import { subscribeTelegramSubscription } from 'utils/firebase'
import getShortenAddress from 'utils/getShortenAddress'

const Wrapper = styled.div`
  margin: 0;
  padding: 30px 24px;
  width: 100%;
  display: flex;
  gap: 18px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToMedium`
     gap: 14px;
     padding: 24px 16px;
  `}
`

const Label = styled.p`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
`

const InputWrapper = styled.div<{ isInNotificationCenter: boolean }>`
  position: relative;
  ${({ isInNotificationCenter }) =>
    isInNotificationCenter &&
    css`
      max-width: 50%;
      ${({ theme }) => theme.mediaWidth.upToMedium`
        max-width: 100%;
      `}
    `};
`
const CheckIcon = styled(Check)`
  position: absolute;
  right: 13px;
  top: 0;
  bottom: 0;
  margin: auto;
`
const Input = styled.input<{ $borderColor: string }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: none;
  outline: none;
  border-radius: 20px;
  width: 100%;
  padding: 12px 14px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: border 0.5s;
  border: ${({ theme, $borderColor }) => `1px solid ${$borderColor || theme.border}`};
  ::placeholder {
    color: ${({ theme }) => theme.border};
    font-size: 12px;
  }
`

const TopicItem = styled.label`
  display: flex;
  gap: 14px;
  font-weight: 500;
  align-items: center;
  flex-basis: 45%;

  ${({ theme }) => theme.mediaWidth.upToMedium`
     flex-basis: unset;
  `}
`

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  width: 100%;
`

const TopicItemHeader = styled.label`
  color: ${({ theme }) => theme.text};
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
`

const ListGroupWrapper = styled.div<{ isInNotificationCenter: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  ${({ isInNotificationCenter }) =>
    isInNotificationCenter &&
    css`
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
    `}
  ${({ theme }) => theme.mediaWidth.upToMedium`
     flex-direction: column;
  `}
`

// const Option = styled(Row)<{ active: boolean }>`
//   padding: 10px 16px;
//   gap: 10px;
//   color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
//   :hover {
//     color: ${({ theme }) => theme.primary};
//     background: ${({ theme }) => rgba(theme.subText, 0.1)};
//   }
// `

enum TAB {
  EMAIL,
  TELEGRAM,
}

// const NOTIFICATION_OPTIONS = [
//   {
//     label: 'Email',
//     value: TAB.EMAIL,
//   },
//   {
//     label: 'Telegram',
//     value: TAB.TELEGRAM,
//   },
// ]

const noop = () => {
  //
}
const isEmailValid = (value: string) => value.match(/\S+@\S+\.\S+/)

const sortGroup = (arr: Topic[]) => [...arr].sort((x, y) => y.priority - x.priority)

function NotificationPreference({
  header,
  isOpen,
  isInNotificationCenter = false,
  toggleModal = noop,
}: {
  header?: ReactNode
  isOpen: boolean
  isInNotificationCenter?: boolean
  toggleModal?: () => void
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const {
    isLoading,
    saveNotification,
    refreshTopics,
    topicGroups: topicGroupsGlobal,
    userInfo,
    unsubscribeAll,
  } = useNotification()

  const [topicGroups, setTopicGroups] = useState<Topic[]>([])

  const notify = useNotify()
  const { mixpanelHandler } = useMixpanel()

  const [inputEmail, setInputEmail] = useState('')
  const [emailPendingVerified, setEmailPendingVerified] = useState('')
  const [errorInput, setErrorInput] = useState<{ msg: string; type: 'error' | 'warn' } | null>(null)

  const [activeTab] = useState<TAB>(TAB.EMAIL)
  const [selectedTopic, setSelectedTopic] = useState<number[]>([])

  const isEmailTab = activeTab === TAB.EMAIL
  const isTelegramTab = activeTab === TAB.TELEGRAM

  const hasErrorInput = errorInput?.type === 'error'

  const isNewUserQualified = !userInfo.email && !userInfo.telegram && !!inputEmail && !hasErrorInput
  const notFillEmail = !inputEmail && isEmailTab

  const validateInput = useCallback((value: string, required = false) => {
    const isValid = isEmailValid(value)
    const errMsg = t`Please input a valid email address`
    const msg = (value.length && !isValid) || (required && !value.length) ? errMsg : ''
    setErrorInput(msg ? { msg, type: 'error' } : null)
  }, [])

  const updateTopicGroupsLocal = useCallback(
    (subIds: number[], unsubIds: number[]) => {
      const newTopicGroups = topicGroupsGlobal.map(group => {
        const newTopics = group.topics.map((topic: Topic) => ({
          ...topic,
          isSubscribed: subIds.includes(topic.id) ? true : unsubIds.includes(topic.id) ? false : topic.isSubscribed,
        }))
        return { ...group, topics: newTopics, isSubscribed: newTopics?.every(e => e.isSubscribed) }
      })
      setTopicGroups(sortGroup(newTopicGroups))
    },
    [topicGroupsGlobal],
  )

  const [ackTelegramSubscriptionStatus] = useAckTelegramSubscriptionStatusMutation()
  useEffect(() => {
    if (!account) return
    const unsubscribe = subscribeTelegramSubscription(account, data => {
      if (data?.isSuccessfully) {
        refreshTopics()
        ackTelegramSubscriptionStatus(account).catch(console.error)
      }
    })
    return () => unsubscribe?.()
  }, [account, refreshTopics, ackTelegramSubscriptionStatus])

  useEffect(() => {
    if (isOpen) {
      setEmailPendingVerified('')
      setErrorInput(null)
      setInputEmail(userInfo.email)
    }
  }, [userInfo, activeTab, isOpen])

  useEffect(() => {
    setTimeout(
      () => {
        setSelectedTopic(isOpen ? topicGroupsGlobal.filter(e => e.isSubscribed).map(e => e.id) : [])
        if (isOpen) {
          setTopicGroups(sortGroup(topicGroupsGlobal))
        }
      },
      isOpen ? 0 : 400,
    )
  }, [isOpen, topicGroupsGlobal])

  const getDiffChangeTopics = useCallback(
    (topicGroups: Topic[]) => {
      let unsubscribeIds: number[] = []
      let subscribeIds: number[] = []
      let unsubscribeNames: string[] = []
      let subscribeNames: string[] = []
      topicGroups.forEach(group => {
        const isChecked = selectedTopic.includes(group.id)
        // unsubscribe
        if (group.isSubscribed && !isChecked) {
          group.topics.forEach((topic: Topic) => {
            unsubscribeIds = pushUnique(unsubscribeIds, topic.id)
            unsubscribeNames = pushUnique(unsubscribeNames, topic.code)
          })
        }
        // subscribe
        if (!group.isSubscribed && isChecked) {
          group.topics.forEach((topic: Topic) => {
            subscribeIds = pushUnique(subscribeIds, topic.id)
            subscribeNames = pushUnique(subscribeNames, topic.code)
          })
        }
      })

      const isChangeEmail =
        !hasErrorInput &&
        inputEmail &&
        userInfo.email !== inputEmail &&
        selectedTopic.length &&
        inputEmail !== emailPendingVerified
      return {
        subscribeIds,
        unsubscribeIds,
        unsubscribeNames,
        subscribeNames,
        hasChanged: subscribeIds.length + unsubscribeIds.length !== 0 || Boolean(isChangeEmail),
      }
    },
    [selectedTopic, inputEmail, userInfo, emailPendingVerified, hasErrorInput],
  )

  const onSave = async () => {
    try {
      if (isEmailTab) validateInput(inputEmail, true)
      if (isLoading || hasErrorInput || notFillEmail) return

      const { unsubscribeIds, subscribeIds, subscribeNames, unsubscribeNames } = getDiffChangeTopics(topicGroupsGlobal)
      if (subscribeNames.length) {
        mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_SELECT_TOPIC, { topics: subscribeNames })
      }
      if (unsubscribeNames.length) {
        mixpanelHandler(MIXPANEL_TYPE.NOTIFICATION_DESELECT_TOPIC, { topics: unsubscribeNames })
      }
      const isChangeEmailOnly = !unsubscribeIds.length && !subscribeIds.length && inputEmail !== userInfo.email
      if (inputEmail !== userInfo.email) setEmailPendingVerified(inputEmail)
      const verificationUrl = await saveNotification({
        subscribeIds,
        unsubscribeIds,
        email: inputEmail,
        isEmail: isEmailTab,
        isChangeEmailOnly,
        isTelegram: isTelegramTab,
      })
      updateTopicGroupsLocal(subscribeIds, unsubscribeIds)
      if (isTelegramTab && verificationUrl) {
        window.open(`https://${verificationUrl}`)
        return
      }

      const needVerify = subscribeIds.length || (userInfo.email && userInfo.email !== inputEmail)
      notify(
        {
          title: needVerify ? t`Verify Your Email Address` : t`Notification Preferences`,
          summary: needVerify
            ? t`A verification email has been sent to your email address. Please check your inbox to verify your email.`
            : t`Your notification preferences have been saved successfully`,
          type: needVerify ? NotificationType.WARNING : NotificationType.SUCCESS,
          icon: <MailIcon color={needVerify ? theme.warning : theme.primary} />,
        },
        10000,
      )
      toggleModal()
      if (isInNotificationCenter) {
        refreshTopics()
      }
    } catch (error) {
      notify({
        title: t`Save Error`,
        summary: t`Error occur, please try again`,
        type: NotificationType.ERROR,
      })
      console.log(error)
    }
  }

  const [getConnectedWallet] = useLazyGetConnectedWalletQuery()
  const checkEmailExist = useCallback(
    async (email: string) => {
      try {
        if (!isEmailValid(email) || email === userInfo?.email) return
        const { data: walletAddress } = await getConnectedWallet(email)
        if (walletAddress && walletAddress !== account?.toLowerCase()) {
          setErrorInput({
            msg: t`Your email has already been linked to wallet ${getShortenAddress(
              walletAddress,
              false,
            )}, it will be unlinked automatically if you proceed`,
            type: 'warn',
          })
        }
      } catch (error) {}
    },
    [account, getConnectedWallet, userInfo?.email],
  )

  const debouncedCheckEmail = useMemo(() => debounce((email: string) => checkEmailExist(email), 500), [checkEmailExist])

  const onChangeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setInputEmail(value)
    validateInput(value)
    debouncedCheckEmail(value)
  }

  const onChangeTopic = (topicId: number) => {
    setSelectedTopic(
      selectedTopic.includes(topicId) ? selectedTopic.filter(el => el !== topicId) : [...selectedTopic, topicId],
    )
  }

  const onToggleAllTopic = () => {
    setSelectedTopic(selectedTopic.length === topicGroups.length ? [] : topicGroups.map(e => e.id))
  }

  const autoSelect = useRef(false)
  useEffect(() => {
    if (isNewUserQualified && !autoSelect.current) {
      // auto select all checkbox when user no register any topic before and fill a valid email
      // this effect will call once
      setSelectedTopic(topicGroups.map(e => e.id))
      autoSelect.current = true
    }
  }, [isNewUserQualified, topicGroups])

  const isVerifiedEmail = userInfo?.email && inputEmail === userInfo?.email
  const isVerifiedTelegram = userInfo?.telegram
  const hasTopicSubscribed = topicGroups.some(e => e.isSubscribed)

  const disableButtonSave = useMemo(() => {
    if (isTelegramTab) return isLoading
    if (isLoading || notFillEmail || hasErrorInput) return true
    return !getDiffChangeTopics(topicGroups).hasChanged
  }, [getDiffChangeTopics, isLoading, notFillEmail, isTelegramTab, topicGroups, hasErrorInput])

  const disableCheckbox = !account || notFillEmail || hasErrorInput
  const errorColor = hasErrorInput ? theme.red : errorInput?.type === 'warn' ? theme.warning : theme.border

  const subscribeAtLeast1Topic = topicGroupsGlobal.some(e => e.isSubscribed)
  const onUnsubscribeAll = () => {
    if (!subscribeAtLeast1Topic) return
    unsubscribeAll()
    toggleModal()
    notify(
      {
        title: t`Unsubscribe Successfully`,
        summary: t`You have successfully unsubscribe from further receiving email notification from us`,
        type: NotificationType.SUCCESS,
        icon: <MailIcon color={theme.primary} />,
      },
      10_000,
    )
  }

  const renderTableHeader = () => {
    return (
      <TopicItemHeader htmlFor="selectAll">
        <Text fontSize={'14px'}>
          <Trans>Notification Preferences</Trans>
        </Text>
        <Flex style={{ gap: '4px', alignItems: 'center' }}>
          <Checkbox
            disabled={disableCheckbox}
            id="selectAll"
            borderStyle
            onChange={onToggleAllTopic}
            style={{ width: 14, height: 14 }}
            checked={topicGroups.length === selectedTopic.length}
          />
          <Text color={theme.subText} fontSize={'12px'}>
            <Trans>Select All</Trans>
          </Text>
        </Flex>
      </TopicItemHeader>
    )
  }

  return (
    <Wrapper>
      {header || <Header toggleModal={toggleModal} />}
      {/* <RowBetween gap="14px">
          <Label>
            <Trans>Select mode of notification</Trans>
          </Label>
          <Select
            style={{
              flex: 1,
              borderRadius: 40,
              color: theme.text,
              fontSize: 14,
              fontWeight: 500,
              height: 38,
              paddingLeft: 20,
            }}
            menuStyle={{ background: theme.background }}
            options={NOTIFICATION_OPTIONS}
            value={activeTab}
            optionRender={option => (
              <Option active={activeTab === option?.value} key={option?.value}>
                {option?.value === TAB.EMAIL ? <Mail size={15} /> : <Telegram size={15} />} {option?.label}
              </Option>
            )}
            onChange={setActiveTab}
          />
        </RowBetween> */}

      {isEmailTab ? (
        <Column>
          <Label>
            <Trans>Enter your email address to receive notifications</Trans>
          </Label>
          <InputWrapper isInNotificationCenter={isInNotificationCenter}>
            <Input
              $borderColor={errorColor}
              value={inputEmail}
              placeholder="example@email.com"
              onChange={onChangeInput}
            />
            {isVerifiedEmail && hasTopicSubscribed && <CheckIcon color={theme.primary} />}
          </InputWrapper>
          {errorInput?.msg && <Label style={{ color: errorColor, margin: '7px 0px 0px 0px' }}>{errorInput?.msg}</Label>}
        </Column>
      ) : (
        <Flex
          flexDirection="column"
          alignItems={'center'}
          color={theme.subText}
          style={{ gap: 10, margin: '10px 0px' }}
        >
          <Telegram size={24} />

          {isVerifiedTelegram ? (
            <Row align="center" justify="center" gap="3px">
              <Text fontSize={15}>
                <Trans>
                  Your Verified Account:{' '}
                  <Text as="span" color={theme.text}>
                    @{userInfo?.telegram}
                  </Text>
                </Trans>
              </Text>
              <Check color={theme.primary} />
            </Row>
          ) : (
            <Text fontSize={15}>
              <Trans>Click Get Started to subscribe to Telegram</Trans>
            </Text>
          )}
        </Flex>
      )}
      <Divider />
      <Column gap="16px">
        {renderTableHeader()}
        <ListGroupWrapper isInNotificationCenter={!!isInNotificationCenter}>
          {topicGroups.map(topic => (
            <TopicItem
              key={topic.id}
              htmlFor={`topic${topic.id}`}
              style={{ alignItems: isInNotificationCenter ? 'flex-start' : 'center' }}
            >
              <Checkbox
                disabled={disableCheckbox}
                borderStyle
                checked={selectedTopic.includes(topic.id)}
                id={`topic${topic.id}`}
                style={{ width: 14, height: 14, minWidth: 14 }}
                onChange={() => onChangeTopic(topic.id)}
              />
              <Column gap="10px">
                <Text color={theme.text} fontSize={14}>
                  <Trans>{topic.name}</Trans>
                </Text>
                {isInNotificationCenter && (
                  <Text color={theme.subText} fontSize={12}>
                    <Trans>{topic.description}</Trans>
                  </Text>
                )}
              </Column>
            </TopicItem>
          ))}
        </ListGroupWrapper>
      </Column>
      <ActionButtons
        isHorizontal={!!isInNotificationCenter}
        disableButtonSave={disableButtonSave}
        onSave={onSave}
        isTelegramTab={isTelegramTab}
        subscribeAtLeast1Topic={subscribeAtLeast1Topic}
        onUnsubscribeAll={onUnsubscribeAll}
        isLoading={isLoading}
      />
    </Wrapper>
  )
}
export default NotificationPreference
