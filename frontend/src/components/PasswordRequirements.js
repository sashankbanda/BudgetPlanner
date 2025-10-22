import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

const PasswordRequirements = ({ password }) => {
    // Regex for password requirements
    const requirements = [
        { label: 'At least 8 characters', check: (p) => p.length >= 8 },
        { label: 'Contains a lowercase letter', check: (p) => /[a-z]/.test(p) },
        { label: 'Contains an uppercase letter', check: (p) => /[A-Z]/.test(p) },
        { label: 'Contains a number', check: (p) => /[0-9]/.test(p) },
        { label: 'Contains a special character', check: (p) => /[^A-Za-z0-9]/.test(p) },
    ];

    return (
        <div className="space-y-2 text-sm">
            {requirements.map((req, index) => {
                const isMet = req.check(password);
                return (
                    <div key={index} className="flex items-center space-x-2">
                        {isMet ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className={cn(isMet ? 'text-gray-300' : 'text-gray-500')}>{req.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default PasswordRequirements;