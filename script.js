// script.js
import { calculateMonthlyPayments, calculateTotalInterest, calculatePrincipalInterestMonthly, createPricipalInterestOptions, createHouseValueOptions, createHouseValueEquity } from './functions.mjs';


// Now you can use these functions in this file
document.addEventListener('DOMContentLoaded', () => {

    function gatherInputValues() {
        const yearlyAppreciationRate = 0.041;
        const houseDetails = {
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            sellingPrice: parseFloat(document.getElementById('purchasePrice').value)*(1+yearlyAppreciationRate)**(parseFloat(document.getElementById('buyoutDuration').value)),
        };

        const loanDetails = {
            buyerDownPayment: parseFloat(document.getElementById('buyerDownPayment').value),
            interestRate: 3.35/100,
            loanDuration: parseFloat(document.getElementById('loanDuration').value),
        };

        const homelyDetails = {
            homelyDownPayment: Math.max(0, 0.2*houseDetails.purchasePrice - loanDetails.buyerDownPayment),
            leverage: 1.25,
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
        document.getElementById('sellingPriceValue').textContent = '€ ' + inputValues.sellingPrice.toFixed(0)
        document.getElementById('buyoutDurationValue').textContent = inputValues.buyoutDuration + ' years'
        document.getElementById('buyerDownPaymentValue').textContent = '€ ' + inputValues.buyerDownPayment
        document.getElementById('interestRateValue').textContent = (inputValues.interestRate * 100).toFixed(2) + `%`
        document.getElementById('loanDurationValue').textContent = inputValues.loanDuration + ' years'
        document.getElementById('homelyDownPaymentValue').textContent = '€ ' + inputValues.homelyDownPayment
    }

    let chartPrincipalInterest;  // Declare a global variable to hold the chart instance
    function updateGraphPricipalInterest(inputValues) {
        const principalInterestMonthly = calculatePrincipalInterestMonthly(inputValues);
        const principalLeft = principalInterestMonthly
            .filter((_, index) => index % 3 === 0)
            .map(month => month.principalLeft);
        const interestPaid = principalInterestMonthly
            .filter((_, index) => index % 3 === 0)
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
        const QuarterlyAppreciationRate = (inputValues.sellingPrice / inputValues.purchasePrice) ** (1 / inputValues.buyoutDuration / 4) - 1;
        for (let i = 0; i < inputValues.buyoutDuration * 4; i++) {
            houseValue.push(inputValues.purchasePrice * (1 + QuarterlyAppreciationRate) ** (i));
        }
        houseValue.push(inputValues.sellingPrice);


        const homelyStakeValue = houseValue.map(value => ((value / inputValues.purchasePrice* inputValues.homelyDownPayment)*inputValues.leverage));
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
                data: homelyStakeValue,
                color: '#339966'
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
        // constants
        const N_quarters = inputValues.loanDuration * 4;

        const houseValue = []
        const QuarterlyAppreciationRate = (inputValues.sellingPrice / inputValues.purchasePrice) ** (1 / inputValues.buyoutDuration / 4) - 1;
        for (let i = 0; i < N_quarters; i++) {
            houseValue.push(inputValues.purchasePrice * (1 + QuarterlyAppreciationRate) ** (i));
        }

        // updates the graph with house value
        const principalInterestMonthly = calculatePrincipalInterestMonthly(inputValues);
        const principalLeft = principalInterestMonthly
            .filter((_, index) => index % 3 == 0)
            .map(month => month.principalLeft).slice(0, N_quarters);


        const homelyStakeValue = houseValue.map((value, index) => {
            if (index > inputValues.buyoutDuration * 4) {
                return 0;
            }
            return (value / inputValues.purchasePrice* inputValues.homelyDownPayment)*inputValues.leverage;
        });


        const buyerStakeValue = houseValue.map((value, index) => {
            return value - homelyStakeValue[index]-principalLeft[index];
        }
        );



        let options = createHouseValueEquity(
            homelyStakeValue,
            buyerStakeValue,
            principalLeft)

        console.log(homelyStakeValue,
            buyerStakeValue,
            principalLeft)


        let chartContainer = document.getElementById('chartContainerEquity');

        // Check if chart already exists
        if (chartHouseEquity) {
            // Update the existing chart's series
            chartHouseEquity.updateSeries([
                {
                    name: 'Homely',
                    data: homelyStakeValue,
                    color: '#339966'
                },
                {
                    name: 'Buyer',
                    data: buyerStakeValue
                },
                {
                    name: 'Bank',
                    data: principalLeft
                }

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
    document.getElementById('loanDuration').addEventListener('input', updateAll);
    document.getElementById('homelyDownPayment').addEventListener('input', updateAll);

    // Initial calculation
    updateAll();

});




