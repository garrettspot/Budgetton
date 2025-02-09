let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let exchangeRates = { INR: 1 };

const supportedCurrencies = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"];

async function fetchExchangeRates() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
        const data = await res.json();
        
        if (data.rates) {
            exchangeRates = { INR: 1 };
            supportedCurrencies.forEach(currency => {
                if (currency !== "INR") {
                    exchangeRates[currency] = data.rates[currency];
                }
            });
            console.log("Updated exchange rates:", exchangeRates);
        }
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        exchangeRates = { // Fallback exchange rates
            INR: 1,
            USD: 0.012,
            EUR: 0.011,
            GBP: 0.0095,
            JPY: 1.77,
            AUD: 0.018,
            CAD: 0.016
        };
    }
}

async function convertExpenses() {
    await fetchExchangeRates();
    const targetCurrency = document.getElementById("convert-to").value;

    expenses = expenses.map(expense => {
        const originalAmount = expense.amount;
        let newAmount;
        
        if (expense.currency === targetCurrency) {
            newAmount = originalAmount;
        } else {
            newAmount = (originalAmount / exchangeRates[expense.currency]) * exchangeRates[targetCurrency];
        }

        return {
            ...expense,
            amount: parseFloat(newAmount.toFixed(2)),
            currency: targetCurrency
        };
    });

    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
}

function addExpense() {
    const nameInput = document.getElementById("expense-name");
    const amountInput = document.getElementById("expense-amount");
    const category = document.getElementById("expense-category").value;
    const currency = document.getElementById("expense-currency").value;

    nameInput.classList.remove("error");
    amountInput.classList.remove("error");
    
    const amount = parseFloat(amountInput.value);
    let hasError = false;

    if (!nameInput.value.trim()) {
        nameInput.classList.add("error");
        hasError = true;
    }

    if (!amount || amount <= 0) {
        amountInput.classList.add("error");
        hasError = true;
    }

    if (hasError) return;

    const expense = { 
        name: nameInput.value, 
        amount, 
        category, 
        currency 
    };
    
    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));

    nameInput.value = "";
    amountInput.value = "";
    nameInput.classList.remove("error");
    amountInput.classList.remove("error");

    renderExpenses();
    updateChart();
}

function renderExpenses() {
    const expenseList = document.getElementById("expense-list");
    expenseList.innerHTML = "";

    expenses.forEach((expense, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <div class="expense-item">
                <span class="expense-name">${expense.name} (${expense.category})</span>
                <span class="expense-amount">${expense.amount.toFixed(2)} ${expense.currency}</span>
                <button class="delete-btn" onclick="deleteExpense(${index})">❌</button>
            </div>`;
        expenseList.appendChild(li);
    });
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    updateChart();
}

let chart;
function updateChart() {
    const categories = {};
    const baseCurrency = document.getElementById("convert-to").value || "INR";

    expenses.forEach(expense => {
        if (!categories[expense.category]) categories[expense.category] = 0;
        const convertedAmount = (expense.currency !== baseCurrency) 
            ? (expense.amount / exchangeRates[expense.currency]) * exchangeRates[baseCurrency]
            : expense.amount;
        categories[expense.category] += convertedAmount;
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories).map(val => parseFloat(val.toFixed(2)));

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("expense-chart"), {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50", "#9C27B0"]
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            return `${context.label}: ${value.toFixed(2)} ${baseCurrency}`;
                        }
                    }
                }
            }
        }
    });
}

async function handleCurrencyConversion() {
    await convertExpenses();
    updateChart();
}

function populateCurrencyDropdowns() {
    const currencySelects = document.querySelectorAll(".currency-select");
    currencySelects.forEach(select => {
        select.innerHTML = "";
        supportedCurrencies.forEach(currency => {
            const option = document.createElement("option");
            option.value = currency;
            option.textContent = currency;
            if (currency === "INR") option.selected = true;
            select.appendChild(option);
        });
    });
}

fetchExchangeRates();
populateCurrencyDropdowns();
renderExpenses();
updateChart();
