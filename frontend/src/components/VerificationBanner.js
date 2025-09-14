import React from 'react';
import { AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import api from '../services/api';
import { useToast } from '../hooks/use-toast';

const VerificationBanner = ({ email, message = "Please verify your email address to secure your account and enable all features." }) => {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);

    const handleResend = async () => {
        setLoading(true);
        try {
            await api.auth.resendVerification(email);
            toast({
                title: "Success",
                description: "A new verification link has been sent to your email.",
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to resend verification email.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-yellow-900/30 text-yellow-300 rounded-lg border border-yellow-500/50 mb-4 shadow-xl">
            <div className="flex items-start gap-3 flex-1 mb-2 md:mb-0">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                    <span className="font-semibold block">Email Not Verified</span>
                    {message}
                </p>
            </div>
            <Button
                variant="ghost"
                className="w-full md:w-auto mt-2 md:mt-0 flex-shrink-0 bg-yellow-800/50 hover:bg-yellow-800/80 text-yellow-200 hover:text-white border-yellow-400/50 border"
                onClick={handleResend}
                disabled={loading}
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Link
            </Button>
        </div>
    );
};

export default VerificationBanner;