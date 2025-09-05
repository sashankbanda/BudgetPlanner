// frontend/src/components/BudgetDashboard.js (After full refactor)

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { useBudgetData } from '../hooks/useBudgetData';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import DashboardTabs from '../components/dashboard/DashboardTabs';

const BudgetDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    
    // ✨ ADDED: State for Settle Up modal ✨
    const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
    const [settlingPerson, setSettlingPerson] = useState(null);

    const budgetData = useBudgetData();
    
    // ✨ ADDED: Handler to open the modal ✨
    const onSettleUpClick = (person) => {
        setSettlingPerson(person);
        setIsSettleUpOpen(true);
    };

    // ✨ ADDED: Handler for confirming settlement ✨
    const handleSettleUpConfirm = () => {
        if (settlingPerson) {
            // Use the first account as the default for settlement.
            // A more advanced implementation could let the user choose.
            const accountId = budgetData.accounts.length > 0 ? budgetData.accounts[0].id : null;
            budgetData.handleSettleUp(settlingPerson, accountId);
        }
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
    // A helper to create the confirmation message
    const getSettleUpMessage = () => {
        if (!settlingPerson) return "";
        const amount = Math.abs(settlingPerson.net_balance).toFixed(2);
        if (settlingPerson.net_balance > 0) {
            return `This will create an expense of $${amount} to record that you paid back ${settlingPerson.name}. Are you sure?`;
        } else {
            return `This will create an income of $${amount} to record that ${settlingPerson.name} paid you back. Are you sure?`;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
            <div className="max-w-7xl mx-auto">
                
                <DashboardHeader {...budgetData} />

                <StatCards stats={budgetData.stats} />
                
                <DashboardTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onSettleUpClick={onSettleUpClick}
                    {...budgetData}
                />

            </div>

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

            {/* ✨ ADDED: Settle Up Confirmation AlertDialog ✨ */}
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