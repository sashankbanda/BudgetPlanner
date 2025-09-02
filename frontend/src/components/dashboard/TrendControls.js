import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';

const TrendControls = ({ trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange }) => {
    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="w-[280px] justify-start text-left font-normal glass-button"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {trendDateRange?.from ? (
                            trendDateRange.to ? (
                                <>
                                    {format(trendDateRange.from, "LLL dd, y")} - {format(trendDateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(trendDateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-effect border-0 text-white" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={trendDateRange?.from}
                        selected={trendDateRange}
                        onSelect={setTrendDateRange}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
            <ToggleGroup type="single" value={trendPeriod} onValueChange={(value) => value && setTrendPeriod(value)} className="glass-effect rounded-md">
                <ToggleGroupItem value="daily" className="glass-button data-[state=on]:electric-glow">Daily</ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="glass-button data-[state=on]:electric-glow">Weekly</ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="glass-button data-[state=on]:electric-glow">Monthly</ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
};

export default TrendControls;