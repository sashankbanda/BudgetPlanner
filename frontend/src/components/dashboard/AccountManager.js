import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings, Wallet, Trash2 } from 'lucide-react';

const AccountManager = ({
    isOpen, onOpenChange, accounts, newAccountName,
    setNewAccountName, handleCreateAccount, handleDeleteAccount,
    onDeleteAccountRequest // Accept the new prop
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
                    {/* ADDED: DialogDescription to fix accessibility warning */}
                    <DialogDescription className="text-gray-400">
                        Add new financial accounts or remove existing ones. Deleting an account will also remove all of its associated transactions.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Add New Account</Label>
                        <div className="flex gap-2">
                            <Input className="glass-input" placeholder="e.g., HDFC Savings" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
                            {/* MODIFIED: Changed onClick to pass the name directly */}
                            <Button className="glass-button neon-glow" onClick={() => handleCreateAccount(newAccountName)}>Add</Button>
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
                    <div className="space-y-2 pt-4 mt-4 border-t border-red-500/30">
                        <Label className="text-red-400">Danger Zone</Label>
                        <div className="flex items-center justify-between p-3 glass-effect rounded-md border border-red-500/30">
                            <div>
                               <p className="font-semibold text-gray-200">Delete Account</p>
                               <p className="text-xs text-gray-400">Permanently remove your account and all data.</p>
                            </div>
                            <Button 
                                variant="destructive" 
                                className="glass-button expense-glow bg-red-900/50 hover:bg-red-800/60 border-red-500/50 text-red-300"
                                onClick={() => {
                                    onOpenChange(false); // Close this modal first
                                    onDeleteAccountRequest(); // Then trigger the confirmation modal
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AccountManager;
