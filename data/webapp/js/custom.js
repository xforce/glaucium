function GetDateRangePrior(numberOfDays) {
    let dateArray = new Array();
    for(i = 0; numberOfDays > 0; ++i) {
        console.log(numberOfDays);
        dateArray.push(moment().subtract(numberOfDays, 'd').format('MMM Do'));
        --numberOfDays;
    }
    return dateArray;
}

let dates = GetDateRangePrior(7);
let ctx = document.getElementById("crash-stat-chart-7days");
let myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: dates,
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
        },
        {
            label: '# of Votes',
            data: [18, 19, 77, 5, 2, 3],
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,6,192,0.4)",
            borderColor: "rgba(75,192,6,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,6,6,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,6,6,1)",
            pointHoverBorderColor: "rgba(220,2,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
});