// frontend/src/components/dashboard/TransactionForm.js

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Plus, X } from 'lucide-react';
import { incomeCategories, expenseCategories } from '../../mock';

const personCategories = ["To Friends", "From Friends", "To Parents", "From Parents"];

const TransactionForm = ({
  isOpen, onOpenChange, resetForm,
  formData, setFormData, editingTransaction,
  accounts, people, onSubmit
}) => {
  const showPersonField = personCategories.includes(formData.category);
  const [isSplit, setIsSplit] = useState(false);
  const [newPersonInput, setNewPersonInput] = useState('');

  useEffect(() => {
    // When opening the form to edit, check if it's a split transaction
    if (editingTransaction) {
      setIsSplit(!!(editingTransaction.split_with && editingTransaction.split_with.length > 0));
    } else {
      setIsSplit(false); // Reset for new transactions
    }
  }, [editingTransaction, isOpen]);

  const handleOpenChange = (isOpen) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetForm();
      setIsSplit(false); // Reset split state on close
    }
  };

  const handleSplitToggle = (checked) => {
    setIsSplit(checked);
    if (checked) {
      // When switching to split, clear the individual person field
      setFormData(prev => ({ ...prev, person: '' }));
    } else {
      // When switching back, clear split fields
      setFormData(prev => ({ ...prev, split_with: [], group_name: '' }));
    }
  };

  const handleAddPersonToSplit = () => {
    const name = newPersonInput.trim();
    if (name && !formData.split_with.includes(name)) {
      setFormData(prev => ({ ...prev, split_with: [...prev.split_with, name] }));
      setNewPersonInput('');
    }
  };

  const handleRemovePersonFromSplit = (personToRemove) => {
    setFormData(prev => ({
      ...prev,
      split_with: prev.split_with.filter(p => p !== personToRemove)
    }));
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
        <div className="space-y-4 pt-4 max-h-[65vh] overflow-y-auto pr-4">
          {/* Account Field */}
          <div>
            <Label>Account</Label>
            <Select value={formData.account_id} onValueChange={(value) => setFormData(prev => ({ ...prev, account_id: value }))}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select an account..." />
              </SelectTrigger>
              <SelectContent className="glass-effect border-0 text-white">
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Field */}
          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, category: '' }))}>
              <SelectTrigger className="glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-effect border-0 text-white">
                <SelectItem value="income" className="income-accent">Income</SelectItem>
                <SelectItem value="expense" className="expense-accent">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Field */}
          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="glass-effect border-0 text-white">
                {(formData.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Category Field */}
          {formData.category === 'Custom' && (
            <div>
              <Label>Custom Category</Label>
              <Input 
                className="glass-input" 
                value={formData.customCategory} 
                onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))} 
                placeholder="Enter custom category" 
              />
            </div>
          )}

          {/* DYNAMIC SECTION FOR PERSON/GROUP */}
          {showPersonField && formData.type === 'expense' && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="split-expense" 
                checked={isSplit} 
                onCheckedChange={handleSplitToggle} 
                className="border-gray-600 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
              />
              <Label htmlFor="split-expense" className="text-gray-300">Split this expense?</Label>
            </div>
          )}

          {/* Person Field (Non-Split) */}
          {showPersonField && !isSplit && (
            <div>
              <Label>Person</Label>
              <Select value={formData.person} onValueChange={(value) => setFormData(prev => ({ ...prev, person: value }))}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent className="glass-effect border-0 text-white">
                  {people.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  <SelectItem value="add_new" className="electric-accent">+ Add New Person</SelectItem>
                </SelectContent>
              </Select>
              {formData.person === 'add_new' && (
                <div className="mt-2">
                  <Label>New Person Name</Label>
                  <Input 
                    className="glass-input" 
                    value={formData.newPerson} 
                    onChange={(e) => setFormData(prev => ({ ...prev, newPerson: e.target.value }))} 
                    placeholder="e.g., Alex, Mom..." 
                  />
                </div>
              )}
            </div>
          )}

          {/* Split Expense Section */}
          {isSplit && (
            <div className="space-y-4 p-3 glass-effect rounded-md">
              <div>
                <Label>Group Name (Optional)</Label>
                <Input 
                  className="glass-input" 
                  value={formData.group_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))} 
                  placeholder="e.g., Team Lunch, Goa Trip" 
                />
              </div>
              <div>
                <Label>Participants ({formData.split_with.length + 1})</Label>
                <div className="text-xs text-gray-400 mb-2">You are automatically included. Add others below.</div>
                {formData.split_with.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.split_with.map(person => (
                      <Badge key={person} variant="secondary" className="bg-gray-700/50 text-gray-300">
                        {person}
                        <button onClick={() => handleRemovePersonFromSplit(person)} className="ml-2 rounded-full hover:bg-gray-600/50 p-0.5">
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input 
                    className="glass-input" 
                    value={newPersonInput} 
                    onChange={(e) => setNewPersonInput(e.target.value)} 
                    placeholder="Add person's name..." 
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    className="glass-button h-9 w-9 flex-shrink-0" 
                    onClick={handleAddPersonToSplit}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Amount Field */}
          <div>
            <Label>Amount</Label>
            <Input 
              className="glass-input" 
              type="number" 
              step="0.01" 
              min="0" 
              value={formData.amount} 
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} 
              placeholder="0.00" 
            />
          </div>
          
          {/* Description Field */}
          <div>
            <Label>Description</Label>
            <Input 
              className="glass-input" 
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="Transaction description" 
            />
          </div>
          
          {/* Date Field */}
          <div>
            <Label>Date</Label>
            <Input 
              className="glass-input" 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} 
            />
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button onClick={onSubmit} className="w-full glass-button neon-glow">
            {editingTransaction ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;