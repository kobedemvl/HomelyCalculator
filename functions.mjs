// Calculate monthly payments
export function calculateMonthlyPayments(inputValues) {
    const principal = inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment;
    const monthlyInterestRate = inputValues.interestRate / 12;
    const totalPayments = inputValues.loanDuration * 12;

    // Monthly payment calculation using the formula for an amortizing loan
    const monthlyPayment = (principal * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));

    return monthlyPayment;
}

// Calculate total interest paid until buyout
export function calculateTotalInterest(inputValues) {
    //calculate total interest paid until buyout
    const monthlyPayment = calculateMonthlyPayments(inputValues);
    const totalPaymentsUntilBuyout = monthlyPayment * inputValues.buyoutDuration * 12;
    const totalInterestUntilBuyout = totalPaymentsUntilBuyout - (inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment) * (1 - Math.pow(1 + inputValues.interestRate / 12, -inputValues.buyoutDuration * 12));

    return totalInterestUntilBuyout;
}

export function calculatePrincipalInterestMonthly(inputValues) {
    // returns the principal left for every month and the interest paid for every month,
    // assuming the interest rate is the same for every month
    // returns a complete array of the principal and interest for every month

    const monthlyPayment = calculateMonthlyPayments(inputValues);
    const monthlyInterestRate = inputValues.interestRate / 12;
    const totalPayments = inputValues.loanDuration * 12;
    const principal = inputValues.purchasePrice - inputValues.buyerDownPayment - inputValues.homelyDownPayment;
    const principalInterestMonthly = [{ principalLeft: principal, totalInterestPaid: 0 }];
    let principalLeft = principal;
    let interestPaid = 0;
    let totalInterestPaid = 0;
    let principalPaid = 0;

    for (let i = 0; i < totalPayments; i++) {
        interestPaid = principalLeft * monthlyInterestRate;
        principalPaid = monthlyPayment - interestPaid;
        totalInterestPaid += interestPaid;
        principalLeft -= principalPaid;
        principalInterestMonthly.push({ principalLeft, totalInterestPaid });
    }

    return principalInterestMonthly;
}


export function createPricipalInterestOptions(principalLeft, interestPaid) {
    return {
        chart: {
            type: 'line',
            stacked: false,
            fill: {
                opacity: 0.5
            },
            dataLabels: false,
            height: 300,
        },
        animations: {
            enabled: false
        },
        series: [{
            name: 'Principal Left',
            data: principalLeft
        }, {
            name: 'Interest Paid',
            data: interestPaid
        }],
        xaxis: {
            tickAmount: 10,
            categories: [...Array(120).keys()].map(month => {
                const year = Math.floor(month * 4 / 12) + 1;
                const monthName = new Date(2000, month * 4 % 12, 1).toLocaleString('default', { month: 'short' });
                return `Y${year} ${monthName}`;
            })
        },
        yaxis: {
            labels: {
                formatter: function (val) {
                    return val.toFixed(0);
                }
            }
        },
    };
}

export function createHouseValueOptions(houseValue, buyerStakeValue, homelyStakeValue) {
    return {
        chart: {
            type: 'line',
            stacked: false,
            fill: {
                opacity: 0.5
            },
            dataLabels: false,
            height: 300,
        },
        animations: {
            enabled: false  // Disable animations
        },
        series: [{
            name: 'House Value',
            data: houseValue,
            dataLabels: {
                enabled: false
            }
        },
        {
            name: 'Buyer Stake Value',
            data: buyerStakeValue,
            dataLabels: {
                enabled: false
            }
        },
        {
            name: 'Homely Stake Value',
            data: homelyStakeValue,
            dataLabels: {
                enabled: false
            }
        },
        ],

        xaxis: {
            tickAmount: 10,
            categories: [...Array(40).keys()].map(month => {
                const year = Math.floor(month * 4 / 12) + 1;
                const monthName = new Date(2000, month * 4 % 12, 1).toLocaleString('default', { month: 'short' });
                return `Y${year} ${monthName}`;
            })
        },

        yaxis: {
            labels: {
                formatter: function (val) {
                    return val.toFixed(0);
                }
            }
        },
    }
}

export function createHouseValueEquity(homelyStakeValue, buyerStakeValue, principalLeft, interestLeft) {
    return {
        chart: {
            type: 'line',
            stacked: true,
            fill: {
                opacity: 0.5
            },
            dataLabels: {
                enabled: false,
            },
        
            height: 300,

        },
        series: [{
            name: 'Homely',
            data: homelyStakeValue,
            dataLabels: {
                enabled: false
            }
        },
        {
            name: 'Buyer',
            data: buyerStakeValue,
            dataLabels: {
                enabled: false
            }
        },
        {
            name: 'Bank',
            data: principalLeft,
            dataLabels: {
                enabled: false
            }
        },
        {
            name: 'Interest',
            data: interestLeft,
            dataLabels: {
                enabled: false
            }
        },
        ],

        xaxis: {
            tickAmount: 10,
            categories: [...Array(120).keys()].map(month => {
                const year = Math.floor(month * 4 / 12) + 1;
                const monthName = new Date(2000, month * 4 % 12, 1).toLocaleString('default', { month: 'short' });
                return `Y${year} ${monthName}`;
            })
        },

        yaxis: {
            labels: {
                formatter: function (val) {
                    return val.toFixed(0);
                }
            }
        },
    }
}
