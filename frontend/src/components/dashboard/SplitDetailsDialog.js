// frontend/src/components/dashboard/SplitDetailsDialog.js

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { User, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const SplitDetailsDialog = ({ isOpen, onOpenChange, split, transactions, onSettle, accounts }) => {
    if (!split) return null;

    const [settleAccountId, setSettleAccountId] = React.useState(accounts.length > 0 ? accounts[0].id : '');

    const numParticipants = (split.split_with?.length || 0) + 1;
    const shareAmount = parseFloat((split.amount / numParticipants).toFixed(2));

    // Find settlement transactions related to this split
    const settlements = transactions.filter(t => 
        t.category === 'Settlement' && 
        t.description.includes(`"${split.group_name || 'Group Expense'}"`)
    ).map(t => t.person);

    const isSettled = (personName) => settlements.includes(personName);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="glass-effect border-0 text-white">
                <DialogHeader>
                    <DialogTitle className="electric-accent">{split.group_name || "Group Expense"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        A total of <span className="font-bold text-red-400">${split.amount.toFixed(2)}</span> was split among {numParticipants} people. Each person's share is <span className="font-bold text-sky-400">${shareAmount.toFixed(2)}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4 max-h-[40vh] overflow-y-auto">
                    {split.split_with.map(person => (
                        <div key={person} className="flex items-center justify-between p-2 glass-effect rounded-md">
                            <span className="flex items-center gap-2"><User className="w-4 h-4" />{person}</span>
                            {isSettled(person) ? (
                                <Badge variant="outline" className="border-green-500/50 text-green-400">
                                    <CheckCircle className="w-3 h-3 mr-1" />Settled
                                </Badge>
                            ) : (
                                <Button size="sm" className="glass-button neon-glow h-8" onClick={() => onSettle(split, person, settleAccountId)}>
                                    Settle Up
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="pt-4 border-t border-white/10">
                    <label className="text-sm text-gray-400 mb-2 block">Settle Into Account</label>
                    <Select value={settleAccountId} onValueChange={setSettleAccountId}>
                        <SelectTrigger className="glass-input"><SelectValue placeholder="Select account..." /></SelectTrigger>
                        <SelectContent className="glass-effect border-0 text-white">
                            {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" className="glass-button w-full">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SplitDetailsDialog;