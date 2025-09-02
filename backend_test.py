#!/usr/bin/env python3
"""
Budget Planner Backend API Test Suite
Tests all backend endpoints with realistic budget data
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Backend URL from environment
# BACKEND_URL = "https://budgetflow-18.preview.emergentagent.com/api"
# BACKEND_URL = "https://budgetplannerbackend.onrender.com"
BACKEND_URL = "https://budgetplannerbackend.onrender.com/api"

class BudgetPlannerTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.created_transactions = []
        self.test_results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.test_results["passed"] += 1
        else:
            self.test_results["failed"] += 1
            self.test_results["errors"].append(f"{test_name}: {message}")
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n=== Testing Health Check ===")
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, f"Status: {data.get('status')}, DB: {data.get('database')}")
                else:
                    self.log_result("Health Check", False, f"Unhealthy status: {data}")
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
    
    def test_create_transactions(self):
        """Test creating transactions with realistic budget data"""
        print("\n=== Testing Transaction Creation ===")
        
        # Realistic budget transactions for different months
        test_transactions = [
            # December 2024 transactions
            {
                "type": "income",
                "category": "Salary",
                "amount": 5500.00,
                "description": "Monthly salary",
                "date": "2024-12-01"
            },
            {
                "type": "income", 
                "category": "Freelance",
                "amount": 800.00,
                "description": "Web development project",
                "date": "2024-12-15"
            },
            {
                "type": "expense",
                "category": "Rent",
                "amount": 1200.00,
                "description": "Monthly rent payment",
                "date": "2024-12-01"
            },
            {
                "type": "expense",
                "category": "Food",
                "amount": 450.00,
                "description": "Groceries and dining",
                "date": "2024-12-05"
            },
            {
                "type": "expense",
                "category": "Transportation",
                "amount": 120.00,
                "description": "Gas and public transport",
                "date": "2024-12-10"
            },
            # January 2025 transactions
            {
                "type": "income",
                "category": "Salary",
                "amount": 5500.00,
                "description": "Monthly salary",
                "date": "2025-01-01"
            },
            {
                "type": "expense",
                "category": "Rent",
                "amount": 1200.00,
                "description": "Monthly rent payment",
                "date": "2025-01-01"
            },
            {
                "type": "expense",
                "category": "Utilities",
                "amount": 180.00,
                "description": "Electricity and internet",
                "date": "2025-01-05"
            },
            {
                "type": "expense",
                "category": "Food",
                "amount": 380.00,
                "description": "Groceries",
                "date": "2025-01-08"
            }
        ]
        
        for i, transaction_data in enumerate(test_transactions):
            try:
                response = requests.post(
                    f"{self.base_url}/transactions/",
                    json=transaction_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    created_transaction = response.json()
                    self.created_transactions.append(created_transaction["id"])
                    self.log_result(
                        f"Create Transaction {i+1}",
                        True,
                        f"{transaction_data['type']} - {transaction_data['category']}: ${transaction_data['amount']}"
                    )
                else:
                    self.log_result(
                        f"Create Transaction {i+1}",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_result(f"Create Transaction {i+1}", False, f"Exception: {str(e)}")
    
    def test_get_all_transactions(self):
        """Test fetching all transactions"""
        print("\n=== Testing Get All Transactions ===")
        try:
            response = requests.get(f"{self.base_url}/transactions/", timeout=10)
            
            if response.status_code == 200:
                transactions = response.json()
                self.log_result(
                    "Get All Transactions",
                    True,
                    f"Retrieved {len(transactions)} transactions"
                )
                
                # Test with month filter
                response_filtered = requests.get(
                    f"{self.base_url}/transactions/?month=2024-12",
                    timeout=10
                )
                if response_filtered.status_code == 200:
                    filtered_transactions = response_filtered.json()
                    self.log_result(
                        "Get Transactions with Month Filter",
                        True,
                        f"Retrieved {len(filtered_transactions)} transactions for 2024-12"
                    )
                else:
                    self.log_result(
                        "Get Transactions with Month Filter",
                        False,
                        f"HTTP {response_filtered.status_code}"
                    )
            else:
                self.log_result("Get All Transactions", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Get All Transactions", False, f"Exception: {str(e)}")
    
    def test_get_specific_transaction(self):
        """Test fetching specific transaction by ID"""
        print("\n=== Testing Get Specific Transaction ===")
        
        if not self.created_transactions:
            self.log_result("Get Specific Transaction", False, "No transactions created to test with")
            return
        
        # Test with valid ID
        transaction_id = self.created_transactions[0]
        try:
            response = requests.get(f"{self.base_url}/transactions/{transaction_id}", timeout=10)
            
            if response.status_code == 200:
                transaction = response.json()
                self.log_result(
                    "Get Specific Transaction (Valid ID)",
                    True,
                    f"Retrieved transaction: {transaction.get('category')} - ${transaction.get('amount')}"
                )
            else:
                self.log_result(
                    "Get Specific Transaction (Valid ID)",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Get Specific Transaction (Valid ID)", False, f"Exception: {str(e)}")
        
        # Test with invalid ID
        try:
            response = requests.get(f"{self.base_url}/transactions/invalid-id-123", timeout=10)
            
            if response.status_code == 404:
                self.log_result("Get Specific Transaction (Invalid ID)", True, "Correctly returned 404 for invalid ID")
            else:
                self.log_result(
                    "Get Specific Transaction (Invalid ID)",
                    False,
                    f"Expected 404, got HTTP {response.status_code}"
                )
                
        except Exception as e:
            self.log_result("Get Specific Transaction (Invalid ID)", False, f"Exception: {str(e)}")
    
    def test_delete_transaction(self):
        """Test deleting transactions"""
        print("\n=== Testing Delete Transaction ===")
        
        if len(self.created_transactions) < 2:
            self.log_result("Delete Transaction", False, "Not enough transactions created to test deletion")
            return
        
        # Test deleting a valid transaction
        transaction_id = self.created_transactions.pop()  # Remove from our list
        try:
            response = requests.delete(f"{self.base_url}/transactions/{transaction_id}", timeout=10)
            
            if response.status_code == 200:
                self.log_result("Delete Transaction (Valid ID)", True, "Transaction deleted successfully")
            else:
                self.log_result(
                    "Delete Transaction (Valid ID)",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Delete Transaction (Valid ID)", False, f"Exception: {str(e)}")
        
        # Test deleting with invalid ID
        try:
            response = requests.delete(f"{self.base_url}/transactions/invalid-id-456", timeout=10)
            
            if response.status_code == 404:
                self.log_result("Delete Transaction (Invalid ID)", True, "Correctly returned 404 for invalid ID")
            else:
                self.log_result(
                    "Delete Transaction (Invalid ID)",
                    False,
                    f"Expected 404, got HTTP {response.status_code}"
                )
                
        except Exception as e:
            self.log_result("Delete Transaction (Invalid ID)", False, f"Exception: {str(e)}")
    
    def test_monthly_stats(self):
        """Test monthly statistics endpoint"""
        print("\n=== Testing Monthly Statistics ===")
        try:
            response = requests.get(f"{self.base_url}/stats/monthly", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                self.log_result(
                    "Monthly Statistics",
                    True,
                    f"Retrieved stats for {len(stats)} months"
                )
                
                # Print some sample data
                for stat in stats[:3]:  # Show first 3 months
                    print(f"   {stat['month']}: Income ${stat['income']}, Expense ${stat['expense']}, Net ${stat['net']}")
                    
            else:
                self.log_result("Monthly Statistics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Monthly Statistics", False, f"Exception: {str(e)}")
    
    def test_category_stats(self):
        """Test category statistics endpoints"""
        print("\n=== Testing Category Statistics ===")
        
        # Test income categories
        try:
            response = requests.get(f"{self.base_url}/stats/categories?type=income", timeout=10)
            
            if response.status_code == 200:
                income_stats = response.json()
                self.log_result(
                    "Category Statistics (Income)",
                    True,
                    f"Retrieved {len(income_stats)} income categories"
                )
                
                for stat in income_stats[:3]:  # Show top 3
                    print(f"   {stat['name']}: ${stat['value']} ({stat['count']} transactions)")
                    
            else:
                self.log_result("Category Statistics (Income)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Category Statistics (Income)", False, f"Exception: {str(e)}")
        
        # Test expense categories
        try:
            response = requests.get(f"{self.base_url}/stats/categories?type=expense", timeout=10)
            
            if response.status_code == 200:
                expense_stats = response.json()
                self.log_result(
                    "Category Statistics (Expense)",
                    True,
                    f"Retrieved {len(expense_stats)} expense categories"
                )
                
                for stat in expense_stats[:3]:  # Show top 3
                    print(f"   {stat['name']}: ${stat['value']} ({stat['count']} transactions)")
                    
            else:
                self.log_result("Category Statistics (Expense)", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Category Statistics (Expense)", False, f"Exception: {str(e)}")
    
    def test_trend_stats(self):
        """Test trend statistics endpoint"""
        print("\n=== Testing Trend Statistics ===")
        try:
            response = requests.get(f"{self.base_url}/stats/trends", timeout=10)
            
            if response.status_code == 200:
                trends = response.json()
                self.log_result(
                    "Trend Statistics",
                    True,
                    f"Retrieved trend data for {len(trends)} months"
                )
                
                # Print some sample data
                for trend in trends[:3]:  # Show first 3 months
                    print(f"   {trend['month']}: Net ${trend['total']}")
                    
            else:
                self.log_result("Trend Statistics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Trend Statistics", False, f"Exception: {str(e)}")
    
    def test_current_month_stats(self):
        """Test current month statistics endpoint"""
        print("\n=== Testing Current Month Statistics ===")
        try:
            response = requests.get(f"{self.base_url}/stats/current-month", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                self.log_result(
                    "Current Month Statistics",
                    True,
                    f"Income: ${stats.get('total_income', 0)}, Expenses: ${stats.get('total_expenses', 0)}, Balance: ${stats.get('balance', 0)}"
                )
            else:
                self.log_result("Current Month Statistics", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Current Month Statistics", False, f"Exception: {str(e)}")
    
    def test_data_validation(self):
        """Test data validation for transaction creation"""
        print("\n=== Testing Data Validation ===")
        
        # Test invalid data scenarios
        invalid_transactions = [
            {
                "name": "Negative Amount",
                "data": {
                    "type": "expense",
                    "category": "Food",
                    "amount": -100.00,
                    "description": "Invalid negative amount",
                    "date": "2025-01-15"
                }
            },
            {
                "name": "Zero Amount",
                "data": {
                    "type": "income",
                    "category": "Salary",
                    "amount": 0.00,
                    "description": "Invalid zero amount",
                    "date": "2025-01-15"
                }
            },
            {
                "name": "Empty Category",
                "data": {
                    "type": "expense",
                    "category": "",
                    "amount": 50.00,
                    "description": "Empty category",
                    "date": "2025-01-15"
                }
            },
            {
                "name": "Invalid Date Format",
                "data": {
                    "type": "expense",
                    "category": "Food",
                    "amount": 25.00,
                    "description": "Invalid date format",
                    "date": "01/15/2025"
                }
            },
            {
                "name": "Missing Required Field",
                "data": {
                    "category": "Food",
                    "amount": 25.00,
                    "description": "Missing type field",
                    "date": "2025-01-15"
                }
            }
        ]
        
        for test_case in invalid_transactions:
            try:
                response = requests.post(
                    f"{self.base_url}/transactions/",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code in [400, 422]:  # FastAPI uses 422 for validation errors
                    self.log_result(
                        f"Validation Test - {test_case['name']}",
                        True,
                        "Correctly rejected invalid data"
                    )
                else:
                    self.log_result(
                        f"Validation Test - {test_case['name']}",
                        False,
                        f"Expected 400/422, got HTTP {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_result(f"Validation Test - {test_case['name']}", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Budget Planner Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_health_check()
        self.test_create_transactions()
        self.test_get_all_transactions()
        self.test_get_specific_transaction()
        self.test_delete_transaction()
        self.test_monthly_stats()
        self.test_category_stats()
        self.test_trend_stats()
        self.test_current_month_stats()
        self.test_data_validation()
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        
        if self.test_results["errors"]:
            print("\n🚨 FAILED TESTS:")
            for error in self.test_results["errors"]:
                print(f"   • {error}")
        
        success_rate = (self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed'])) * 100
        print(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = BudgetPlannerTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)