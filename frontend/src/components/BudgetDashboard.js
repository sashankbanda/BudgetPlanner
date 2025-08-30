import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, LineChart, Loader2, LogOut, User, Search, Pencil, Trash2, Users, Wallet, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart as RechartsPieChart, Pie, Cell,
    LineChart as RechartsLineChart, Line, ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { incomeCategories, expenseCategories } from '../mock';

const COLORS = { income: '#00ff88', expense: '#ff4757', electric: '#00bfff' };
const personCategories = ["To Friends", "From Friends", "To Parents", "From Parents"];

const BudgetDashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [people, setPeople] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, transactionCount: 0 });
    const [chartData, setChartData] = useState({ monthlyData: [], incomeData: [], expenseData: [], trendData: [] });
    const [peopleStats, setPeopleStats] = useState([]);
    const { toast } = useToast();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
    const [newAccountName, setNewAccountName] = useState("");

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        type: '',
        category: '',
        sort: 'date_desc'
    });

    const [formData, setFormData] = useState({
        type: 'expense', category: '', amount: '', description: '',
        date: new Date().toISOString().split('T')[0], customCategory: '',
        person: '', newPerson: '', account_id: ''
    });

    useEffect(() => {
        if (!personCategories.includes(formData.category)) {
            setFormData(prevData => ({ ...prevData, person: '' }));
        }
    }, [formData.category]);


    const loadData = async () => {
        try {
            const [
                accountsData, transactionsData, dashboardStats, monthlyStats,
                incomeStats, expenseStats, trendStats, peopleData, peopleStatsData
            ] = await Promise.all([
                api.accounts.getAll(),
                api.transactions.getAll(filters, selectedAccountId),
                api.stats.getDashboardStats(selectedAccountId),
                api.stats.getMonthlyStats(selectedAccountId),
                api.stats.getCategoryStats('income', selectedAccountId),
                api.stats.getCategoryStats('expense', selectedAccountId),
                api.stats.getTrendStats(selectedAccountId),
                api.people.getAll(),
                api.stats.getPeopleStats(selectedAccountId),
            ]);

            setAccounts(accountsData);
            setTransactions(transactionsData);
            setPeople(peopleData);
            setPeopleStats(peopleStatsData);
            setStats({ totalIncome: dashboardStats.total_income || 0, totalExpenses: dashboardStats.total_expenses || 0, balance: dashboardStats.balance || 0, transactionCount: dashboardStats.transaction_count || 0 });
            setChartData({ monthlyData: monthlyStats.map(item => ({ ...item })), incomeData: incomeStats, expenseData: expenseStats, trendData: trendStats });
        } catch (error) {
            console.error('Error loading data:', error);
            toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        setLoading(true);
        const handler = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(handler);
    }, [filters, selectedAccountId]);
    
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
            type: formData.type,
            category: finalCategory,
            amount: parseFloat(formData.amount),
            description: formData.description,
            date: formData.date,
            person: finalPerson || null,
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
            person: transaction.person || '',
            newPerson: ''
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
    
    const handleCreateAccount = async () => {
        if (!newAccountName.trim()) {
            return toast({ title: "Error", description: "Account name cannot be empty.", variant: "destructive" });
        }
        try {
            const newAccount = await api.accounts.create({ name: newAccountName });
            toast({ title: "Success", description: "Account created." });
            setNewAccountName("");
            setAccounts(prev => [...prev, newAccount]); 
            setSelectedAccountId(newAccount.id);
        } catch (error) {
            toast({ title: "Error", description: "Failed to create account.", variant: "destructive" });
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

    // ✨ NEW: Calculate totals for the filtered transactions using useMemo for efficiency.
    const filteredTotals = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            if (curr.type === 'income') {
                acc.income += curr.amount;
            } else if (curr.type === 'expense') {
                acc.expense += curr.amount;
            }
            acc.net = acc.income - acc.expense;
            return acc;
        }, { income: 0, expense: 0, net: 0 });
    }, [transactions]); // This calculation only re-runs when the 'transactions' state changes.

    // ✨ NEW: Helper to determine if any filters are currently active.
    const isFilterActive = useMemo(() => {
        return filters.search !== '' || filters.type !== '' || filters.category !== '';
    }, [filters]);

    const pieColors = ['#00ff88', '#ff4757', '#00bfff', '#ffa502', '#2ed573', '#ff6348', '#70a1ff'];
    const showPersonField = personCategories.includes(formData.category);

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
                <header className="header-glow glass-effect p-4 sm:p-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-center sm:text-left">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold electric-accent mb-2">Budget Planner</h1>
                        <p className="text-gray-300 text-sm sm:text-base">Track your finances with futuristic precision</p>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
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

                        <Dialog open={isManageAccountsOpen} onOpenChange={setIsManageAccountsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="glass-button">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-effect border-0 text-white">
                                <DialogHeader>
                                    <DialogTitle className="electric-accent">Manage Accounts</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Add New Account</Label>
                                        <div className="flex gap-2">
                                            <Input className="glass-input" placeholder="e.g., HDFC Savings" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
                                            <Button className="glass-button neon-glow" onClick={handleCreateAccount}>Add</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Existing Accounts</Label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                                            {accounts.length > 0 ? accounts.map(acc => (
                                                <div key={acc.id} className="flex items-center justify-between p-2 glass-effect rounded-md">
                                                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />{acc.name}</span>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" onClick={() => handleDeleteAccount(acc.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )) : <p className="text-sm text-gray-400 text-center py-4">No accounts created yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        
                        <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => { setIsFormDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                            <DialogTrigger asChild>
                                <Button className="glass-button electric-glow flex-grow sm:flex-grow-0" disabled={accounts.length === 0}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Transaction
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-effect border-0 text-white">
                                <DialogHeader>
                                    <DialogTitle className="electric-accent">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
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
                                     )}
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
                                     <Button onClick={handleFormSubmit} className="w-full glass-button neon-glow">
                                         {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                                     </Button>
                                 </div>
                            </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="glass-button expense-glow"><LogOut className="w-5 h-5" /></Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="glass-card stat-card">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Total Income</p>
                                    <p className="text-2xl font-bold income-accent">${stats.totalIncome.toFixed(2)}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 income-accent" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card stat-card">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Total Expenses</p>
                                    <p className="text-2xl font-bold expense-accent">${stats.totalExpenses.toFixed(2)}</p>
                                </div>
                                <TrendingDown className="w-8 h-8 expense-accent" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card stat-card">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Balance</p>
                                    <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'income-accent' : 'expense-accent'}`}>${stats.balance.toFixed(2)}</p>
                                </div>
                                <DollarSign className="w-8 h-8 electric-accent" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card stat-card">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">Transactions</p>
                                    <p className="text-2xl font-bold electric-accent">{stats.transactionCount}</p>
                                </div>
                                <BarChart3 className="w-8 h-8 electric-accent" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="glass-effect p-1 h-auto flex-wrap justify-center">
                       <TabsTrigger value="overview" className="glass-button data-[state=active]:electric-glow"><BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                        <TabsTrigger value="categories" className="glass-button data-[state=active]:electric-glow"><PieChart className="w-4 h-4 mr-2" />Categories</TabsTrigger>
                        <TabsTrigger value="people" className="glass-button data-[state=active]:electric-glow"><Users className="w-4 h-4 mr-2" />People</TabsTrigger>
                        <TabsTrigger value="trends" className="glass-button data-[state=active]:electric-glow"><LineChart className="w-4 h-4 mr-2" />Trends</TabsTrigger>
                        <TabsTrigger value="transactions" className="glass-button data-[state=active]:electric-glow">Transactions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                         <Card className="glass-card">
                             <CardHeader><CardTitle className="electric-accent">Monthly Totals</CardTitle></CardHeader>
                             <CardContent>
                                 <div className="chart-container">
                                     <ResponsiveContainer width="100%" height={300}>
                                         <BarChart data={chartData.monthlyData}>
                                             <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                             <XAxis dataKey="month" stroke="#ffffff" />
                                             <YAxis stroke="#ffffff" />
                                             <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                             <Legend />
                                             <Bar dataKey="income" fill={COLORS.income} />
                                             <Bar dataKey="expense" fill={COLORS.expense} />
                                         </BarChart>
                                     </ResponsiveContainer>
                                 </div>
                             </CardContent>
                         </Card>
                     </TabsContent>

                    <TabsContent value="categories">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass-card">
                                <CardHeader><CardTitle className="income-accent">Income Categories</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RechartsPieChart>
                                                <Pie dataKey="value" data={chartData.incomeData} cx="50%" cy="50%" outerRadius={80} label>
                                                    {chartData.incomeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="glass-card">
                                <CardHeader><CardTitle className="expense-accent">Expense Categories</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RechartsPieChart>
                                                <Pie dataKey="value" data={chartData.expenseData} cx="50%" cy="50%" outerRadius={80} label>
                                                    {chartData.expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="people">
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="electric-accent">People Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {peopleStats.length === 0 ? (
                                    <div className="text-center py-8"><p className="text-gray-400">No transactions with people found.</p></div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {peopleStats.map((person) => (
                                            <Card key={person.name} className="glass-effect p-4 flex flex-col justify-between">
                                                <div className="mb-4">
                                                    <CardTitle className="text-xl electric-accent flex items-center gap-2">
                                                        <User className="w-5 h-5" /> {person.name}
                                                    </CardTitle>
                                                    <p className="text-xs text-gray-400">{person.transaction_count} transaction(s)</p>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">You Received:</span>
                                                        <span className="font-semibold income-accent">+${person.total_received.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-400">You Gave:</span>
                                                        <span className="font-semibold expense-accent">-${person.total_given.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="border-t border-white/10 mt-4 pt-4">
                                                    <div className="flex justify-between items-center font-bold">
                                                        <span className="text-gray-300">Net Balance:</span>
                                                        <span className={person.net_balance >= 0 ? 'income-accent' : 'expense-accent'}>
                                                            {person.net_balance >= 0 ? `+${person.net_balance.toFixed(2)}` : `${person.net_balance.toFixed(2)}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-center text-gray-500 mt-1">
                                                        {person.net_balance > 0 ? `${person.name} owes you.` : person.net_balance < 0 ? `You owe ${person.name}.` : 'Settled up.'}
                                                    </p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trends">
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="electric-accent">Spending Trends</CardTitle></CardHeader>
                            <CardContent>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsLineChart data={chartData.trendData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="month" stroke="#ffffff" />
                                            <YAxis stroke="#ffffff" />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                            <Line type="monotone" dataKey="net" stroke={COLORS.electric} strokeWidth={3} />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="transactions">
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="electric-accent">Transactions History</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="glass-effect p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Search description, category, person..." className="glass-input pl-10" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:flex-grow-0">
                                        <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v || '')}>
                                            <SelectTrigger className="glass-input"><SelectValue placeholder="All Types" /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
                                                <SelectItem value="">All Types</SelectItem>
                                                <SelectItem value="income">Income</SelectItem>
                                                <SelectItem value="expense">Expense</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v || '')}>
                                            <SelectTrigger className="glass-input"><SelectValue placeholder="All Categories" /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
                                                {/* ✨ NEW: "All Categories" option added */}
                                                <SelectItem value="">All Categories</SelectItem>
                                                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
                                            <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
                                                <SelectItem value="date_desc">Date (Newest)</SelectItem>
                                                <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                                                <SelectItem value="amount_desc">Amount (Highest)</SelectItem>
                                                <SelectItem value="amount_asc">Amount (Lowest)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* ✨ NEW: Dynamic Filter Summary Bar */}
                                {isFilterActive && (
                                    <div className="glass-effect p-3 rounded-lg text-sm">
                                        <p className="text-gray-400 mb-2 text-center">
                                            Filtered Results ({transactions.length} transaction{transactions.length !== 1 && 's'}):
                                        </p>
                                        <div className="flex justify-around items-center gap-4 text-center">
                                            <div>
                                                <span className="text-xs text-gray-400 block">Income</span>
                                                <span className="font-bold income-accent">+${filteredTotals.income.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 block">Expense</span>
                                                <span className="font-bold expense-accent">-${filteredTotals.expense.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-400 block">Net Total</span>
                                                <span className={`font-bold ${filteredTotals.net >= 0 ? 'income-accent' : 'expense-accent'}`}>
                                                    {filteredTotals.net >= 0 ? '+' : ''}${filteredTotals.net.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin electric-accent" /></div>
                                    ) : transactions.length === 0 ? (
                                        <div className="text-center py-8"><p className="text-gray-400">No transactions match your filters.</p></div>
                                    ) : (transactions.map((t) => (
                                        <div key={t.id} className="transaction-item p-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <Badge className={`${t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{t.type === 'income' ? 'Income' : 'Expense'}</Badge>
                                                        <span className="font-semibold text-white/70">{t.category}</span>
                                                        {t.person && (<Badge variant="outline" className="border-blue-500/50 text-blue-400"><User className="w-3 h-3 mr-1" />{t.person}</Badge>)}
                                                    </div>
                                                    <p className="text-sm text-gray-400 mt-1">{t.description}</p>
                                                    <p className="text-xs text-gray-500">{t.date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${t.type === 'income' ? 'income-accent' : 'expense-accent'}`}>{t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}</p>
                                                    <div className="flex items-center justify-end gap-1 mt-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleEditClick(t)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" onClick={() => handleDeleteClick(t.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
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