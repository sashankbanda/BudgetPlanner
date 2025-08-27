import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, LineChart, Loader2 } from 'lucide-react';
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

const COLORS = {
  income: '#00ff88',
  expense: '#ff4757',
  electric: '#00bfff'
};

const BudgetDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    transactionCount: 0
  });
  const [chartData, setChartData] = useState({
    monthlyData: [],
    incomeData: [],
    expenseData: [],
    trendData: []
  });
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    customCategory: ''
  });

  // Load data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load transactions
      const transactionsData = await api.transactions.getAll();
      setTransactions(transactionsData);
      
      // Load current month stats  
      const currentStats = await api.stats.getCurrentMonthStats();
      setStats({
        totalIncome: currentStats.total_income || 0,
        totalExpenses: currentStats.total_expenses || 0,
        balance: currentStats.balance || 0,
        transactionCount: currentStats.transaction_count || 0
      });
      
      // Load chart data
      const [monthlyStats, incomeStats, expenseStats, trendStats] = await Promise.all([
        api.stats.getMonthlyStats(),
        api.stats.getCategoryStats('income'),
        api.stats.getCategoryStats('expense'),
        api.stats.getTrendStats()
      ]);
      
      setChartData({
        monthlyData: monthlyStats.map(item => ({
          month: item.month,
          income: item.income,
          expense: item.expense
        })),
        incomeData: incomeStats,
        expenseData: expenseStats,
        trendData: trendStats
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const finalCategory = formData.category === 'Custom' ? formData.customCategory : formData.category;
    if (!finalCategory) {
      toast({
        title: "Validation Error", 
        description: "Please enter a custom category name",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const newTransaction = {
        type: formData.type,
        category: finalCategory,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date
      };

      await api.transactions.create(newTransaction);
      
      // Reset form
      setFormData({
        type: 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        customCategory: ''
      });
      setIsAddDialogOpen(false);
      
      // Reload data to reflect changes
      await loadData();
      
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pieColors = ['#00ff88', '#ff4757', '#00bfff', '#ffa502', '#2ed573', '#ff6348', '#70a1ff'];

  if (loading && transactions.length === 0) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="header-glow glass-effect p-6 mb-8 floating-animation">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold electric-accent mb-2">Budget Planner</h1>
              <p className="text-gray-300">Track your finances with futuristic precision</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="glass-button electric-glow" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
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
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-effect border-0 text-white">
                        <SelectItem value="income" className="income-accent">Income</SelectItem>
                        <SelectItem value="expense" className="expense-accent">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                      <SelectTrigger className="glass-input">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
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
                      <Input
                        className="glass-input"
                        value={formData.customCategory}
                        onChange={(e) => setFormData(prev => ({...prev, customCategory: e.target.value}))}
                        placeholder="Enter custom category"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Amount</Label>
                    <Input
                      className="glass-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      className="glass-input"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                      placeholder="Transaction description"
                    />
                  </div>

                  <div>
                    <Label>Date</Label>
                    <Input
                      className="glass-input"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                    />
                  </div>

                  <Button onClick={handleAddTransaction} className="w-full glass-button neon-glow" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Transaction...
                      </>
                    ) : (
                      'Add Transaction'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'income-accent' : 'expense-accent'}`}>
                    ${stats.balance.toFixed(2)}
                  </p>
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
          <TabsList className="glass-effect p-1">
            <TabsTrigger value="overview" className="glass-button data-[state=active]:electric-glow">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" className="glass-button data-[state=active]:electric-glow">
              <PieChart className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="trends" className="glass-button data-[state=active]:electric-glow">
              <LineChart className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="transactions" className="glass-button data-[state=active]:electric-glow">
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="electric-accent">Monthly Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#ffffff" />
                      <YAxis stroke="#ffffff" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="income" fill={COLORS.income} />
                      <Bar dataKey="expense" fill={COLORS.expense} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="income-accent">Income Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie dataKey="value" data={chartData.incomeData} cx="50%" cy="50%" outerRadius={80} label>
                          {chartData.incomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="expense-accent">Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie dataKey="value" data={chartData.expenseData} cx="50%" cy="50%" outerRadius={80} label>
                          {chartData.expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="electric-accent">Spending Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={chartData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#ffffff" />
                      <YAxis stroke="#ffffff" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line type="monotone" dataKey="total" stroke={COLORS.electric} strokeWidth={3} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="electric-accent">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin electric-accent" />
                      <span className="ml-2 text-gray-400">Loading transactions...</span>
                    </div>
                  )}
                  {!loading && transactions.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No transactions found. Add your first transaction to get started!</p>
                    </div>
                  )}
                  {transactions.slice(0, 20).map((transaction) => (
                    <div key={transaction.id} className="transaction-item p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge 
                              className={`${
                                transaction.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {transaction.type === 'income' ? 'Income' : 'Expense'}
                            </Badge>
                            <span className="font-semibold">{transaction.category}</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'income-accent' : 'expense-accent'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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