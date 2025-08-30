import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, LineChart, Loader2, LogOut, User, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart as RechartsLineChart,
    Line,
    ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import { incomeCategories, expenseCategories } from '../mock';

const COLORS = { income: '#00ff88', expense: '#ff4757', electric: '#00bfff' };
const personCategories = ["To Friends", "From Friends", "From Parents"];

const BudgetDashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [people, setPeople] = useState([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, transactionCount: 0 });
    const [chartData, setChartData] = useState({ monthlyData: [], incomeData: [], expenseData: [], trendData: [] });
    const { toast } = useToast();
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        search: '',
        type: '',
        category: '',
        sort: 'date_desc'
    });

    const [formData, setFormData] = useState({
        type: 'expense', category: '', amount: '', description: '',
        date: new Date().toISOString().split('T')[0], customCategory: '',
        person: '', newPerson: ''
    });

    const loadData = async () => {
        try {
            const [transactionsData, dashboardStats, monthlyStats, incomeStats, expenseStats, trendStats, peopleData] = await Promise.all([
                api.transactions.getAll(filters),
                // ✨ UPDATED this function call
                api.stats.getDashboardStats(),
                api.stats.getMonthlyStats(),
                api.stats.getCategoryStats('income'),
                api.stats.getCategoryStats('expense'),
                api.stats.getTrendStats(),
                api.people.getAll()
            ]);

            setTransactions(transactionsData);
            setPeople(peopleData);
            setStats({ totalIncome: dashboardStats.total_income || 0, totalExpenses: dashboardStats.total_expenses || 0, balance: dashboardStats.balance || 0, transactionCount: dashboardStats.transaction_count || 0 });
            setChartData({ monthlyData: monthlyStats.map(item => ({...item})), incomeData: incomeStats, expenseData: expenseStats, trendData: trendStats });
        } catch (error) {
            console.error('Error loading data:', error);
            toast({ title: "Error", description: "Failed to load data. Please refresh the page.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        const handler = setTimeout(() => {
            loadData();
        }, 500); // Debounce API calls
        return () => clearTimeout(handler);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const uniqueCategories = useMemo(() => {
        const allCategories = new Set(transactions.map(t => t.category));
        return Array.from(allCategories).sort();
    }, [transactions]);

    const handleAddTransaction = async () => {
        const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
        const finalPerson = formData.person === 'add_new' ? formData.newPerson : formData.person;

        if (!formData.amount || !finalCategory) {
            return toast({ title: "Validation Error", description: "Amount and Category are required.", variant: "destructive" });
        }
        if (personCategories.includes(formData.category) && !finalPerson) {
            return toast({ title: "Validation Error", description: "Please select or add a person.", variant: "destructive" });
        }

        try {
            const newTransaction = {
                type: formData.type, category: finalCategory,
                amount: parseFloat(formData.amount), description: formData.description, date: formData.date,
                person: finalPerson || null
            };
            await api.transactions.create(newTransaction);

            setFormData({ type: 'expense', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], customCategory: '', person: '', newPerson: '' });
            setIsAddDialogOpen(false);

            // Reset filters to default to ensure the new item is visible and reload data
            setFilters({ search: '', type: '', category: '', sort: 'date_desc' });

            toast({ title: "Success", description: "Transaction added successfully" });
        } catch (error) {
            console.error('Error adding transaction:', error);
            toast({ title: "Error", description: error.message || "Failed to add transaction", variant: "destructive" });
        }
    };

    const handleLogout = () => {
        api.auth.logout();
        navigate('/login');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

    const pieColors = ['#00ff88', '#ff4757', '#00bfff', '#ffa502', '#2ed573', '#ff6348', '#70a1ff'];
    const showPersonField = personCategories.includes(formData.category);

    if (loading && transactions.length === 0 && !filters.search) {
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
                {/* Header */}
                <header className="header-glow glass-effect p-4 sm:p-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-center sm:text-left">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold electric-accent mb-2">Budget Planner</h1>
                        <p className="text-gray-300 text-sm sm:text-base">Track your finances with futuristic precision</p>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="glass-button electric-glow flex-grow sm:flex-grow-0">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Transaction
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-effect border-0 text-white">
                                <DialogHeader>
                                    <DialogTitle className="electric-accent">Add New Transaction</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Type</Label>
                                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({...prev, type: value, category: ''}))}>
                                            <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
                                                <SelectItem value="income" className="income-accent">Income</SelectItem>
                                                <SelectItem value="expense" className="expense-accent">Expense</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Category</Label>
                                        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
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
                                            <Input className="glass-input" value={formData.customCategory} onChange={(e) => setFormData(prev => ({...prev, customCategory: e.target.value}))} placeholder="Enter custom category" />
                                        </div>
                                    )}
                                    {showPersonField && (
                                        <>
                                            <div>
                                                <Label>Person</Label>
                                                <Select value={formData.person} onValueChange={(value) => setFormData(prev => ({...prev, person: value}))}>
                                                    <SelectTrigger className="glass-input"><SelectValue placeholder="Select person..." /></SelectTrigger>
                                                    <SelectContent className="glass-effect border-0 text-white">
                                                        {people.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                                                        <SelectItem value="add_new" className="electric-accent">+ Add New Person</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {formData.person === 'add_new' && (
                                                <div>
                                                    <Label>New Person Name</Label>
                                                    <Input className="glass-input" value={formData.newPerson} onChange={(e) => setFormData(prev => ({...prev, newPerson: e.target.value}))} placeholder="e.g., Alex, Mom..." />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div>
                                        <Label>Amount</Label>
                                        <Input className="glass-input" type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Input className="glass-input" value={formData.description} onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))} placeholder="Transaction description" />
                                    </div>
                                    <div>
                                        <Label>Date</Label>
                                        <Input className="glass-input" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))} />
                                    </div>
                                    <Button onClick={handleAddTransaction} className="w-full glass-button neon-glow" disabled={loading}>
                                        {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>) : ('Add Transaction')}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="glass-button expense-glow">
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                {/* Stats Cards */}
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

                {/* Main Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="glass-effect p-1 h-auto flex-wrap justify-center">
                        <TabsTrigger value="overview" className="glass-button data-[state=active]:electric-glow"><BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                        <TabsTrigger value="categories" className="glass-button data-[state=active]:electric-glow"><PieChart className="w-4 h-4 mr-2" />Categories</TabsTrigger>
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
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}/>
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
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}/>
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                                        <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
                                            <SelectTrigger className="glass-input"><SelectValue placeholder="All Types" /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
                                                <SelectItem value="income">Income</SelectItem>
                                                <SelectItem value="expense">Expense</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                                            <SelectTrigger className="glass-input"><SelectValue placeholder="All Categories" /></SelectTrigger>
                                            <SelectContent className="glass-effect border-0 text-white">
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
                                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin electric-accent" /></div>
                                    ) : transactions.length === 0 ? (
                                        <div className="text-center py-8"><p className="text-gray-400">No transactions match your filters.</p></div>
                                    ) : (transactions.map((t) => (
                                        <div key={t.id} className="transaction-item p-4">
                                            <div className="flex justify-between items-center">
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
        </div>
    );
};

export default BudgetDashboard;