// script.js
import { calculateMonthlyPayments, calculateTotalInterest, calculatePrincipalInterestMonthly, createPricipalInterestOptions, createHouseValueOptions, createHouseValueEquity } from './functions.mjs';


// Now you can use these functions in this file
document.addEventListener('DOMContentLoaded', () => {

    function gatherInputValues() {
        const houseDetails = {
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            sellingPrice: parseFloat(document.getElementById('sellingPrice').value)
        };

        const loanDetails = {
            buyerDownPayment: parseFloat(document.getElementById('buyerDownPayment').value),
            interestRate: parseFloat(document.getElementById('interestRate').value) / 100, // Convert to decimal
            loanDuration: parseFloat(document.getElementById('loanDuration').value),
            notaryCosts: parseFloat(document.getElementById('notaryCosts').value)
        };

        const homelyDetails = {
            homelyDownPayment: parseFloat(document.getElementById('homelyDownPayment').value),
            leverage: parseFloat(document.getElementById('leverage').value),
            buyoutDuration: parseFloat(document.getElementById('buyoutDuration').value)
        };

        // Aggregate all input data into a unified data structure
        const inputData = { ...houseDetails, ...loanDetails, ...homelyDetails };

        return inputData;
    }

    // Function to update the input field value and label when a slider is changed

    // Function to calculate and update output values
    function updateInformationOutput(inputValues) {
        // House appreciation calculations
        const totalAppreciation = inputValues.sellingPrice / inputValues.purchasePrice - 1;
        const yearlyAppreciationRate = (1 + totalAppreciation) ** (1 / inputValues.buyoutDuration) - 1;
        document.getElementById('houseAppreciation').textContent = (totalAppreciation * 100).toFixed(2) + '%';
        document.getElementById('houseAppreciationRate').textContent = (yearlyAppreciationRate * 100).toFixed(2) + '% per year';

        // Loan calculations
        const loanAmount = inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment;
        const monthlyPayment = calculateMonthlyPayments(inputValues);
        const totalInterest = monthlyPayment * inputValues.loanDuration * 12 - loanAmount;
        const totalInterestUntilBuyout = calculateTotalInterest(inputValues);

        document.getElementById('loanAmount').textContent = '€ ' + loanAmount.toFixed(0);
        document.getElementById('monthlyPayment').textContent = '€ ' + monthlyPayment.toFixed(1);
        document.getElementById('totalInterest').textContent = '€ ' + totalInterest.toFixed(0);
        document.getElementById('totalInterestUntilBuyout').textContent = '€ ' + totalInterestUntilBuyout.toFixed(0); // Assuming this is the same as totalInterest for now

        document.getElementById('purchasePriceValue').textContent = '€ ' + inputValues.purchasePrice
        document.getElementById('sellingPriceValue').textContent = '€ ' + inputValues.sellingPrice
        document.getElementById('buyoutDurationValue').textContent = inputValues.buyoutDuration + ' years'
        document.getElementById('buyerDownPaymentValue').textContent = '€ ' + inputValues.buyerDownPayment
        document.getElementById('interestRateValue').textContent = (inputValues.interestRate * 100).toFixed(2) + `%`
        document.getElementById('loanDurationValue').textContent = inputValues.loanDuration + ' years'
        document.getElementById('notaryCostsValue').textContent = '€ ' + inputValues.notaryCosts
        document.getElementById('homelyDownPaymentValue').textContent = '€ ' + inputValues.homelyDownPayment
        document.getElementById('leverageValue').textContent = inputValues.leverage
    }

    let chartPrincipalInterest;  // Declare a global variable to hold the chart instance
    function updateGraphPricipalInterest(inputValues) {
        const principalInterestMonthly = calculatePrincipalInterestMonthly(inputValues);
        const principalLeft = principalInterestMonthly
            .filter((_, index) => index % 4 === 0)
            .map(month => month.principalLeft);
        const interestPaid = principalInterestMonthly
            .filter((_, index) => index % 4 === 0)
            .map(month => month.totalInterestPaid);

        let options = createPricipalInterestOptions(principalLeft, interestPaid);

        let chartContainer = document.getElementById('chartContainerPrincipal');

        // Check if chart already exists
        if (chartPrincipalInterest) {
            // Update the existing chart's series
            chartPrincipalInterest.updateSeries([{
                name: 'Principal Left',
                data: principalLeft
            }, {
                name: 'Interest Paid',
                data: interestPaid
            }]);
        } else {
            // Initialize the chart for the first time
            chartPrincipalInterest = new ApexCharts(chartContainer, options);
            chartPrincipalInterest.render();
        }
    }

    let chartHouseValue;  // Declare a global variable to hold the chart instance
    function updateGraphsHouseValue(inputValues) {
        // updates the graph with house value
        const houseValue = []
        const QuarterlyAppreciationRate = (inputValues.sellingPrice / inputValues.purchasePrice) ** (1 / inputValues.buyoutDuration / 3) - 1;
        for (let i = 0; i < inputValues.buyoutDuration * 3; i++) {
            houseValue.push(inputValues.purchasePrice * (1 + QuarterlyAppreciationRate) ** (i));
        }
        houseValue.push(inputValues.sellingPrice);
        const homelyStakeValue = houseValue.map(value => ((value / inputValues.purchasePrice - 1) * inputValues.leverage + 1) * inputValues.homelyDownPayment);
        const buyerStakeValue = houseValue.map(value => value - homelyStakeValue[houseValue.indexOf(value)]);

        // Apex Charts for house value and homely stake value
        let options = createHouseValueOptions(houseValue, buyerStakeValue, homelyStakeValue);
        let chartContainer = document.getElementById('chartContainerHouseValue');

        // Check if chart already exists
        if (chartHouseValue) {
            // Update the existing chart's series
            chartHouseValue.updateSeries([{
                name: 'House Value',
                data: houseValue
            },
            {
                name: 'Buyer Stake Value',
                data: buyerStakeValue
            },
            {
                name: 'Homely Stake Value',
                data: homelyStakeValue
            },
            ]);
        } else {
            // Initialize the chart for the first time
            chartHouseValue = new ApexCharts(chartContainer, options);
            chartHouseValue.render();
        }
    }

    let chartHouseEquity;  // Declare a global variable to hold the chart instance
    function updateGraphsHouseEquity(inputValues) {
        // updates the graph with house value
        const principalInterestMonthly = calculatePrincipalInterestMonthly(inputValues);
        const principalLeft = principalInterestMonthly
            .filter((_, index) => index % 4 === 0)
            .map(month => month.principalLeft);
        const interestPaid = principalInterestMonthly
            .filter((_, index) => index % 4 === 0)
            .map(month => month.totalInterestPaid);

        const totalInterest = interestPaid[interestPaid.length - 1];
        const interestLeft = interestPaid.map(value => totalInterest - value);

        const houseValue = [];
        const QuarterlyAppreciationRate = (inputValues.sellingPrice / inputValues.purchasePrice) ** (1 / inputValues.buyoutDuration / 3) - 1;
        for (let i = 0; i < inputValues.buyoutDuration * 3; i++) {
            houseValue.push(inputValues.purchasePrice * (1 + QuarterlyAppreciationRate) ** (i));
        }
        houseValue.push(inputValues.sellingPrice);

        // Append 0's to principalLeft and interestLeft if they are shorter than houseValue
        const N = houseValue.length;
        while (principalLeft.length < N) {
            principalLeft.push(0);
        }
        while (interestLeft.length < N) {
            interestLeft.push(0);
        }

        const homelyStakeValue = houseValue.map((value, index) => {
            if (index > inputValues.holdingPeriod * 3) {
                return 0;
            }
            return ((value / inputValues.purchasePrice - 1) * inputValues.leverage + 1) * inputValues.homelyDownPayment;
        });

        const buyerStakeValue = houseValue.map(value => value - homelyStakeValue[houseValue.indexOf(value)] - principalLeft[houseValue.indexOf(value)]);


        const homelyStakeValueSliced = homelyStakeValue.slice(0, N);
        const buyerStakeValueSliced = buyerStakeValue.slice(0, N);
        const principalLeftSliced = principalLeft.slice(0, N);
        const interestLeftSliced = interestLeft.slice(0, N);

        let options = createHouseValueEquity(
            homelyStakeValueSliced,
            buyerStakeValueSliced,
            principalLeftSliced,
            interestLeftSliced)

        console.log(options)

        let chartContainer = document.getElementById('chartContainerEquity');

        // Check if chart already exists
        if (chartHouseEquity) {
            // Update the existing chart's series
            chartHouseEquity.updateSeries([
                {
                    name: 'Homely',
                    data: homelyStakeValueSliced
                },
                {
                    name: 'Buyer',
                    data: buyerStakeValueSliced
                },
                {
                    name: 'Bank',
                    data: principalLeftSliced
                },
                {
                    name: 'Interest',
                    data: interestLeftSliced
                },
            ]);
        } else {
            // Initialize the chart for the first time
            chartHouseEquity = new ApexCharts(chartContainer, options);
            chartHouseEquity.render();
        }
    }






    function updateAll() {
        // Gather input values
        const inputValues = gatherInputValues();

        updateInformationOutput(inputValues);
        updateGraphPricipalInterest(inputValues);
        updateGraphsHouseValue(inputValues);
        updateGraphsHouseEquity(inputValues);
    }

    // Add event listeners to input fields
    document.getElementById('purchasePrice').addEventListener('input', updateAll);
    document.getElementById('sellingPrice').addEventListener('input', updateAll);
    document.getElementById('buyoutDuration').addEventListener('input', updateAll);
    document.getElementById('buyerDownPayment').addEventListener('input', updateAll);
    document.getElementById('interestRate').addEventListener('input', updateAll);
    document.getElementById('loanDuration').addEventListener('input', updateAll);
    document.getElementById('notaryCosts').addEventListener('input', updateAll);
    document.getElementById('homelyDownPayment').addEventListener('input', updateAll);
    document.getElementById('leverage').addEventListener('input', updateAll);

    // Initial calculation
    updateAll();

});




