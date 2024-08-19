import * as React from "react";
import { styled } from "@mui/system";
import dayjs, { Dayjs } from "dayjs";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useEffect } from "react";

interface DateValueProps {
  date: string;
  labelName: string;
  onDateChange: (newDate: string) => void;
}

export default function DatePickerValue({
  date,
  labelName,
  onDateChange,
}: DateValueProps) {
  const [value, setValue] = React.useState<Dayjs | null>(dayjs(date));

  useEffect(() => {
    if (value) {
      onDateChange(value.format("YYYY-MM-DD")); // Call the function to update the parent state
    }
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={["DatePicker", "DatePicker"]}>
        <DatePicker
          label={labelName}
          value={value}
          onChange={(newValue) => setValue(newValue)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              "& fieldset": {
                borderColor: "gray",
              },
              "&:hover fieldset": {
                borderColor: "gray",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#15AC5B",
                borderWidth: "1px",
              },
            },
            "& .MuiInputBase-root": {
              fontSize: "18px",
              fontWeight: 485,
              color: "#7D7D7D",
            },
            "& .MuiInputLabel-root": {
              fontSize: "18px",
              fontWeight: 485,
              color: "#7D7D7D",
            },
            "& .MuiSvgIcon-root": {
              color: "#7D7D7D",
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
