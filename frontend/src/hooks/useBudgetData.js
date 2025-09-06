import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import api from '../services/api';
import { incomeCategories, expenseCategories } from '../mock';
import { subDays, format } from 'date-fns';

const personCategories = ["To Friends", "From Friends", "To Parents", "From Parents"];

export const useBudgetData = () => {
    const [transactions, setTransactions] = useState([]);
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, transactionCount: 0 });
    const [chartData, setChartData] = useState({ monthlyData: [], incomeData: [], expenseData: [], trendData: [] });
    const [peopleStats, setPeopleStats] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    
    const [trendPeriod, setTrendPeriod] = useState('weekly');
    const [trendDateRange, setTrendDateRange] = useState({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
    const [newAccountName, setNewAccountName] = useState("");

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState(null);

    const [filters, setFilters] = useState({ search: '', type: '', category: '', sort: 'date_desc' });
    const deferredFilters = useDeferredValue(filters);
    
    const [formData, setFormData] = useState({
        type: 'expense', category: '', amount: '', description: '',
        date: new Date().toISOString().split('T')[0], customCategory: '',
        person: '', newPerson: '', account_id: ''
    });

    const { toast } = useToast();
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        try {
            const trendParams = {
                period: trendPeriod,
                start_date: format(trendDateRange.from, 'yyyy-MM-dd'),
                end_date: format(trendDateRange.to, 'yyyy-MM-dd'),
            };
            if (selectedAccountId && selectedAccountId !== 'all') {
                trendParams.account_id = selectedAccountId;
            }

            const [
                accountsData, transactionsData, dashboardStats, monthlyStats,
                incomeStats, expenseStats, trendStats, peopleData, peopleStatsData
            ] = await Promise.all([
                api.accounts.getAll(),
                api.transactions.getAll(deferredFilters, selectedAccountId),
                api.stats.getDashboardStats(selectedAccountId),
                api.stats.getMonthlyStats(selectedAccountId),
                api.stats.getCategoryStats('income', selectedAccountId),
                api.stats.getCategoryStats('expense', selectedAccountId),
                api.stats.getGranularTrendStats(trendParams),
                api.people.getAll(),
                api.stats.getPeopleStats(selectedAccountId),
            ]);

            setAccounts(accountsData);
            setTransactions(transactionsData);
            setPeople(peopleData);
            setPeopleStats(peopleStatsData);
            setStats({ totalIncome: dashboardStats.total_income || 0, totalExpenses: dashboardStats.total_expenses || 0, balance: dashboardStats.balance || 0, transactionCount: dashboardStats.transaction_count || 0 });
            setChartData({ monthlyData: monthlyStats, incomeData: incomeStats, expenseData: expenseStats, trendData: trendStats });

            if (!formData.account_id && accountsData.length > 0) {
                setFormData(prev => ({ ...prev, account_id: accountsData[0].id }));
            }

        } catch (error) {
            console.error('Error loading data:', error);
            toast({ title: "Error", description: `Failed to load data. ${error.message}`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [deferredFilters, selectedAccountId, trendPeriod, trendDateRange.from, trendDateRange.to, toast, formData.account_id]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);
    
    const handleCreateAccount = async (name) => { // ✨ FIX: Accept name as an argument
        const accountName = name || newAccountName; // Use argument first, then state
        if (!accountName.trim()) {
            return toast({ title: "Error", description: "Account name cannot be empty.", variant: "destructive" });
        }
        try {
            const newAccount = await api.accounts.create({ name: accountName });
            toast({ title: "Success", description: "Account created." });
            setNewAccountName(""); // Clear the input for the dialog
            // Manually update accounts list to trigger re-render immediately
            setAccounts(prev => [...prev, newAccount]);
            setSelectedAccountId(newAccount.id);
        } catch (error) {
            toast({ title: "Error", description: "Failed to create account.", variant: "destructive" });
        }
    };

    // ... The rest of the useBudgetData hook remains the same ...

    useEffect(() => {
        if (!personCategories.includes(formData.category)) {
            setFormData(prevData => ({ ...prevData, person: '' }));
        }
    }, [formData.category]);

    const resetForm = () => {
        setFormData({
            type: 'expense', category: '', amount: '', description: '',
            date: new Date().toISOString().split('T')[0], customCategory: '',
            person: '', newPerson: '', 
            account_id: accounts.length > 0 ? accounts[0].id : '' 
        });
        setEditingTransaction(null);
    };


    const handleFormSubmit = async () => {
        if (!formData.account_id) {
            return toast({ title: "Validation Error", description: "Please select an account for this transaction.", variant: "destructive" });
        }
        const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
        const finalPerson = formData.person === 'add_new' ? formData.newPerson : formData.person;

        if (!formData.amount || !finalCategory) {
            return toast({ title: "Validation Error", description: "Amount and Category are required.", variant: "destructive" });
        }
        if (personCategories.includes(formData.category) && !finalPerson) {
            return toast({ title: "Validation Error", description: "Please select or add a person.", variant: "destructive" });
        }

        const transactionData = {
            type: formData.type, category: finalCategory,
            amount: parseFloat(formData.amount), description: formData.description,
            date: formData.date, person: finalPerson || null,
            account_id: formData.account_id
        };

        try {
            if (editingTransaction) {
                await api.transactions.update(editingTransaction.id, transactionData);
                toast({ title: "Success", description: "Transaction updated." });
            } else {
                await api.transactions.create(transactionData);
                toast({ title: "Success", description: "Transaction added." });
            }
            setIsFormDialogOpen(false);
            loadData();
        } catch (error) {
            console.error('Error submitting form:', error);
            toast({ title: "Error", description: error.message || "Failed to save transaction", variant: "destructive" });
        }
    };

    const handleEditClick = (transaction) => {
        setEditingTransaction(transaction);
        const allCategories = transaction.type === 'income' ? incomeCategories : expenseCategories;
        const categoryExists = allCategories.includes(transaction.category);

        setFormData({
            ...transaction,
            category: categoryExists ? transaction.category : 'Custom',
            customCategory: categoryExists ? '' : transaction.category,
            person: transaction.person || '', newPerson: ''
        });
        setIsFormDialogOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeletingTransactionId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingTransactionId) return;
        try {
            await api.transactions.delete(deletingTransactionId);
            toast({ title: "Success", description: "Transaction deleted." });
            loadData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete transaction.", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingTransactionId(null);
        }
    };
    
    const handleDeleteAccount = async (accountId) => {
        try {
            await api.accounts.delete(accountId);
            toast({ title: "Success", description: "Account and its transactions have been deleted." });
            if (selectedAccountId === accountId) {
                setSelectedAccountId('all');
            } else {
                loadData();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
        }
    };
    const handleSettleUp = async (person, account_id) => {
        if (!account_id) {
            toast({ title: "Error", description: "No account is available to settle this transaction.", variant: "destructive" });
            return;
        }
        try {
            await api.people.settleUp(person.name, account_id);
            toast({ title: "Success!", description: `Balance with ${person.name} has been settled.` });
            await loadData(); // Refresh all data
        } catch (error) {
            console.error("Failed to settle up:", error);
            toast({ title: "Error", description: `Could not settle up with ${person.name}. ${error.message}`, variant: "destructive" });
        }
    };

    const handleLogout = () => {
        api.auth.logout();
        navigate('/login');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const uniqueCategories = useMemo(() => {
        const allCategories = new Set(transactions.map(t => t.category));
        return Array.from(allCategories).sort();
    }, [transactions]);

    const filteredTotals = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            if (curr.type === 'income') acc.income += curr.amount;
            else if (curr.type === 'expense') acc.expense += curr.amount;
            acc.net = acc.income - acc.expense;
            return acc;
        }, { income: 0, expense: 0, net: 0 });
    }, [transactions]);

    const isFilterActive = useMemo(() => {
        return filters.search !== '' || filters.type !== '' || filters.category !== '';
    }, [filters]);

    return {
        transactions, people, loading, stats, chartData, peopleStats, accounts,
        selectedAccountId, isManageAccountsOpen, newAccountName, isFormDialogOpen,
        editingTransaction, isDeleteDialogOpen, filters, formData,
        trendPeriod, trendDateRange,
        
        setSelectedAccountId, setIsManageAccountsOpen, setNewAccountName, setIsFormDialogOpen,
        setIsDeleteDialogOpen, setFormData,
        setTrendPeriod, setTrendDateRange,

        handleSettleUp,handleLogout, handleCreateAccount, handleDeleteAccount, resetForm,
        handleFormSubmit, handleEditClick, handleDeleteClick, handleDeleteConfirm,
        handleFilterChange,

        uniqueCategories, filteredTotals, isFilterActive,
    };
};