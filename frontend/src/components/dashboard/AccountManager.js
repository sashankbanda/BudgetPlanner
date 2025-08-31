import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings, Wallet, Trash2 } from 'lucide-react';

const AccountManager = ({
    isOpen, onOpenChange, accounts, newAccountName,
    setNewAccountName, handleCreateAccount, handleDeleteAccount
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="glass-button">
                    <Settings className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-0 text-white">
                <DialogHeader>
                    <DialogTitle className="electric-accent">Manage Accounts</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Add New Account</Label>
                        <div className="flex gap-2">
                            <Input className="glass-input" placeholder="e.g., HDFC Savings" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
                            <Button className="glass-button neon-glow" onClick={handleCreateAccount}>Add</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Existing Accounts</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                            {accounts.length > 0 ? accounts.map(acc => (
                                <div key={acc.id} className="flex items-center justify-between p-2 glass-effect rounded-md">
                                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />{acc.name}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" onClick={() => handleDeleteAccount(acc.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-gray-400 text-center py-4">No accounts created yet.</p>}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AccountManager;
