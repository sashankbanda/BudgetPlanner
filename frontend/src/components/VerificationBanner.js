import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import api from '../services/api';
import { useToast } from '../hooks/use-toast';

const VerificationBanner = () => {
    const { toast } = useToast();

    const handleResend = async () => {
        try {
            const response = await api.auth.resendVerification();
            toast({ title: "Success", description: response.message || "A new verification link has been sent." });
        } catch (error) {
            toast({ title: "Error", description: error.message || "Failed to resend verification link.", variant: "destructive" });
        }
    };

    return (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">
                    Please verify your email address to secure your account and enable all features.
                </p>
            </div>
            <Button onClick={handleResend} variant="outline" className="border-yellow-700 hover:bg-yellow-800/50 text-yellow-300">
                Resend Link
            </Button>
        </div>
    );
};

export default VerificationBanner;
