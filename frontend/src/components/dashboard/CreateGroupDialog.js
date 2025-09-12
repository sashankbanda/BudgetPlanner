// frontend/src/components/dashboard/CreateGroupDialog.js

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { User } from 'lucide-react';

const CreateGroupDialog = ({ isOpen, onOpenChange, selectedPeople, onCreateGroup }) => {
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!groupName.trim()) {
            setError("Group name cannot be empty.");
            return;
        }
        onCreateGroup({
            name: groupName.trim(),
            members: selectedPeople,
        });
        handleClose();
    };

    const handleClose = () => {
        setGroupName('');
        setError('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="glass-effect border-0 text-white">
                <DialogHeader>
                    <DialogTitle className="electric-accent">Create a New Group</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Give your new group a name. The following {selectedPeople.length} people will be added.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="flex flex-wrap gap-2">
                        {selectedPeople.map(person => (
                            <Badge key={person} variant="outline" className="border-blue-500/50 text-blue-400">
                                <User className="w-3 h-3 mr-1" />{person}
                            </Badge>
                        ))}
                    </div>
                    <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                            id="group-name"
                            className="glass-input mt-1"
                            placeholder="e.g., Roommates, Goa Trip..."
                            value={groupName}
                            onChange={(e) => {
                                setGroupName(e.target.value);
                                if (error) setError('');
                            }}
                        />
                        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" className="glass-button">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} className="glass-button neon-glow">Create Group</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateGroupDialog;