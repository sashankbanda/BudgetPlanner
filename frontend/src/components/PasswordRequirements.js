import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../lib/utils';

// Defines the rules for a strong password
const requirements = [
    { regex: /.{8,}/, text: "At least 8 characters" },
    { regex: /[a-z]/, text: "Contains a lowercase letter" },
    { regex: /[A-Z]/, text: "Contains an uppercase letter" },
    { regex: /[0-9]/, text: "Contains a number" },
    { regex: /[^A-Za-z0-9]/, text: "Contains a special character" },
];

const PasswordRequirements = ({ password }) => {
    return (
        <div className="space-y-1.5 mt-3">
            {requirements.map((req, index) => {
                const isValid = req.regex.test(password);
                return (
                    <div key={index} className="flex items-center text-xs transition-colors">
                        {isValid ? (
                            <Check className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" />
                        ) : (
                            <X className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        )}
                        <span className={cn("transition-colors", isValid ? "text-gray-300" : "text-gray-500")}>
                            {req.text}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default PasswordRequirements;