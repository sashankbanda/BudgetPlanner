// frontend/src/hooks/useBudgetData.js

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import api from '../services/api';
import { incomeCategories, expenseCategories } from '../mock';
import { subDays, format } from 'date-fns';
import { useDebounce } from './useDebounce';

const personCategories = ["To Friends", "From Friends", "To Parents", "From Parents"];

export const useBudgetData = () => {
    // --- STATE MANAGEMENT ---
    const [transactions, setTransactions] = useState([]);
    const [people, setPeople] = useState([]);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, transactionCount: 0 });
    const [chartData, setChartData] = useState({ monthlyData: [], incomeData: [], expenseData: [], trendData: [] });
    const [peopleStats, setPeopleStats] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    
    // ✨ ADDED: State for groups
    const [groups, setGroups] = useState([]);
    const [groupStats, setGroupStats] = useState([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [isTransactionLoading, setIsTransactionLoading] = useState(true);

    // Trend controls state
    const [trendPeriod, setTrendPeriod] = useState('weekly');
    const [trendDateRange, setTrendDateRange] = useState({ from: subDays(new Date(), 29), to: new Date() });

    // Dialog and Form states
    const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
    const [newAccountName, setNewAccountName] = useState("");
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'expense', category: '', amount: '', description: '',
        date: new Date().toISOString().split('T')[0], customCategory: '',
        person: '', newPerson: '', account_id: '',
        transaction_with: 'person', // ✨ ADDED: 'person' or 'group'
        group_id: '' // ✨ ADDED
    });

    // Filtering states
    const [filters, setFilters] = useState({ search: '', type: '', category: '', sort: 'date_desc' });
    const debouncedSearchTerm = useDebounce(filters.search, 300);

    const { toast } = useToast();
    const navigate = useNavigate();

    // --- DATA FETCHING LOGIC ---
    const loadCoreData = useCallback(async () => {
        if (!accounts.length) setLoading(true);

        try {
            const trendParams = {
                period: trendPeriod,
                start_date: format(trendDateRange.from, 'yyyy-MM-dd'),
                end_date: format(trendDateRange.to, 'yyyy-MM-dd'),
                account_id: selectedAccountId !== 'all' ? selectedAccountId : undefined,
            };

            const [
                accountsData, dashboardStats, incomeStats, expenseStats, 
                trendStats, peopleData, peopleStatsData, groupsData, groupStatsData // ✨ ADDED groups
            ] = await Promise.all([
                api.accounts.getAll(),
                api.stats.getDashboardStats(selectedAccountId),
                api.stats.getCategoryStats('income', selectedAccountId),
                api.stats.getCategoryStats('expense', selectedAccountId),
                api.stats.getGranularTrendStats(trendParams),
                api.people.getAll(),
                api.stats.getPeopleStats(selectedAccountId),
                api.groups.getAll(), // ✨ ADDED
                api.stats.getGroupsSummaryStats(selectedAccountId) // ✨ ADDED
            ]);

            setAccounts(accountsData);
            setPeople(peopleData);
            setPeopleStats(peopleStatsData);
            setGroups(groupsData); // ✨ ADDED
            setGroupStats(groupStatsData); // ✨ ADDED
            setStats({ totalIncome: dashboardStats.total_income || 0, totalExpenses: dashboardStats.total_expenses || 0, balance: dashboardStats.balance || 0, transactionCount: dashboardStats.transaction_count || 0 });
            setChartData({ incomeData: incomeStats, expenseData: expenseStats, trendData: trendStats });

            if (!formData.account_id && accountsData.length > 0) {
                setFormData(prev => ({ ...prev, account_id: accountsData[0].id }));
            }
        } catch (error) {
            console.error('Error loading core data:', error);
            toast({ title: "Error", description: `Failed to load dashboard data. ${error.message}`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [selectedAccountId, trendPeriod, trendDateRange.from, trendDateRange.to]);

    useEffect(() => {
        loadCoreData();
    }, [loadCoreData]);

    useEffect(() => {
        if (loading) return;
        const fetchTransactions = async () => {
            setIsTransactionLoading(true);
            try {
                const currentFilters = { ...filters, search: debouncedSearchTerm };
                const transactionsData = await api.transactions.getAll(currentFilters, selectedAccountId);
                setTransactions(transactionsData);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                toast({ title: "Error", description: `Failed to fetch transactions. ${error.message}`, variant: "destructive" });
            } finally {
                setIsTransactionLoading(false);
            }
        };
        fetchTransactions();
    }, [debouncedSearchTerm, filters.type, filters.category, filters.sort, selectedAccountId, loading, toast]);

    // --- HANDLERS ---
    const handleCreateGroup = async (groupData) => { // ✨ ADDED
        try {
            await api.groups.create(groupData);
            toast({ title: "Success!", description: `Group '${groupData.name}' has been created.` });
            await loadCoreData(); // Refresh data to show the new group
        } catch (error) {
            toast({ title: "Error", description: `Failed to create group: ${error.message}`, variant: "destructive" });
        }
    };
    
        // ✨ ADDED: Handler to update a group ✨
    const handleUpdateGroup = async (groupId, groupData) => {
        try {
            await api.groups.update(groupId, groupData);
            toast({ title: "Success!", description: `Group '${groupData.name}' has been updated.` });
            await loadCoreData(); // Refresh all data
        } catch (error) {
            toast({ title: "Error", description: `Failed to update group: ${error.message}`, variant: "destructive" });
        }
    };

    // ✨ ADDED: Handler to delete a group ✨
    const handleDeleteGroup = async (groupId) => {
        try {
            await api.groups.delete(groupId);
            toast({ title: "Success!", description: "Group has been deleted." });
            await loadCoreData(); // Refresh all data
        } catch (error) {
            toast({ title: "Error", description: `Failed to delete group: ${error.message}`, variant: "destructive" });
        }
    };

    const handleCreateAccount = async (name) => {
        const accountName = name || newAccountName;
        if (!accountName.trim()) {
            return toast({ title: "Error", description: "Account name cannot be empty.", variant: "destructive" });
        }
        try {
            const newAccount = await api.accounts.create({ name: accountName });
            toast({ title: "Success", description: "Account created." });
            setNewAccountName("");
            setSelectedAccountId(newAccount.id);
        } catch (error) {
            toast({ title: "Error", description: "Failed to create account.", variant: "destructive" });
        }
    };

    const handleDeleteAccount = async (accountId) => {
        try {
            await api.accounts.delete(accountId);
            toast({ title: "Success", description: "Account and its transactions have been deleted." });
            setSelectedAccountId('all');
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
        }
    };

    const handleFormSubmit = async () => {
        if (!formData.account_id) return toast({ title: "Validation Error", description: "Please select an account.", variant: "destructive" });
        const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
        if (!formData.amount || !finalCategory) return toast({ title: "Validation Error", description: "Amount and Category are required.", variant: "destructive" });
        
        // ✨ FIX: Determine the correct person name when adding a new one
        let personValue = null;
        if (formData.transaction_with === 'person') {
            if (formData.person === 'add_new') {
                if (!formData.newPerson || !formData.newPerson.trim()) {
                    toast({ title: "Validation Error", description: "New Person Name cannot be empty.", variant: "destructive" });
                    return;
                }
                personValue = formData.newPerson.trim();
            } else {
                personValue = formData.person;
            }
        }

        const transactionData = {
            type: formData.type,
            category: finalCategory,
            amount: parseFloat(formData.amount),
            description: formData.description,
            date: formData.date,
            account_id: formData.account_id,
            person: personValue, // ✨ FIX: Use the correctly determined person value
            group_id: formData.transaction_with === 'group' ? formData.group_id : null,
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
            loadCoreData();
        } catch (error) {
            toast({ title: "Error", description: error.message || "Failed to save transaction", variant: "destructive" });
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (!deletingTransactionId) return;
        try {
            await api.transactions.delete(deletingTransactionId);
            toast({ title: "Success", description: "Transaction deleted." });
            loadCoreData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete transaction.", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingTransactionId(null);
        }
    };

    const handleSettleUp = async (person, account_id) => {
        if (!account_id) return toast({ title: "Error", description: "No account is available.", variant: "destructive" });
        try {
            await api.people.settleUp(person.name, account_id);
            toast({ title: "Success!", description: `Balance with ${person.name} has been settled.` });
            await loadCoreData();
        } catch (error) {
            toast({ title: "Error", description: `Could not settle up. ${error.message}`, variant: "destructive" });
        }
    };

    const handleLogout = () => {
        api.auth.logout();
        navigate('/login');
        toast({ title: "Logged Out" });
    };
    
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const resetForm = useCallback(() => {
        setFormData({
            type: 'expense', category: '', amount: '', description: '',
            date: new Date().toISOString().split('T')[0], customCategory: '',
            person: '', newPerson: '',
            // If a specific account is selected, use it. Otherwise, default to the first account.
            account_id: selectedAccountId !== 'all' ? selectedAccountId : (accounts.length > 0 ? accounts[0].id : ''),
            transaction_with: 'person',
            group_id: ''
        });
        setEditingTransaction(null);
    }, [accounts, selectedAccountId]); // Add selectedAccountId to the dependency array

    const handleEditClick = (transaction) => {
        setEditingTransaction(transaction);
        const isStandardIncome = incomeCategories.includes(transaction.category);
        const isStandardExpense = expenseCategories.includes(transaction.category);
        const isCustom = !isStandardIncome && !isStandardExpense;

        setFormData({
            type: transaction.type,
            category: isCustom ? 'Custom' : transaction.category,
            customCategory: isCustom ? transaction.category : '',
            amount: transaction.amount.toString(),
            description: transaction.description || '',
            date: transaction.date,
            person: transaction.person || '',
            newPerson: '',
            account_id: transaction.account_id,
            transaction_with: transaction.group_id ? 'group' : 'person', // ✨ ADDED
            group_id: transaction.group_id || '' // ✨ ADDED
        });
        setIsFormDialogOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeletingTransactionId(id);
        setIsDeleteDialogOpen(true);
    };

    const uniqueCategories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))).sort(), [transactions]);
    const isFilterActive = useMemo(() => filters.search !== '' || filters.type !== '' || filters.category !== '', [filters]);
    const filteredTotals = useMemo(() => transactions.reduce((acc, curr) => {
            if (curr.type === 'income') acc.income += curr.amount;
            else if (curr.type === 'expense') acc.expense += curr.amount;
            acc.net = acc.income - acc.expense;
            return acc;
        }, { income: 0, expense: 0, net: 0 }), 
    [transactions]);

    return {
        transactions, people, loading, isTransactionLoading, stats, chartData, 
        peopleStats, accounts, selectedAccountId, isManageAccountsOpen, newAccountName, 
        isFormDialogOpen, editingTransaction, isDeleteDialogOpen, filters, formData,
        trendPeriod, trendDateRange,
        groups, groupStats, // ✨ ADDED
        
        setSelectedAccountId, setIsManageAccountsOpen, setNewAccountName, setIsFormDialogOpen,
        setIsDeleteDialogOpen, setFormData, setTrendPeriod, setTrendDateRange,

        handleSettleUp, handleLogout, handleCreateAccount, handleDeleteAccount, resetForm,
        handleFormSubmit, handleEditClick, handleDeleteClick, handleDeleteConfirm,
        handleFilterChange,
        handleCreateGroup, // ✨ ADDED
        handleUpdateGroup, // ✨ ADDED
        handleDeleteGroup, // ✨ ADDED

        uniqueCategories, filteredTotals, isFilterActive,
    };
};