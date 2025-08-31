import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { useBudgetData } from '../hooks/useBudgetData';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import DashboardTabs from '../components/dashboard/DashboardTabs';

const BudgetDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const {
        transactions, people, loading, stats, chartData, peopleStats, accounts,
        selectedAccountId, isManageAccountsOpen, newAccountName, isFormDialogOpen,
        editingTransaction, isDeleteDialogOpen, filters, formData,
        setSelectedAccountId, setIsManageAccountsOpen, setNewAccountName, setIsFormDialogOpen,
        setIsDeleteDialogOpen, setFormData,
        handleLogout, handleCreateAccount, handleDeleteAccount, resetForm,
        handleFormSubmit, handleEditClick, handleDeleteClick, handleDeleteConfirm,
        handleFilterChange,
        uniqueCategories, filteredTotals, isFilterActive,
    } = useBudgetData();

    if (loading) {
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
                <DashboardHeader
                    accounts={accounts}
                    selectedAccountId={selectedAccountId}
                    setSelectedAccountId={setSelectedAccountId}
                    isManageAccountsOpen={isManageAccountsOpen}
                    setIsManageAccountsOpen={setIsManageAccountsOpen}
                    newAccountName={newAccountName}
                    setNewAccountName={setNewAccountName}
                    handleCreateAccount={handleCreateAccount}
                    handleDeleteAccount={handleDeleteAccount}
                    isFormDialogOpen={isFormDialogOpen}
                    setIsFormDialogOpen={setIsFormDialogOpen}
                    resetForm={resetForm}
                    formData={formData}
                    setFormData={setFormData}
                    editingTransaction={editingTransaction}
                    handleFormSubmit={handleFormSubmit}
                    people={people}
                    handleLogout={handleLogout}
                />

                <StatCards stats={stats} />
                
                <DashboardTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    chartData={chartData}
                    peopleStats={peopleStats}
                    transactions={transactions}
                    loading={loading}
                    handleEditClick={handleEditClick}
                    handleDeleteClick={handleDeleteClick}
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    uniqueCategories={uniqueCategories}
                    isFilterActive={isFilterActive}
                    filteredTotals={filteredTotals}
                />

            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                 <AlertDialogContent className="glass-card text-white border-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete this transaction from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="glass-button">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="glass-button expense-glow" onClick={handleDeleteConfirm}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BudgetDashboard;
