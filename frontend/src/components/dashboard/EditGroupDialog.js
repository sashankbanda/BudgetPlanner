// frontend/src/components/dashboard/EditGroupDialog.js

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

const EditGroupDialog = ({ isOpen, onOpenChange, group, allPeople, onUpdateGroup }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (group) {
            setGroupName(group.name);
            setSelectedMembers(group.members || []);
        }
    }, [group]);

    const handleMemberToggle = (personName) => {
        setSelectedMembers(prev =>
            prev.includes(personName)
                ? prev.filter(p => p !== personName)
                : [...prev, personName]
        );
    };

    const handleSubmit = () => {
        if (!groupName.trim()) {
            setError("Group name cannot be empty.");
            return;
        }
        if (selectedMembers.length === 0) {
            setError("A group must have at least one member.");
            return;
        }
        onUpdateGroup(group.id, {
            name: groupName.trim(),
            members: selectedMembers,
        });
        onOpenChange(false);
    };

    if (!group) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="glass-effect border-0 text-white">
                <DialogHeader>
                    <DialogTitle className="electric-accent">Edit Group</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        You can rename the group and change its members.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div>
                        <Label htmlFor="edit-group-name">Group Name</Label>
                        <Input id="edit-group-name" className="glass-input mt-1" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                    </div>
                    <div>
                        <Label>Members ({selectedMembers.length})</Label>
                        <ScrollArea className="h-40 w-full glass-effect rounded-md p-2 mt-1">
                            <div className="space-y-2">
                                {allPeople.sort().map(person => (
                                    <div key={person} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`member-${person}`}
                                            checked={selectedMembers.includes(person)}
                                            onCheckedChange={() => handleMemberToggle(person)}
                                            className="border-gray-600 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                                        />
                                        <label
                                            htmlFor={`member-${person}`}
                                            className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", selectedMembers.includes(person) ? "text-gray-200" : "text-gray-400")}
                                        >
                                            {person}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary" className="glass-button">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} className="glass-button neon-glow">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditGroupDialog;