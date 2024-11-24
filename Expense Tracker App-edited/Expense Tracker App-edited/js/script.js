$(document).ready(function () {

    // Logout button click handler
    $("#logout-btn").click(function () {
    // Clear user data from localStorage (or sessionStorage)
    localStorage.removeItem("loggedInUser");

    // Redirect to the login page
    window.location.href = "index.html";

    // Optionally, show a message (if the login page can display it)
    alert("You have logged out successfully!");
});

  const expensesKey = "expenses";

  // Load expenses from localStorage
  const loadExpenses = () => JSON.parse(localStorage.getItem(expensesKey)) || [];

  // Save expenses to localStorage
  const saveExpenses = (expenses) => localStorage.setItem(expensesKey, JSON.stringify(expenses));

  // Format amount to Ringgit Malaysia (RM)
  const formatCurrency = (amount) => `RM ${amount.toFixed(2)}`;

  // Display expenses in table
  const displayExpenses = () => {
      const expenses = loadExpenses();
      const expensesTable = $("#expensesTable");
      expensesTable.empty();
      expenses.forEach((expense, index) => {
          const row = `
              <tr>
                  <td>${moment(expense.date).format("DD/MM/YYYY")}</td>
                  <td>${formatCurrency(expense.amount)}</td>
                  <td>${expense.description}</td>
                  <td>${expense.category}</td>
                  <td>
                      <button class="btn btn-warning btn-sm edit-btn" data-index="${index}">Edit</button>
                      <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">Delete</button>
                  </td>
              </tr>
          `;
          expensesTable.append(row);
      });
  };

  // Add expense
  $("#expenseForm").submit(function (e) {
  e.preventDefault(); // Prevent the form from submitting traditionally

  // Retrieve values from the form
  const amount = parseFloat($("#amount").val());
  const date = $("#date").val();
  const description = $("#description").val();
  const category = $("#category").val();

  // Create a new expense object
  const newExpense = { amount, date, description, category };

  // Load existing expenses, add the new one, and save
  const expenses = loadExpenses();
  expenses.push(newExpense);
  saveExpenses(expenses);

  // Update UI
  displayExpenses();
  alert("Expense added successfully!")
  this.reset();
  calculateSummary(); 
  displayRecentTransactions(); 
  displayQuickStats(); 
  calculateCategoryExpenses();  
});

  // Delete expense
  $(document).on("click", ".delete-btn", function () {
      const index = $(this).data("index");
      const expenses = loadExpenses();
      expenses.splice(index, 1);
      saveExpenses(expenses);
      displayExpenses();
      calculateSummary(); 
      displayRecentTransactions(); 
      displayQuickStats(); 
      calculateCategoryExpenses(); 
  });

  // Edit expense
  $(document).on("click", ".edit-btn", function () {
      const index = $(this).data("index");
      const expenses = loadExpenses();
      const expense = expenses[index];

      // Pre-fill the form with the existing values
      $("#date").val(expense.date);
      $("#amount").val(expense.amount);
      $("#description").val(expense.description);
      $("#category").val(expense.category);

      // Remove the existing item
      expenses.splice(index, 1);
      saveExpenses(expenses);

      // Switch to the Add Expense page
      $(".nav-btn").removeClass("active");
      $("[data-page='add']").addClass("active");
      $(".page").removeClass("active");
      $("#add").addClass("active");

      calculateSummary(); 
      displayRecentTransactions(); 
      displayQuickStats(); 
      calculateCategoryExpenses(); 
  });

  // Summary calculation
    const calculateSummary = () => {
    const expenses = loadExpenses();
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0).toFixed(2);
  
    // Update total expenses text
    $("#total-expenses").text(`RM ${totalExpenses}`);
  
    // Calculate category spending
    const categoryCount = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
  
    // Get the highest category
    const highestCategory = Object.entries(categoryCount).reduce((a, b) => (a[1] > b[1] ? a : b), [null, 0])[0];
    $("#highest-category").text(highestCategory || "None");
  
    // Render Pie Chart
    renderPieChart(categoryCount);
   };

   let pieChartInstance; // Add this globally to track the chart instance

    const renderPieChart = (categoryCount) => {
    const allCategories = ["Food", "Bill", "Grocery", "Transport"];
    const dataValues = allCategories.map(category => categoryCount[category] || 0);

    const colors = {
        "Food": "#4caf50",
        "Bill": "#1976d2",
        "Grocery": "#CD5C5C",
        "Transport": "#ff9800"
    };
    const backgroundColors = allCategories.map(category => colors[category]);

    const ctx = $("#expensePieChart");

    // Destroy existing chart if it exists
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    const data = {
        labels: allCategories,
        datasets: [{
            data: dataValues,
            backgroundColor: backgroundColors,
        }],
    };

    pieChartInstance = new Chart(ctx, {
        type: "pie",
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return `${tooltipItem.label}: RM ${tooltipItem.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
};
  
// Display recent transactions
    const displayRecentTransactions = () => {
    const expenses = loadExpenses();
    const recentTransactions = expenses.slice().reverse().slice(0, 5); // Get the last 5 transactions
    const transactionsList = $("#recent-transactions");
    transactionsList.empty();

    recentTransactions.forEach((expense) => {
      const date = moment(expense.date).format("DD MMM YYYY");
      transactionsList.append(`
        <li>${formatCurrency(expense.amount)} - ${expense.category} - ${date}</li>
      `);
    });
  };

  // Display quick stats (total spent this month, average daily expense)
  const displayQuickStats = () => {
    const expenses = loadExpenses();
    const totalSpent = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const totalDays = moment().diff(moment().startOf('month'), 'days') + 1;
    const avgDailyExpense = (totalSpent / totalDays).toFixed(2);

    $("#total-this-month").text(`Total spent : RM ${totalSpent.toFixed(2)}`);
    $("#avg-daily-expense").text(`Average daily expense: RM ${avgDailyExpense}`);
  };

  // Page navigation
  $(".nav-btn").click(function () {
    $(".nav-btn").removeClass("active");
    $(this).addClass("active");

    const page = $(this).data("page");
    $(".page").removeClass("active");
    $(`#${page}`).addClass("active");

    // Recalculate the summary if navigating to the Summary page
    if (page === "summary") {
        calculateSummary();
    }     
  });

  // Initial load
  displayExpenses();
  calculateSummary();
  displayRecentTransactions();
  displayQuickStats();
});

