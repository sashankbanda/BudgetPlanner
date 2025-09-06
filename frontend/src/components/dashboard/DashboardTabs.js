import React from 'react';
import { BarChart3, PieChart, LineChart as LineChartIcon, Users, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- Mock UI Components to resolve import errors ---

// Mock for Card components from '../ui/card'
const Card = ({ children, className = '' }) => <div className={`border rounded-lg shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }) => <div className={`p-6 flex flex-col space-y-1.5 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

// Mock for Button component from '../ui/button'
const Button = ({ children, className = '', ...props }) => (
    <button className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4 ${className}`} {...props}>
        {children}
    </button>
);

// Mock for Tabs components from '../ui/tabs'
// This is a simplified implementation for demonstration purposes.
const TabsContext = React.createContext({ activeTab: '', onTabChange: () => {} });

const Tabs = ({ children, value, onValueChange, className = '' }) => (
    <TabsContext.Provider value={{ activeTab: value, onTabChange: onValueChange }}>
        <div className={className}>{children}</div>
    </TabsContext.Provider>
);

const TabsList = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

const TabsTrigger = ({ children, value, className = '' }) => {
    const { activeTab, onTabChange } = React.useContext(TabsContext);
    return (
        <button
            onClick={() => onTabChange(value)}
            className={className}
            data-state={activeTab === value ? 'active' : 'inactive'}
        >
            {children}
        </button>
    );
};

const TabsContent = ({ children, value }) => {
    const { activeTab } = React.useContext(TabsContext);
    return activeTab === value ? <div>{children}</div> : null;
};


// Mock for TransactionList component from './TransactionList'
const TransactionList = ({ transactions = [], loading }) => (
    <Card className="glass-card">
        <CardHeader>
            <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? <p>Loading transactions...</p> : 
                transactions.length > 0 ? (
                    <ul>{transactions.map(t => <li key={t.id}>{t.description}</li>)}</ul>
                ) : <p>No transactions found.</p>
            }
        </CardContent>
    </Card>
);

// Mock for TrendControls component from './TrendControls'
const TrendControls = ({ trendPeriod, setTrendPeriod }) => (
    <div className="flex items-center gap-2">
        <select value={trendPeriod} onChange={(e) => setTrendPeriod(e.target.value)} className="bg-gray-700 text-white p-2 rounded">
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="custom">Custom</option>
        </select>
    </div>
);


// --- Original DashboardTabs Component ---

const COLORS = { income: '#00ff88', expense: '#ff4757', electric: '#00bfff' };
const pieColors = ['#00ff88', '#ff4757', '#00bfff', '#ffa502', '#2ed573', '#ff6348', '#70a1ff'];

const DashboardTabs = ({
    activeTab, setActiveTab, chartData, peopleStats,
    transactions, loading, handleEditClick, handleDeleteClick,
    filters, handleFilterChange, uniqueCategories, isFilterActive, filteredTotals,
    trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange,onSettleUpClick,
    // Props for search functionality are correctly included
    searchInput, handleSearchSubmit
}) => {
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass-effect p-1 h-auto flex-wrap justify-center">
                <TabsTrigger value="overview" className="glass-button data-[state=active]:electric-glow"><BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                <TabsTrigger value="categories" className="glass-button data-[state=active]:electric-glow"><PieChart className="w-4 h-4 mr-2" />Categories</TabsTrigger>
                <TabsTrigger value="people" className="glass-button data-[state=active]:electric-glow"><Users className="w-4 h-4 mr-2" />People</TabsTrigger>
                <TabsTrigger value="trends" className="glass-button data-[state=active]:electric-glow"><LineChartIcon className="w-4 h-4 mr-2" />Trends</TabsTrigger>
                <TabsTrigger value="transactions" className="glass-button data-[state=active]:electric-glow">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="electric-accent">Financial Overview</CardTitle>
                            <TrendControls {...{ trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange }} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="chart-container h-[350px]">
                            {activeTab === 'overview' && (
                                <>
                                    {chartData.trendData && chartData.trendData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData.trendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="date" stroke="#ffffff" />
                                                <YAxis stroke="#ffffff" />
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Legend />
                                                <Bar dataKey="income" fill={COLORS.income} name="Income" />
                                                <Bar dataKey="expense" fill={COLORS.expense} name="Expense" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            <p>No data available for the selected period.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="categories">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="glass-card">
                        <CardHeader><CardTitle className="income-accent">Income Categories</CardTitle></CardHeader>
                        <CardContent>
                            <div className="chart-container h-[350px]">
                                {activeTab === 'categories' && (
                                    <>
                                        {chartData.incomeData && chartData.incomeData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie dataKey="value" data={chartData.incomeData} cx="50%" cy="50%" outerRadius={80} label>
                                                        {chartData.incomeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                    <Legend />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                <p>No income data to display.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-card">
                        <CardHeader><CardTitle className="expense-accent">Expense Categories</CardTitle></CardHeader>
                        <CardContent>
                            <div className="chart-container h-[350px]">
                                {activeTab === 'categories' && (
                                    <>
                                        {chartData.expenseData && chartData.expenseData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie dataKey="value" data={chartData.expenseData} cx="50%" cy="50%" outerRadius={80} label>
                                                        {chartData.expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                    <Legend />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                <p>No expense data to display.</p>
                                            </div>
                                        )}
                                    </>
                                )}
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
                                        <div className="mt-4">
                                            <Button 
                                                className="w-full glass-button neon-glow"
                                                disabled={Math.abs(person.net_balance) < 0.01}
                                                onClick={() => onSettleUpClick(person)}
                                            >
                                                Settle Up
                                            </Button>
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
                     <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="electric-accent">Net Income Trends</CardTitle>
                            <TrendControls {...{ trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange }} />
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="chart-container h-[350px]">
                            {activeTab === 'trends' && (
                                <>
                                    {chartData.trendData && chartData.trendData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData.trendData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="date" stroke="#ffffff" />
                                                <YAxis stroke="#ffffff" />
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="net" name="Net" stroke={COLORS.electric} strokeWidth={3} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-400">
                                            <p>No data available for the selected period.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="transactions">
                <TransactionList {...{
                    transactions, loading, handleEditClick, handleDeleteClick,
                    filters, handleFilterChange, uniqueCategories,
                    isFilterActive, filteredTotals,
                    searchInput, handleSearchSubmit
                }} />
            </TabsContent>
        </Tabs>
    );
};

export default DashboardTabs;

