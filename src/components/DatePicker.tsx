import { rgba } from 'polished'
import Picker from 'react-date-picker'
import styled, { css } from 'styled-components'

const Container = styled.div`
  // custom css
  .custom-date-picker {
    width: 100%;
    //input
    .react-date-picker__wrapper {
      height: 0;
      width: 0;
      opacity: 0;
      span {
        display: none;
      }
    }
    // always show
    .react-date-picker__calendar--closed {
      display: block !important;
    }
    .react-date-picker__calendar--open {
      height: fit-content !important;
    }
    .react-date-picker__calendar {
      position: unset !important;
      width: fit-content;
    }
    .custom-calendar {
      text-align: center;
      width: 100%;
      background: transparent;
      border: none;

      button {
        background-color: transparent;
        color: ${({ theme }) => theme.text};
        margin: 0;
        border: 0;
        outline: none;
        font-weight: 500;
        font-size: 12px;
        &:disabled {
          color: ${({ theme }) => theme.subText};
          cursor: not-allowed;
        }
      }

      .react-calendar__month-view__weekdays__weekday {
        line-height: 16px;
        color: ${({ theme }) => theme.subText};
        text-transform: none;
        abbr {
          text-decoration: none;
        }
      }

      .react-calendar__decade-view,
      .react-calendar__century-view,
      .react-calendar__year-view {
        button.react-calendar__tile--hasActive,
        button:not(:disabled):hover {
          color: ${({ theme }) => theme.primary};
          font-weight: bold;
        }
        button {
          padding: 14px 0.5em;
        }
      }

      .react-calendar__navigation {
        margin: 0;
        font-weight: 500;
        height: auto;
        // cur time
        .react-calendar__navigation__label {
          height: 24px;
          font-size: 14px;
          color: ${({ theme }) => theme.text};
          background-color: transparent;
          &:hover {
            background-color: transparent;
          }
        }
        // arrow
        .react-calendar__navigation__arrow {
          font-size: 20px;
          background-color: ${({ theme }) => theme.background};
          color: ${({ theme }) => theme.text};
          border-radius: 100%;
          padding-bottom: 12px;
          width: 24px;
          height: 24px;
          line-height: 1;
          min-width: unset;
          &:disabled {
            background-color: ${({ theme }) => rgba(theme.background, 0.4)};
          }
        }
      }

      // day
      .react-calendar__month-view__days {
        button {
          height: 34px;
          padding: 0;
          abbr {
            width: 28px;
            height: 28px;
            line-height: 28px;
            border-radius: 100%;
            display: block;
            margin: auto;
            font-weight: 500;
            font-size: 14px;
          }
          &.react-calendar__tile--now abbr {
            background-color: ${({ theme }) => theme.buttonGray};
          }
          &.react-calendar__tile--active,
          &:not(:disabled):hover {
            abbr {
              color: ${({ theme }) => theme.textReverse};
              background-color: ${({ theme }) => theme.primary};
            }
          }
          &.react-calendar__month-view__days__day--neighboringMonth {
            font-style: italic;
          }
        }
      }
    }
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
      ${css`
        .custom-date-picker .custom-calendar .react-calendar__month-view__days {
          button {
            height: 48px;
            abbr {
              width: 48px;
              height: 48px;
              line-height: 48px;
            }
          }
        }
      `}
  `}
`
export default function DatePicker({ onChange, value }: { value: Date; onChange: (date: Date) => void }) {
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return (
    <Container>
      <Picker
        calendarIcon={null}
        clearIcon={null}
        autoFocus
        calendarClassName="custom-calendar"
        className="custom-date-picker"
        value={value}
        closeCalendar={false}
        onChange={onChange}
        minDate={minDate}
      />
    </Container>
  )
}
