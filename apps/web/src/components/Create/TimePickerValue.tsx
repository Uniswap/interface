import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

interface TimeValueProps {
    labelName: string
}

export default function TimePickerValue({ labelName }: TimeValueProps) {
    const [value, setValue] = React.useState<Dayjs | null>(dayjs('2022-04-17T12:00'));

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={['TimePicker', 'TimePicker']}>
                <TimePicker
                    label={labelName}
                    value={value}
                    onChange={(newValue) => setValue(newValue)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '20px',
                            '& fieldset': {
                                borderColor: 'gray',
                            },
                            '&:hover fieldset': {
                                borderColor: 'gray',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: '#FC72FF',
                                borderWidth: '1px',
                            },
                        },
                        '& .MuiInputBase-root': {
                            fontSize: '18px',
                            fontWeight: 485,
                            color: '#7D7D7D',
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '18px',
                            fontWeight: 485,
                            color: '#7D7D7D',
                        },
                        // '& .MuiInputBase-root': {
                        //   borderRadius: '12px', // This might also be needed to ensure the input part has the same border radius
                        // },
                    }}
                />
            </DemoContainer>
        </LocalizationProvider>
    );
}
