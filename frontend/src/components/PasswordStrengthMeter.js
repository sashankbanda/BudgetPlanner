import React from 'react';
import { cn } from '../lib/utils';

const PasswordStrengthMeter = ({ password }) => {
    const calculateStrength = () => {
        let score = 0;
        if (!password) return 0;

        // Award points for different criteria
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        return score;
    };

    const strength = calculateStrength();
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["bg-red-700", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-5 gap-x-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-1 rounded-full transition-colors",
                            index < strength ? strengthColors[strength - 1] : "bg-gray-700"
                        )}
                    />
                ))}
            </div>
            {password.length > 0 && (
                 <p className="text-xs text-right" style={{ color: strength > 0 ? strengthColors[strength - 1].replace('bg-', '').replace('-500', '') : 'gray' }}>
                    {strengthLabels[strength - 1]}
                </p>
            )}
        </div>
    );
};

export default PasswordStrengthMeter;
