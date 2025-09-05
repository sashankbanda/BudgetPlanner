# Budget Planner Application

Budget Planner is a modern, full-stack web application designed to help you track your income and expenses with precision. It features a sleek, glassmorphic UI and provides detailed analytics through an interactive dashboard, allowing you to gain clear insights into your financial habits.

## ✨ Features

  * **Secure User Authentication**: Sign up and log in to manage your personal financial data.
  * **Multi-Account Management**: Create and manage multiple financial accounts (e.g., savings, credit card).
  * **Transaction Tracking**: Easily add, edit, and delete income and expense transactions.
  * **Interactive Dashboard**: Visualize your finances with an overview of income, expenses, and current balance.
  * **Detailed Analytics**:
      * Monthly summary of income vs. expense.
      * Breakdown of spending by category.
      * Granular trend analysis with daily, weekly, and monthly views.
  * **Responsive Design**: A seamless experience across desktop, tablet, and mobile devices.

-----

## 💻 Technology Stack

  * **Frontend**: React, `recharts` for charts, `tailwindcss` for styling, and `shadcn/ui` for components.
  * **Backend**: Python with FastAPI, providing a high-performance REST API.
  * **Database**: MongoDB for flexible and scalable data storage.
  * **Server**: Uvicorn (ASGI server for FastAPI).

-----

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

### Prerequisites

  * **Node.js** (v18 or later) and **npm** for the frontend.
  * **Python** (v3.9 or later) and **pip** for the backend.
  * **MongoDB**: A running instance of MongoDB, either locally or on a cloud service like MongoDB Atlas.

### \#\# 1. Backend Setup

First, let's get the FastAPI server running.

1.  **Navigate to the Project Root**
    Open your terminal and navigate to the root `sashankbanda-budgetplanner` directory.

2.  **Create and Activate a Virtual Environment**
    It's highly recommended to use a virtual environment.

    ```bash
    # Create the environment
    python -m venv venv

    # Activate it (macOS/Linux)
    source venv/bin/activate

    # Activate it (Windows)
    .\venv\Scripts\activate
    ```

3.  **Install Python Dependencies**
    Install all the required packages from the `requirements.txt` file.

    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Set Up Environment Variables**
    Create a file named `.env` inside the `backend/` directory and add the following variables.

    ```ini
    # backend/.env

    # Your MongoDB connection string
    MONGO_URL="mongodb://localhost:27017" 

    # The name for your database
    DB_NAME="budget_planner_dev" 

    # A long, random string for JWT security
    SECRET_KEY="your_super_secret_random_string_here" 
    ```

5.  **Run the Backend Server**
    From the **root project directory**, run the Uvicorn server.

    ```bash
    uvicorn backend.server:app --reload
    ```

    Your backend API should now be running at `http://localhost:8000`.

-----

### \#\# 2. Frontend Setup

With the backend running, let's start the React frontend.

1.  **Navigate to the Frontend Directory**
    Open a **new terminal window** and navigate into the `frontend` folder.

    ```bash
    cd frontend
    ```

2.  **Install Node.js Dependencies**
    Install all the necessary packages defined in `package.json`.

    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**
    Create a file named `.env` in the `frontend/` directory and add the URL of your running backend.

    ```ini
    # frontend/.env

    REACT_APP_BACKEND_URL=http://localhost:8000
    ```

    **Note**: React requires environment variables to be prefixed with `REACT_APP_`.

4.  **Run the Frontend Development Server**

    ```bash
    npm start
    ```

    Your React application should automatically open in your web browser at `http://localhost:3000`.

-----

## ✅ Usage

Once both servers are running, you can:

1.  Open `http://localhost:3000` in your browser.
2.  Create a new user account or log in with an existing one.
3.  Start adding accounts and transactions to see your dashboard come to life.

This looks like a Git workflow, but there are a few issues and it's incomplete for committing between branches. Here's a corrected and more complete version:

## Commit Between Branches Commands

```bash
# Check current branches
git branch
```

```bash
# Switch to feature branch and make changes
git checkout feat/transaction-features
# Make your changes here, then:
git add .
git commit -m "Your commit message"
git push origin feat/transaction-features
```

```bash
# Switch to another feature branch
git checkout feat/deploy-settings
# Make changes, then:
git add .
git commit -m "Your commit message" 
git push origin feat/deploy-settings
```

Here are the Git commands to get your updated data from those branches into the main branch:

## Option 1: Merge (Recommended for most cases)
```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote main (if working with remote)
git pull origin main

# Merge the first feature branch
git merge feat/deploy-settings

# Merge the second feature branch
git merge feat/transaction-features

# Push to remote (if working with remote repository)
git push origin main
```

## Additional useful commands:
```bash
# Check status before merging
git status

# View differences before merging
git diff feat/deploy-settings main
git diff feat/transaction-features main

# If you encounter merge conflicts, resolve them and then:
git add .
git commit -m "Resolve merge conflicts"
```

Choose the option that best fits your workflow and team conventions!