import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
// ✨ FIX: Import the LogOut icon
import { Loader2, Wallet, LogOut } from 'lucide-react';

// ✨ FIX: Accept handleLogout as a prop
const Welcome = ({ handleCreateAccount, loading, handleLogout }) => {
    const [accountName, setAccountName] = useState('');

    const onSubmit = (e) => {
        e.preventDefault();
        if (accountName.trim()) {
            handleCreateAccount(accountName);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            {/* ✨ FIX: Added `relative` positioning to the card to contain the button */}
            <Card className="glass-card w-full max-w-md text-center relative">
                {/* ✨ FIX: Added the absolute-positioned logout button */}
                <Button variant="ghost" size="icon" onClick={handleLogout} className="absolute top-4 right-4 text-gray-400 hover:text-white h-8 w-8">
                    <LogOut className="w-5 h-5" />
                </Button>
                <CardHeader>
                    <div className="mx-auto bg-gray-800/50 p-3 rounded-full mb-4">
                        <Wallet className="w-8 h-8 electric-accent" />
                    </div>
                    <CardTitle className="text-2xl electric-accent">Welcome to Your Budget Planner!</CardTitle>
                    <CardDescription className="text-gray-400">
                        To get started, let's create your first financial account. This could be a bank account, credit card, or cash wallet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="accountName" className="sr-only">Account Name</Label>
                            <Input
                                id="accountName"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                placeholder="e.g., 'Savings Account' or 'My Wallet'"
                                className="glass-input text-center"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full glass-button neon-glow" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Welcome;