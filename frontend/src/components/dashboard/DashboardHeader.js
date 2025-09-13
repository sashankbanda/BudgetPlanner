import React from 'react';
import { Plus, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import AccountManager from './AccountManager';
import TransactionForm from './TransactionForm';
import GuideModal from './GuideModal';

const DashboardHeader = ({
    accounts, selectedAccountId, setSelectedAccountId,
    isManageAccountsOpen, setIsManageAccountsOpen,
    newAccountName, setNewAccountName,
    handleCreateAccount, handleDeleteAccount,
    isFormDialogOpen, setIsFormDialogOpen,
    resetForm, formData, setFormData,
    editingTransaction, handleFormSubmit, people,
    handleLogout,
    groups, // ✨ ADDED groups prop
    onDeleteAccountRequest // Accept the new prop
}) => {
    return (
        <header className="header-glow glass-effect p-4 sm:p-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-center sm:text-left">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold electric-accent mb-2">Budget Planner</h1>
                <p className="text-gray-300 text-sm sm:text-base">Track your finances with futuristic precision</p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto flex-wrap">
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="glass-input w-[150px] sm:w-[180px]">
                        <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="glass-effect border-0 text-white">
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <AccountManager
                    isOpen={isManageAccountsOpen}
                    onOpenChange={setIsManageAccountsOpen}
                    accounts={accounts}
                    newAccountName={newAccountName}
                    setNewAccountName={setNewAccountName}
                    handleCreateAccount={handleCreateAccount}
                    handleDeleteAccount={handleDeleteAccount}
                    onDeleteAccountRequest={onDeleteAccountRequest} // Pass it down
                />
                
                <GuideModal />

                <TransactionForm
                    isOpen={isFormDialogOpen}
                    onOpenChange={setIsFormDialogOpen}
                    resetForm={resetForm}
                    formData={formData}
                    setFormData={setFormData}
                    editingTransaction={editingTransaction}
                    accounts={accounts}
                    people={people}
                    groups={groups} // ✨ FIX: Pass the groups prop down to the form
                    onSubmit={handleFormSubmit}
                />

                <Button variant="ghost" size="icon" onClick={handleLogout} className="glass-button expense-glow"><LogOut className="w-5 h-5" /></Button>
            </div>
        </header>
    );
};

export default DashboardHeader;