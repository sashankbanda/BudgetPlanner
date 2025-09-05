import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { useBudgetData } from '../hooks/useBudgetData';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import Welcome from '../components/dashboard/Welcome'; // ✨ IMPORT THE NEW COMPONENT

const BudgetDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
    const [settlingPerson, setSettlingPerson] = useState(null);

    const budgetData = useBudgetData();
    
    // State for the Welcome component's create account loading state
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
    };

    // A specific handler for the Welcome screen to show a loading state
    const handleCreateFirstAccount = async (accountName) => {
        setIsCreatingFirstAccount(true);
        await budgetData.handleCreateAccount(accountName);
        setIsCreatingFirstAccount(false);
    };

    // Loading state for the entire page
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
        if (settlingPerson.net_balance > 0) {
            return `This will create an expense of $${amount} to record that you paid back ${settlingPerson.name}. Are you sure?`;
        } else {
            return `This will create an income of $${amount} to record that ${settlingPerson.name} paid you back. Are you sure?`;
        }
    };

    // ✨ THE CORE LOGIC CHANGE IS HERE ✨
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
            <div className="max-w-7xl mx-auto">
                {/* If there are no accounts, show the Welcome screen. Otherwise, show the dashboard. */}
                {budgetData.accounts.length === 0 ? (
                    <Welcome handleCreateAccount={handleCreateFirstAccount} loading={isCreatingFirstAccount} />
                ) : (
                    <>
                        <DashboardHeader {...budgetData} />
                        <StatCards stats={budgetData.stats} />
                        <DashboardTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onSettleUpClick={onSettleUpClick}
                            {...budgetData}
                        />
                    </>
                )}
            </div>

            {/* Dialogs remain the same */}
            <AlertDialog open={budgetData.isDeleteDialogOpen} onOpenChange={budgetData.setIsDeleteDialogOpen}>
               <AlertDialogContent className="glass-card text-white border-0">
                 <AlertDialogHeader>
                   <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                   <AlertDialogDescription className="text-gray-400">
                     This action cannot be undone. This will permanently delete this transaction from our servers.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                   <AlertDialogAction className="glass-button expense-glow" onClick={budgetData.handleDeleteConfirm}>Continue</AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isSettleUpOpen} onOpenChange={setIsSettleUpOpen}>
               <AlertDialogContent className="glass-card text-white border-0">
                 <AlertDialogHeader>
                   <AlertDialogTitle>Settle Balance with {settlingPerson?.name}?</AlertDialogTitle>
                   <AlertDialogDescription className="text-gray-400">
                     {getSettleUpMessage()}
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                   <AlertDialogAction className="glass-button neon-glow" onClick={handleSettleUpConfirm}>Confirm Settlement</AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BudgetDashboard;

