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
            // ✨ FIX: Parse the URL fragment (#) instead of search query (?)
            const params = new URLSearchParams(location.hash.substring(1));
            const idToken = params.get('id_token');

            if (!idToken) {
                const errorDescription = params.get('error_description') || "ID token not found in Google's response. Please try again.";
                setError(errorDescription);
                toast({ title: "Authentication Error", description: errorDescription, variant: "destructive" });
                navigate('/login');
                return;
            }

            try {
                // The backend expects the ID token for verification
                await api.auth.handleGoogleCallback(idToken);
                toast({ title: "Success!", description: "Logged in with Google successfully." });
                navigate('/');
            } catch (err) {
                const errorMessage = err.message || "An error occurred during Google sign-in.";
                setError(errorMessage);
                toast({ title: "Authentication Failed", description: errorMessage, variant: "destructive" });
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