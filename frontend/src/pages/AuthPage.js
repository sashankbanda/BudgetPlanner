import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import api from '../services/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { cn } from '../lib/utils';
// FIX: Import the new component
import PasswordRequirements from '../components/PasswordRequirements';
import VerificationBanner from '../components/VerificationBanner';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        <path d="M1 1h22v22H1z" fill="none"/>
    </svg>
);

const ForgotPasswordDialog = () => {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            toast({ title: "Error", description: "Please enter your email address.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await api.auth.forgotPassword(email);
            toast({ title: "Check your email", description: response.message });
            setIsOpen(false);
            setEmail('');
        } catch (error) {
            toast({ title: "Error", description: error.message || "Failed to send reset link.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="text-xs electric-accent hover:underline">Forgot password?</button>
            </DialogTrigger>
            <DialogContent className="glass-card text-white border-0">
                <DialogHeader>
                    <DialogTitle className="electric-accent">Reset Your Password</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Enter your account's email address and we will send you a link to reset your password.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                        <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="you@example.com" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" className="glass-button">Cancel</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSubmit} className="glass-button neon-glow" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const newErrors = {};
        if (signupEmail && !/\S+@\S+\.\S+/.test(signupEmail)) {
            newErrors.signupEmail = 'Please enter a valid email address.';
        }
        if (signupPassword && signupPassword.length < 8) {
            newErrors.signupPassword = 'Password must be at least 8 characters long.';
        }
        if (confirmPassword && signupPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }
        setErrors(newErrors);
    }, [signupEmail, signupPassword, confirmPassword]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUnverifiedEmail(''); // Reset unverified state on new login attempt
        try {
            await api.auth.login(loginEmail, loginPassword, rememberMe);
            toast({ title: "Success", description: "Logged in successfully!" });
            navigate('/');
        } catch (error) {
            if (error.message.includes("Email not verified")) {
                setUnverifiedEmail(loginEmail);
                toast({ title: "Login Failed", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Login Failed", description: error.message, variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (Object.keys(errors).length > 0 || !signupEmail || !signupPassword || !confirmPassword) {
            toast({ title: "Validation Error", description: "Please fix the errors and fill all fields before submitting.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const response = await api.auth.signup(signupEmail, signupPassword);
            toast({ title: "Welcome!", description: response.message || "Account created successfully. Please check your email to verify your account." });
            setActiveTab('login'); 
        } catch (error) {
            toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback`;

        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        
        const nonce = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

        const options = {
            redirect_uri: redirectUri,
            client_id: googleClientId,
            response_type: "id_token",
            prompt: "consent",
            scope: "openid email profile",
            nonce: nonce,
        };
        
        const qs = new URLSearchParams(options).toString();
        window.location.href = `${rootUrl}?${qs}`;
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 glass-effect">
                    <TabsTrigger value="login" className="glass-button data-[state=active]:electric-glow">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="glass-button data-[state=active]:electric-glow">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                    <Card className="glass-card border-0">
                        <CardHeader><CardTitle className="electric-accent text-center text-2xl">Welcome Back</CardTitle></CardHeader>
                        <CardContent>
                            {unverifiedEmail && <VerificationBanner email={unverifiedEmail} />}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                                    <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="glass-input" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                                        <ForgotPasswordDialog />
                                    </div>
                                    <div className="relative">
                                        <Input id="login-password" type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="glass-input pr-10" />
                                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                            {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={setRememberMe} className="border-gray-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                                    <Label htmlFor="remember-me" className="text-sm font-medium leading-none text-gray-400">Remember me</Label>
                                </div>
                                <Button type="submit" className="w-full glass-button neon-glow" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Login
                                </Button>
                            </form>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700"></span></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#191919] px-2 text-gray-400">Or continue with</span></div>
                            </div>
                            <Button variant="outline" className="w-full glass-button items-center gap-2" onClick={handleGoogleLogin}>
                                <GoogleIcon />
                                Sign in with Google
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="signup">
                    <Card className="glass-card border-0">
                        <CardHeader><CardTitle className="electric-accent text-center text-2xl">Create Account</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div>
                                    <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                                    <Input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className={cn("glass-input", errors.signupEmail && "border-red-500")} />
                                    {errors.signupEmail && <p className="text-xs text-red-400 mt-1">{errors.signupEmail}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                                    <div className="relative">
                                        <Input id="signup-password" type={showSignupPassword ? "text" : "password"} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required className={cn("glass-input pr-10", errors.signupPassword && "border-red-500")} />
                                        <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                            {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <PasswordStrengthMeter password={signupPassword} />
                                    {/* FIX: Add the requirements checklist component */}
                                    <PasswordRequirements password={signupPassword} />
                                    {errors.signupPassword && <p className="text-xs text-red-400 mt-1">{errors.signupPassword}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="confirm-password" className="text-gray-300">Confirm Password</Label>
                                    <div className="relative">
                                        <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={cn("glass-input pr-10", errors.confirmPassword && "border-red-500")} />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                                </div>
                                <Button type="submit" className="w-full glass-button neon-glow" disabled={loading || Object.keys(errors).length > 0}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign Up
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AuthPage;