import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Plus } from 'lucide-react';
import { incomeCategories, expenseCategories } from '../../mock';

const personCategories = ["To Friends", "From Friends", "To Parents", "From Parents"];

const TransactionForm = ({
    isOpen, onOpenChange, resetForm,
    formData, setFormData, editingTransaction,
    accounts, people, groups, onSubmit
}) => {
    const showPersonField = personCategories.includes(formData.category);

    const handleOpenChange = (isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    const handleTransactionWithChange = (value) => {
        if (value === 'person') {
            setFormData(prev => ({ ...prev, transaction_with: value, group_id: '' }));
        } else {
            setFormData(prev => ({ ...prev, transaction_with: value, person: '' }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="glass-button electric-glow flex-grow sm:flex-grow-0" disabled={accounts.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-0 text-white">
                <DialogHeader>
                    <DialogTitle className="electric-accent">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Fill in the details below to log a new income or expense.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    {/* ... Account, Type, and Category Selects ... */}
                    <div>
                        <Label>Account</Label>
                        <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
                            <SelectTrigger className="glass-input"><SelectValue placeholder="Select an account..." /></SelectTrigger>
                            <SelectContent className="glass-effect border-0 text-white">
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, category: '' }))}>
                            <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass-effect border-0 text-white">
                                <SelectItem value="income" className="income-accent">Income</SelectItem>
                                <SelectItem value="expense" className="expense-accent">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Category</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger className="glass-input"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent className="glass-effect border-0 text-white">
                                {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.category === 'Custom' && (
                        <div>
                            <Label>Custom Category</Label>
                            <Input className="glass-input" value={formData.customCategory} onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))} placeholder="Enter custom category" />
                        </div>
                    )}
                    
                    {showPersonField && (
                        <div className="space-y-4 p-3 glass-effect rounded-md">
                            <RadioGroup value={formData.transaction_with} onValueChange={handleTransactionWithChange} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    {/* ✨ FIX: Added styling to radio buttons */}
                                    <RadioGroupItem value="person" id="r1" className="border-gray-600 data-[state=checked]:border-sky-500 text-sky-400" />
                                    <Label htmlFor="r1">Person</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {/* ✨ FIX: Added styling to radio buttons */}
                                    <RadioGroupItem value="group" id="r2" className="border-gray-600 data-[state=checked]:border-sky-500 text-sky-400" />
                                    <Label htmlFor="r2">Group</Label>
                                </div>
                            </RadioGroup>
                            
                            {formData.transaction_with === 'person' ? (
                                <>
                                    <div>
                                        <Label>Person</Label>
                                        <Select value={formData.person} onValueChange={(value) => setFormData(prev => ({ ...prev, person: value }))}>
                                            <SelectTrigger className="glass-input"><SelectValue placeholder="Select person..." /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
                                                {people.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                <SelectItem value="add_new" className="electric-accent">+ Add New Person</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {formData.person === 'add_new' && (
                                        <div>
                                            <Label>New Person Name</Label>
                                            <Input className="glass-input" value={formData.newPerson} onChange={(e) => setFormData(prev => ({ ...prev, newPerson: e.target.value }))} placeholder="e.g., Alex, Mom..." />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <Label>Group</Label>
                                    <Select value={formData.group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}>
                                        <SelectTrigger className="glass-input"><SelectValue placeholder="Select group..." /></SelectTrigger>
                                        <SelectContent className="glass-effect border-0 text-white">
                                            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* ... Amount, Description, and Date Inputs ... */}
                    <div>
                        <Label>Amount</Label>
                        <Input className="glass-input" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} placeholder="0.00" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input className="glass-input" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Transaction description" />
                    </div>
                    <div>
                        <Label>Date</Label>
                        <Input className="glass-input" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
                    </div>

                    <Button onClick={onSubmit} className="w-full glass-button neon-glow">
                        {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TransactionForm;