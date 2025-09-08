import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Verification token not found. Please check the link or try signing up again.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await api.auth.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || 'Email verified successfully. You can now log in.');
            } catch (error) {
                setStatus('error');
                setMessage(error.message || 'Invalid or expired verification token. Please try signing up again.');
            }
        };

        verifyToken();
    }, [searchParams]);

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin electric-accent" />
                        <p className="mt-4 text-gray-300">{message}</p>
                    </>
                );
            case 'success':
                return (
                    <>
                        <CheckCircle className="w-12 h-12 text-green-400" />
                        <p className="mt-4 text-gray-300">{message}</p>
                        <Button asChild className="mt-6 glass-button neon-glow">
                            <Link to="/login">Proceed to Login</Link>
                        </Button>
                    </>
                );
            case 'error':
                return (
                    <>
                        <XCircle className="w-12 h-12 text-red-500" />
                        <p className="mt-4 text-gray-300">{message}</p>
                        <Button asChild className="mt-6 glass-button expense-glow">
                            <Link to="/login">Back to Login/Signup</Link>
                        </Button>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center p-4">
            <Card className="glass-card w-full max-w-md text-center border-0">
                <CardHeader>
                    <CardTitle className="electric-accent text-2xl">Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8">
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmailPage;