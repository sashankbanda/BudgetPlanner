import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AuthCallbackPage = () => {
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const params = new URLSearchParams(location.search);
            const code = params.get('code');

            if (!code) {
                setError("Authorization code not found. Please try logging in again.");
                toast({ title: "Authentication Error", description: "Google did not provide an authorization code.", variant: "destructive"});
                navigate('/login');
                return;
            }

            try {
                await api.auth.handleGoogleCallback(code);
                toast({ title: "Success!", description: "Logged in with Google successfully." });
                navigate('/');
            } catch (err) {
                setError(err.message || "An error occurred during Google sign-in.");
                toast({ title: "Authentication Failed", description: err.message, variant: "destructive"});
                navigate('/login');
            }
        };

        handleAuthCallback();
    }, [location, navigate, toast]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin electric-accent mb-4" />
            <p className="text-gray-300">Finalizing your login...</p>
            {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        </div>
    );
};

export default AuthCallbackPage;

