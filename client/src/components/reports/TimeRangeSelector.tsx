import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, subWeeks, subMonths, isEqual } from "date-fns";

export type TimeRangeValue = '24h' | '7d' | '30d' | 'custom';
export type DateRange = { startDate: Date | undefined; endDate: Date | undefined };

interface TimeRangeSelectorProps {
  onRangeChange: (range: DateRange) => void;
}

export function TimeRangeSelector({ onRangeChange }: TimeRangeSelectorProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('24h');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Helper function to update date range based on selection
  const updateDateRange = (range: TimeRangeValue) => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = now;

    switch (range) {
      case '24h':
        start = subDays(now, 1);
        break;
      case '7d':
        start = subWeeks(now, 1);
        break;
      case '30d':
        start = subMonths(now, 1);
        break;
      case 'custom':
        // Keep current start and end dates
        return;
      default:
        start = subDays(now, 1);
    }

    setStartDate(start);
    setEndDate(end);
    onRangeChange({ startDate: start, endDate: end });
  };

  // Update date range when preset is changed
  useEffect(() => {
    if (timeRange !== 'custom') {
      updateDateRange(timeRange);
    }
  }, [timeRange]);

  // Handle custom date selection
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setIsStartDateOpen(false);
    
    // If the selected start date is after the end date, adjust the end date
    if (date && endDate && date > endDate) {
      setEndDate(date);
    }
    
    // When in custom mode, trigger the range change manually
    if (timeRange === 'custom') {
      onRangeChange({ startDate: date, endDate });
    } else {
      // If user selects a custom date, switch to custom mode
      setTimeRange('custom');
      onRangeChange({ startDate: date, endDate });
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setIsEndDateOpen(false);
    
    // If the selected end date is before the start date, adjust the start date
    if (date && startDate && date < startDate) {
      setStartDate(date);
    }
    
    // When in custom mode, trigger the range change manually
    if (timeRange === 'custom') {
      onRangeChange({ startDate, endDate: date });
    } else {
      // If user selects a custom date, switch to custom mode
      setTimeRange('custom');
      onRangeChange({ startDate, endDate: date });
    }
  };

  // Handle preset range selection
  const handleRangeChange = (value: string) => {
    setTimeRange(value as TimeRangeValue);
    if (value !== 'custom') {
      updateDateRange(value as TimeRangeValue);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal w-full sm:w-auto"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateSelect}
            initialFocus
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>

      <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-start text-left font-normal w-full sm:w-auto"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateSelect}
            initialFocus
            disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
          />
        </PopoverContent>
      </Popover>

      <Select value={timeRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Time Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Last 24 Hours</SelectItem>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}