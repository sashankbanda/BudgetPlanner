// Mock data for budget planner app

export const mockTransactions = [
  // Income transactions
  {
    id: '1',
    type: 'income',
    category: 'Salary',
    amount: 5000,
    description: 'Monthly salary',
    date: '2024-12-01',
    month: '2024-12'
  },
  {
    id: '2', 
    type: 'income',
    category: 'Freelance',
    amount: 1200,
    description: 'Web development project',
    date: '2024-12-05',
    month: '2024-12'
  },
  {
    id: '3',
    type: 'income',
    category: 'From Parents',
    amount: 300,
    description: 'Mom - Monthly support',
    date: '2024-12-10',
    month: '2024-12'
  },
  {
    id: '4',
    type: 'income',
    category: 'Investments',
    amount: 500,
    description: 'Dividend payout',
    date: '2024-11-15',
    month: '2024-11'
  },
  
  // Expense transactions
  {
    id: '5',
    type: 'expense', 
    category: 'Food',
    amount: 800,
    description: 'Groceries and restaurants',
    date: '2024-12-02',
    month: '2024-12'
  },
  {
    id: '6',
    type: 'expense',
    category: 'Rent',
    amount: 1500,
    description: 'Monthly rent',
    date: '2024-12-01',
    month: '2024-12'
  },
  {
    id: '7',
    type: 'expense',
    category: 'Transportation',
    amount: 200,
    description: 'Gas and public transport',
    date: '2024-12-03',
    month: '2024-12'
  },
  {
    id: '8',
    type: 'expense',
    category: 'Entertainment',
    amount: 150,
    description: 'Movies and games',
    date: '2024-12-07',
    month: '2024-12'
  },
  {
    id: '9',
    type: 'expense',
    category: 'Shopping',
    amount: 400,
    description: 'Clothes and electronics',
    date: '2024-12-08',
    month: '2024-12'
  },
  {
    id: '10',
    type: 'expense',
    category: 'To Friends',
    amount: 50,
    description: 'John - Lunch split',
    date: '2024-12-12',
    month: '2024-12'
  },
  {
    id: '11',
    type: 'income',
    category: 'Salary',
    amount: 5000,
    description: 'Monthly salary',
    date: '2024-11-01',
    month: '2024-11'
  },
  {
    id: '12',
    type: 'expense',
    category: 'Rent',
    amount: 1500,
    description: 'Monthly rent',
    date: '2024-11-01',
    month: '2024-11'
  },
  {
    id: '13',
    type: 'expense',
    category: 'Food',
    amount: 750,
    description: 'November groceries',
    date: '2024-11-15',
    month: '2024-11'
  }
];

export const incomeCategories = [
  'Salary',
  'Freelance', 
  'Investments',
  'From Friends',
  'From Parents',
  'Custom'
];

export const expenseCategories = [
  'Food',
  'Transportation', 
  'Rent',
  'Utilities',
  'Shopping',
  'Entertainment', 
  'Miscellaneous',
  'To Friends',
  'Custom'
];

// Helper functions
export const getMonthlyData = (transactions) => {
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const month = transaction.month;
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0, month: month };
    }
    
    if (transaction.type === 'income') {
      monthlyData[month].income += transaction.amount;
    } else {
      monthlyData[month].expense += transaction.amount;
    }
  });
  
  return Object.values(monthlyData);
};

export const getCategoryData = (transactions, type) => {
  const categoryTotals = {};
  
  transactions
    .filter(t => t.type === type)
    .forEach(transaction => {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = 0;
      }
      categoryTotals[transaction.category] += transaction.amount;
    });
    
  return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
};

export const getTrendData = (transactions) => {
  const trendData = {};
  
  transactions.forEach(transaction => {
    const month = transaction.month;
    if (!trendData[month]) {
      trendData[month] = { month, total: 0 };
    }
    
    if (transaction.type === 'income') {
      trendData[month].total += transaction.amount;
    } else {
      trendData[month].total -= transaction.amount;
    }
  });
  
  return Object.values(trendData).sort((a, b) => a.month.localeCompare(b.month));
};