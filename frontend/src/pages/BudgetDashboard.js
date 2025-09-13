// frontend/src/pages/BudgetDashboard.js

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { useBudgetData } from '../hooks/useBudgetData';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import Welcome from '../components/dashboard/Welcome';
import SplitDetailsDialog from '../components/dashboard/SplitDetailsDialog'; // ✨ ADDED

const BudgetDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
    const [settlingPerson, setSettlingPerson] = useState(null);
    const [isDeletingGroupOpen, setIsDeletingGroupOpen] = useState(false);
    const [deletingGroupId, setDeletingGroupId] = useState(null);
    const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
    const [viewingSplit, setViewingSplit] = useState(null); // ✨ ADDED

    const budgetData = useBudgetData();
    
    const [isCreatingFirstAccount, setIsCreatingFirstAccount] = useState(false);

    const onSettleUpClick = (person) => {
        setSettlingPerson(person);
        setIsSettleUpOpen(true);
    };

    const handleSettleUpConfirm = () => {
        if (settlingPerson) {
            const accountId = budgetData.accounts.length > 0 ? budgetData.accounts[0].id : null;
            budgetData.handleSettleUp(settlingPerson, accountId);
        }
        setIsSettleUpOpen(false);
    };

    const handleCreateFirstAccount = async (accountName) => {
        setIsCreatingFirstAccount(true);
        await budgetData.handleCreateAccount(accountName);
        setIsCreatingFirstAccount(false);
    };

    const handleDeleteAccountFinal = async () => {
        await budgetData.handleDeleteUserAccount();
        setIsDeleteAccountConfirmOpen(false);
    };

    if (budgetData.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-6 h-6 animate-spin electric-accent" />
                    <span className="text-gray-300">Loading your budget data...</span>
                </div>
            </div>
        );
    }

    const getSettleUpMessage = () => {
        if (!settlingPerson) return "";
        const amount = Math.abs(settlingPerson.net_balance).toFixed(2);
        const action = settlingPerson.net_balance > 0 ? `record that ${settlingPerson.name} paid you back` : `record that you paid back ${settlingPerson.name}`;
        const transactionType = settlingPerson.net_balance > 0 ? "income" : "expense";
        return `This will create an ${transactionType} of $${amount} to ${action}. Are you sure?`;
    };

    const onDeleteGroupClick = (groupId) => {
        setDeletingGroupId(groupId);
        setIsDeletingGroupOpen(true);
    };

    const handleDeleteGroupConfirm = () => {
        if (deletingGroupId) {
            budgetData.handleDeleteGroup(deletingGroupId);
        }
        setIsDeletingGroupOpen(false);
        setDeletingGroupId(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {budgetData.accounts.length === 0 ? (
                    <Welcome 
                        handleCreateAccount={handleCreateFirstAccount} 
                        loading={isCreatingFirstAccount} 
                        handleLogout={budgetData.handleLogout}
                    />
                ) : (
                    <>
                        <DashboardHeader 
                            {...budgetData} 
                            onDeleteAccountRequest={() => setIsDeleteAccountConfirmOpen(true)} 
                        />
                        <StatCards stats={budgetData.stats} />
                        <DashboardTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onSettleUpClick={onSettleUpClick}
                            loading={budgetData.isTransactionLoading} 
                            onDeleteGroupClick={onDeleteGroupClick}
                            onViewSplitDetails={(split) => setViewingSplit(split)} // ✨ ADDED
                            {...budgetData}
                        />
                    </>
                )}
            </div>

            <AlertDialog open={budgetData.isDeleteDialogOpen} onOpenChange={budgetData.setIsDeleteDialogOpen}>
                <AlertDialogContent className="glass-card text-white border-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        {/* ✨ FIX: Added text-center for better layout */}
                        <AlertDialogDescription className="text-gray-400 text-center"> 
                            This action cannot be undone. This will permanently delete the transaction.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="glass-button expense-glow" onClick={budgetData.handleDeleteConfirm}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isSettleUpOpen} onOpenChange={setIsSettleUpOpen}>
                <AlertDialogContent className="glass-card text-white border-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Settle Balance with {settlingPerson?.name}?</AlertDialogTitle>
                        {/* ✨ FIX: Added text-center for better layout */}
                        <AlertDialogDescription className="text-gray-400 text-center">
                           {getSettleUpMessage()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="glass-button neon-glow" onClick={handleSettleUpConfirm}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeletingGroupOpen} onOpenChange={setIsDeletingGroupOpen}>
                <AlertDialogContent className="glass-card text-white border-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this group?</AlertDialogTitle>
                        {/* ✨ FIX: Added text-center for better layout */}
                        <AlertDialogDescription className="text-gray-400 text-center">
                            This action cannot be undone. Transactions associated with this group will be kept but unlinked from the group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="glass-button expense-glow" onClick={handleDeleteGroupConfirm}>Delete Group</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteAccountConfirmOpen} onOpenChange={setIsDeleteAccountConfirmOpen}>
                <AlertDialogContent className="glass-card text-white border-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="expense-accent">Are you absolutely sure?</AlertDialogTitle>
                        {/* ✨ FIX: Added text-center for better layout */}
                        <AlertDialogDescription className="text-gray-400 text-center">
                            This action cannot be undone. This will permanently delete your account and all of your data, including all financial accounts, transactions, and groups.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                            <Button className="glass-button">Cancel</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button className="glass-button expense-glow" onClick={handleDeleteAccountFinal}>Yes, Delete My Account</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <SplitDetailsDialog
                isOpen={!!viewingSplit}
                onOpenChange={() => setViewingSplit(null)}
                split={viewingSplit}
                transactions={budgetData.transactions}
                onSettle={budgetData.handleSettleSplit}
                accounts={budgetData.accounts}
            />
        </div>
    );
};

export default BudgetDashboard;