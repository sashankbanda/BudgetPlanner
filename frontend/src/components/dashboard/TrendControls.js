// frontend/src/components/dashboard/TrendControls.js

import React from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { format } from 'date-fns';

const formatDateForInput = (date) => {
    if (!date) return '';
    try {
        return format(date, 'yyyy-MM-dd');
    } catch (error) {
        return '';
    }
};

const TrendControls = ({ trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange }) => {
    const handleDateChange = (field, value) => {
        if (!value) return;
        const newDate = new Date(value + 'T00:00:00');

        setTrendDateRange(prev => {
            const newRange = { ...prev, [field]: newDate };
            if (field === 'from' && newRange.to && newDate > newRange.to) {
                newRange.to = newDate;
            }
            if (field === 'to' && newRange.from && newDate < newRange.from) {
                newRange.from = newDate;
            }
            return newRange;
        });
    };

    return (
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
                <Label htmlFor="start-date" className="text-sm text-gray-400">From</Label>
                <Input
                    id="start-date"
                    type="date"
                    className="glass-input w-[150px]"
                    value={formatDateForInput(trendDateRange.from)}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                />
            </div>
             <div className="flex items-center gap-2">
                <Label htmlFor="end-date" className="text-sm text-gray-400">To</Label>
                <Input
                    id="end-date"
                    type="date"
                    className="glass-input w-[150px]"
                    value={formatDateForInput(trendDateRange.to)}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                />
            </div>
            <ToggleGroup type="single" value={trendPeriod} onValueChange={(value) => value && setTrendPeriod(value)} className="glass-effect rounded-md">
                <ToggleGroupItem value="daily" className="glass-button data-[state=on]:electric-glow">Daily</ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="glass-button data-[state=on]:electric-glow">Weekly</ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="glass-button data-[state=on]:electric-glow">Monthly</ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
};

export default TrendControls;