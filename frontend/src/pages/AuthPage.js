import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.login(loginEmail, loginPassword);
      toast({ title: "Success", description: "Logged in successfully!" });
      navigate('/');
    } catch (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.signup(signupEmail, signupPassword);
      toast({ title: "Success", description: "Account created! Please log in." });
      setActiveTab('login'); // Switch to login tab
    } catch (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                  <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="glass-input" />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                  <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="glass-input" />
                </div>
                <Button type="submit" className="w-full glass-button neon-glow" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
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
                  <Input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className="glass-input" />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                  <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required className="glass-input" />
                </div>
                <Button type="submit" className="w-full glass-button neon-glow" disabled={loading}>
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
