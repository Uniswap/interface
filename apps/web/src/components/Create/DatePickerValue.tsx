import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface DateValueProps {
  date: string
  labelName: string
}

export default function DatePickerValue({ date, labelName }: DateValueProps) {
  const [value, setValue] = React.useState<Dayjs | null>(dayjs(date));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={['DatePicker', 'DatePicker']} sx={{ borderRadius: "20px", borderColor: 'black' }}>
        <DatePicker
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
