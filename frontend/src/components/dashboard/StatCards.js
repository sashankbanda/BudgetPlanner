import React from 'react';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

const StatCards = ({ stats }) => {
    const { totalIncome, totalExpenses, balance, transactionCount } = stats;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card stat-card">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Income</p>
                            <p className="text-2xl font-bold income-accent">${totalIncome.toFixed(2)}</p>
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
                            <p className="text-2xl font-bold expense-accent">${totalExpenses.toFixed(2)}</p>
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
                            <p className={`text-2xl font-bold ${balance >= 0 ? 'income-accent' : 'expense-accent'}`}>${balance.toFixed(2)}</p>
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
                            <p className="text-2xl font-bold electric-accent">{transactionCount}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 electric-accent" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatCards;
