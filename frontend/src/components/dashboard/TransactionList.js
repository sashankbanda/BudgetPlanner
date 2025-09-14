// frontend/src/components/dashboard/TransactionList.js

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Search, Pencil, Trash2, User, Users2, Loader2 } from 'lucide-react';

const TransactionList = ({
    transactions, loading, handleEditClick, handleDeleteClick,
    filters, handleFilterChange, uniqueCategories,
    isFilterActive, filteredTotals
}) => {
    return (
        <Card className="glass-card">
            <CardHeader><CardTitle className="electric-accent">Transactions History</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {/* Filter Section */}
                <div className="glass-effect p-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search description, category, person..." className="glass-input pl-10" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:flex-grow-0">
                        <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v === 'all' ? '' : v)}>
                            <SelectTrigger className="glass-input"><SelectValue placeholder="All Types" /></SelectTrigger>
                            <SelectContent className="glass-effect border-0 text-white">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v === 'all' ? '' : v)}>
                            <SelectTrigger className="glass-input"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent className="glass-effect border-0 text-white">
                                <SelectItem value="all">All Categories</SelectItem>
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

                {/* Filtered Results Summary */}
                {isFilterActive && (
                    <div className="glass-effect p-3 rounded-lg text-sm">
                        <p className="text-gray-400 mb-2 text-center">Filtered Results ({transactions.length} transaction{transactions.length !== 1 && 's'}):</p>
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
                                <span className={`font-bold ${filteredTotals.net >= 0 ? 'income-accent' : 'expense-accent'}`}>{filteredTotals.net >= 0 ? '+' : ''}${filteredTotals.net.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction Items List */}
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
                                        {t.split_with && t.split_with.length > 0 && (
                                            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                                                <Users2 className="w-3 h-3 mr-1" />
                                                {t.group_name || 'Split Expense'}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{t.description}</p>
                                    <p className="text-xs text-gray-500">{t.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-bold ${t.type === 'income' ? 'income-accent' : 'expense-accent'}`}>{t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleEditClick(t)}><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-500" onClick={() => handleDeleteClick(t.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )))}
                </div>
            </CardContent>
        </Card>
    );
};

export default TransactionList;