$(document).ready(function () {
    const expensesKey = "expenses";
  
    // Load expenses from localStorage
    const loadExpenses = () => JSON.parse(localStorage.getItem(expensesKey)) || [];
  
    // Format amount to Ringgit Malaysia (RM)
    const formatCurrency = (amount) => `RM ${amount.toFixed(2)}`;
  
    // Render table with expenses by category and display icons beside the category name
    const displayCategoryExpenses = (categoryCount) => {
      const categoryIcons = {
        "Food": "🍔",        // Icon for Food
        "Bill": "💡",        // Icon for Bill
        "Grocery": "🛒",     // Icon for Grocery
        "Transport": "🚗"    // Icon for Transport
      };
  
      const categoryTable = $("#categoryTable");
      categoryTable.empty();
  
      Object.entries(categoryCount).forEach(([category, amount]) => {
        // Display category with icon beside the name
        const categoryNameWithIcon = `${category} ${categoryIcons[category] || ''}`;
  
        const row = `
          <tr>
            <td>${categoryNameWithIcon}</td>
            <td>${formatCurrency(amount)}</td>
          </tr>
        `;
        categoryTable.append(row);
      });
    };
  
    // Render Pie or Bar Chart for expenses by category
    const renderExpenseChart = (categoryCount) => {
      const ctx = $("#expenseChart");
  
      const categories = Object.keys(categoryCount);
      const amounts = categories.map(category => categoryCount[category]);
  
      const colors = {
        "Food": "#4caf50",       // Green for food
        "Bill": "#1976d2",       // Blue for bill
        "Grocery": "#CD5C5C",    // Red for grocery
        "Transport": "#ff9800"   // Orange for transport
      };
  
      const backgroundColors = categories.map(category => colors[category]);
  
      const data = {
        labels: categories,
        datasets: [{
          data: amounts,
          backgroundColor: backgroundColors,
        }],
      };
  
      new Chart(ctx, {
        type: "pie", // Change to "bar" for a bar chart
        data: data,
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return `${tooltipItem.label}: RM ${tooltipItem.raw.toFixed(2)}`;
                }
              }
            }
          }
        }
      });
    };
  
    // Calculate total expenses by category
    const calculateCategoryExpenses = () => {
      const expenses = loadExpenses();
      const categoryCount = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});
  
      // Display the category expenses in the table
      displayCategoryExpenses(categoryCount);
  
      // Render the chart for the expenses
      renderExpenseChart(categoryCount);
    };
  
    // Initial load
    calculateCategoryExpenses();
  });
 
   // Show register form
   $("#show-register").click(function () {
    $("#login-section").hide();
    $("#register-section").show();
  });

  // Show login form
  $("#show-login").click(function () {
    $("#register-section").hide();
    $("#login-section").show();
  });

  // Handle registration
  $("#registerForm").submit(function (e) {
    e.preventDefault();
    const username = $("#register-username").val().trim();
    const password = $("#register-password").val();

    if (username && password) {
      // Save user to localStorage
      const users = JSON.parse(localStorage.getItem("users")) || {};
      if (users[username]) {
        alert("Username already exists. Please choose another.");
      } else {
        users[username] = password;
        localStorage.setItem("users", JSON.stringify(users));
        alert("Registration successful! You can now log in.");
        $("#register-username").val("");
        $("#register-password").val("");
        $("#register-section").hide();
        $("#login-section").show();
      }
    }
  });

  // Handle login
  $("#loginForm").submit(function (e) {
    e.preventDefault();
    const username = $("#login-username").val().trim();
    const password = $("#login-password").val();
    const users = JSON.parse(localStorage.getItem("users")) || {};

    if (users[username] === password) {
      alert("Login successful!");
      window.location.href = "expense.html"; // Redirect to the main app
    } else {
      alert("Invalid username or password. Please try again.");
    }
  });

  