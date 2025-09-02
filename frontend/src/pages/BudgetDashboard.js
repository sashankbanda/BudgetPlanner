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

    // All the complex logic is now neatly contained in this one hook!
    const budgetData = useBudgetData();

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-2 sm:p-4">
            <div className="max-w-7xl mx-auto">
                
                <DashboardHeader {...budgetData} />

                <StatCards stats={budgetData.stats} />
                
                <DashboardTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
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
        </div>
    );
};

export default BudgetDashboard;