// frontend/src/components/dashboard/DashboardTabs.js

import React, { useState } from 'react';
import { BarChart3, PieChart, LineChart as LineChartIcon, Users, User, Check, Users2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import TransactionList from './TransactionList';
import TrendControls from './TrendControls';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import CreateGroupDialog from './CreateGroupDialog'; // ✨ ADDED

const COLORS = { income: '#00ff88', expense: '#ff4757', electric: '#00bfff' };
const pieColors = ['#00ff88', '#ff4757', '#00bfff', '#ffa502', '#2ed573', '#ff6348', '#70a1ff'];

const DashboardTabs = ({
    activeTab, setActiveTab, chartData, peopleStats, groupStats,
    transactions, loading, handleEditClick, handleDeleteClick,
    filters, handleFilterChange, uniqueCategories, isFilterActive, filteredTotals,
    trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange,
    onSettleUpClick, handleCreateGroup, groups // ✨ ADDED handleCreateGroup & groups
}) => {

    // ✨ ADDED: State for group creation
    const [selectMode, setSelectMode] = useState(false);
    const [selectedPeople, setSelectedPeople] = useState([]);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

    const handlePersonSelect = (personName) => {
        setSelectedPeople(prev =>
            prev.includes(personName)
                ? prev.filter(p => p !== personName)
                : [...prev, personName]
        );
    };

    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedPeople([]); // Reset selection when toggling mode
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="glass-effect p-1 h-auto flex-wrap justify-center">
                    <TabsTrigger value="overview" className="glass-button data-[state=active]:electric-glow"><BarChart3 className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                    <TabsTrigger value="categories" className="glass-button data-[state=active]:electric-glow"><PieChart className="w-4 h-4 mr-2" />Categories</TabsTrigger>
                    <TabsTrigger value="people" className="glass-button data-[state=active]:electric-glow"><Users className="w-4 h-4 mr-2" />People</TabsTrigger>
                    <TabsTrigger value="groups" className="glass-button data-[state=active]:electric-glow"><Users2 className="w-4 h-4 mr-2" />Groups</TabsTrigger> {/* ✨ ADDED */}
                    <TabsTrigger value="trends" className="glass-button data-[state=active]:electric-glow"><LineChartIcon className="w-4 h-4 mr-2" />Trends</TabsTrigger>
                    <TabsTrigger value="transactions" className="glass-button data-[state=active]:electric-glow">Transactions</TabsTrigger>
                </TabsList>

                {/* Overview and Categories Tabs remain the same... */}
                <TabsContent value="overview">
                     <Card className="glass-card">
                         <CardHeader>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                 <CardTitle className="electric-accent">Financial Overview</CardTitle>
                                 <TrendControls {...{ trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange }} />
                             </div>
                         </CardHeader>
                         <CardContent>
                             <div className="chart-container">
                                 {chartData.trendData.length > 0 ? (
                                     <ResponsiveContainer width="100%" height={300}>
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
                                     <div className="h-[300px] flex items-center justify-center text-gray-400">
                                         <p>No data available for the selected period.</p>
                                     </div>
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

                {/* ✨ MODIFIED: People Tab with Select Mode ✨ */}
                <TabsContent value="people">
                    <Card className="glass-card">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="electric-accent">People Summary</CardTitle>
                            <Button className="glass-button" onClick={toggleSelectMode}>
                                {selectMode ? 'Cancel' : 'Create Group'}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {peopleStats.length === 0 ? (
                                <div className="text-center py-8"><p className="text-gray-400">No transactions with people found.</p></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {peopleStats.map((person) => {
                                        const isSelected = selectedPeople.includes(person.name);
                                        return (
                                            <Card 
                                                key={person.name} 
                                                className={cn(
                                                    "glass-effect p-4 flex flex-col justify-between transition-all duration-200",
                                                    selectMode && "cursor-pointer hover:border-sky-500/50",
                                                    isSelected && "border-sky-500 ring-2 ring-sky-500"
                                                )}
                                                onClick={() => selectMode && handlePersonSelect(person.name)}
                                            >
                                                {selectMode && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 bg-gray-800/80 rounded-full flex items-center justify-center border border-gray-600">
                                                        {isSelected && <Check className="w-3 h-3 text-sky-400" />}
                                                    </div>
                                                )}
                                                <div className="mb-4">
                                                    <CardTitle className="text-xl electric-accent flex items-center gap-2"><User className="w-5 h-5" /> {person.name}</CardTitle>
                                                    <p className="text-xs text-gray-400">{person.transaction_count} transaction(s)</p>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center"><span className="text-gray-400">You Received:</span><span className="font-semibold income-accent">+${person.total_received.toFixed(2)}</span></div>
                                                    <div className="flex justify-between items-center"><span className="text-gray-400">You Gave:</span><span className="font-semibold expense-accent">-${person.total_given.toFixed(2)}</span></div>
                                                </div>
                                                <div className="border-t border-white/10 mt-4 pt-4">
                                                    <div className="flex justify-between items-center font-bold"><span className="text-gray-300">Net Balance:</span><span className={person.net_balance >= 0 ? 'income-accent' : 'expense-accent'}>{person.net_balance >= 0 ? `+${person.net_balance.toFixed(2)}` : `${person.net_balance.toFixed(2)}`}</span></div>
                                                    <p className="text-xs text-center text-gray-500 mt-1">{person.net_balance > 0 ? `${person.name} owes you.` : person.net_balance < 0 ? `You owe ${person.name}.` : 'Settled up.'}</p>
                                                </div>
                                                {!selectMode && (
                                                    <div className="mt-4">
                                                        <Button className="w-full glass-button neon-glow" disabled={Math.abs(person.net_balance) < 0.01} onClick={() => onSettleUpClick(person)}>Settle Up</Button>
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ✨ ADDED: Groups Tab ✨ */}
                <TabsContent value="groups">
                     <Card className="glass-card">
                         <CardHeader>
                             <CardTitle className="electric-accent">Groups Summary</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                             {groupStats.length === 0 ? (
                                 <div className="text-center py-8"><p className="text-gray-400">You haven't created any groups yet.</p></div>
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {groupStats.map((group) => (
                                         <Card key={group.id} className="glass-effect p-4 flex flex-col justify-between">
                                             <div className="mb-4">
                                                 <CardTitle className="text-xl electric-accent flex items-center gap-2"><Users2 className="w-5 h-5" /> {group.name}</CardTitle>
                                                 <p className="text-xs text-gray-400">{group.members.length} member(s)</p>
                                             </div>
                                             {/* In a future step, we would add a Group Detail page here */}
                                             <div className="border-t border-white/10 mt-4 pt-4">
                                                 <div className="flex justify-between items-center font-bold">
                                                     <span className="text-gray-300">Your Net Balance:</span>
                                                     <span className={group.net_balance >= 0 ? 'income-accent' : 'expense-accent'}>{group.net_balance >= 0 ? `+${group.net_balance.toFixed(2)}` : `${group.net_balance.toFixed(2)}`}</span>
                                                 </div>
                                                 <p className="text-xs text-center text-gray-500 mt-1">{group.net_balance > 0 ? `The group owes you.` : group.net_balance < 0 ? `You owe the group.` : 'You are settled up.'}</p>
                                             </div>
                                         </Card>
                                     ))}
                                 </div>
                             )}
                         </CardContent>
                     </Card>
                 </TabsContent>


                {/* Trends and Transactions Tabs remain the same... */}
                <TabsContent value="trends">
                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <CardTitle className="electric-accent">Net Income Trends</CardTitle>
                                <TrendControls {...{ trendPeriod, setTrendPeriod, trendDateRange, setTrendDateRange }} />
                            </div>
                        </CardHeader>
                        <CardContent>
                           <div className="chart-container">
                                {chartData.trendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
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
                                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                                        <p>No data available for the selected period.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions">
                    <TransactionList {...{ transactions, loading, handleEditClick, handleDeleteClick, filters, handleFilterChange, uniqueCategories, isFilterActive, filteredTotals, groups }} />
                </TabsContent>
            </Tabs>

            {/* ✨ ADDED: Action Bar for Group Creation ✨ */}
            {selectMode && selectedPeople.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-auto">
                    <div className="glass-effect p-2 flex items-center gap-4">
                        <p className="text-sm text-gray-300">{selectedPeople.length} people selected</p>
                        <Button 
                            className="glass-button neon-glow"
                            onClick={() => setIsCreateGroupOpen(true)}
                        >
                            Create Group
                        </Button>
                    </div>
                </div>
            )}

            {/* ✨ ADDED: Create Group Dialog ✨ */}
            <CreateGroupDialog
                isOpen={isCreateGroupOpen}
                onOpenChange={setIsCreateGroupOpen}
                selectedPeople={selectedPeople}
                onCreateGroup={(groupData) => {
                    handleCreateGroup(groupData);
                    toggleSelectMode();
                }}
            />
        </>
    );
};

export default DashboardTabs;