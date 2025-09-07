import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import api from '../services/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { cn } from '../lib/utils';
// ✨ FIX: Import the new component
import PasswordRequirements from '../components/PasswordRequirements';

const ResetPasswordPage = () => {
    const [token, setToken] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');
        if (!urlToken) {
            setError('No reset token found. Please request a new reset link.');
            toast({ title: "Error", description: "Invalid password reset link.", variant: "destructive" });
        } else {
            setToken(urlToken);
        }
    }, [location.search, toast]);

    useEffect(() => {
        if (newPassword && newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long.');
        } else if (confirmPassword && newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
        } else {
            setPasswordError('');
        }
    }, [newPassword, confirmPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwordError || !newPassword) {
            toast({ title: "Validation Error", description: passwordError || "Please enter a new password.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await api.auth.resetPassword(token, newPassword);
            toast({ title: "Success!", description: response.message });
            navigate('/login');
        } catch (err) {
            setError(err.message || "Failed to reset password. The link may have expired.");
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center p-4">
            <Card className="glass-card border-0 w-full max-w-md">
                <CardHeader>
                    <CardTitle className="electric-accent text-center text-2xl">Set a New Password</CardTitle>
                    <CardDescription className="text-gray-400 text-center">
                        {error ? 'There was a problem with your request.' : 'Please enter and confirm your new password below.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={cn("glass-input pr-10", passwordError && "border-red-500")}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <PasswordStrengthMeter password={newPassword} />
                                {/* ✨ FIX: Add the requirements checklist component */}
                                <PasswordRequirements password={newPassword} />
                            </div>
                            <div>
                                <Label htmlFor="confirm-password" className="text-gray-300">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={cn("glass-input pr-10", passwordError && "border-red-500")}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
                            </div>
                            <Button type="submit" className="w-full glass-button neon-glow" disabled={loading || !!passwordError || !token}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;