document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase (assuming it's already set up in the HTML)
    const db = firebase.firestore();
    
    // DOM Elements
    const dateRangeSelect = document.getElementById('dateRange');
    const reportTypeSelect = document.getElementById('reportType');
    const generateReportBtn = document.getElementById('generateReport');
    
    // Stats elements
    const totalSalesElement = document.getElementById('totalSales');
    const totalOrdersElement = document.getElementById('totalOrders');
    const newCustomersElement = document.getElementById('newCustomers');
    
    // Table bodies
    const topProductsBody = document.getElementById('topProductsBody');
    const topCategoriesBody = document.getElementById('topCategoriesBody');
    
    // Chart placeholder
    const salesChart = document.getElementById('salesChart');
    
    // Event listeners
    generateReportBtn.addEventListener('click', generateReport);
    dateRangeSelect.addEventListener('change', updateDateRange);
    reportTypeSelect.addEventListener('change', updateReportType);
    
    // Initialize with default report
    generateReport();
    
    // Function to generate report based on selected filters
    function generateReport() {
        const dateRange = dateRangeSelect.value;
        const reportType = reportTypeSelect.value;
        
        // Show loading state
        salesChart.innerHTML = '<p style="color:#6b7280;">Loading chart data...</p>';
        
        // Fetch data from Firestore based on filters
        fetchReportData(dateRange, reportType)
            .then(data => {
                // Update UI with the fetched data
                updateReportUI(data, reportType);
            })
            .catch(error => {
                console.error('Error generating report:', error);
                salesChart.innerHTML = '<p style="color:#ef4444;">Error loading chart data. Please try again.</p>';
            });
    }
    
    // Function to fetch report data from Firestore
    function fetchReportData(dateRange, reportType) {
        // In a real implementation, this would fetch actual data from Firestore
        // For this demo, we'll return mock data
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock data for demonstration
                const mockData = {
                    totalSales: '৳45,250',
                    totalOrders: 128,
                    newCustomers: 24,
                    salesTrend: [
                        { date: '2023-07-01', sales: 5200 },
                        { date: '2023-07-02', sales: 4800 },
                        { date: '2023-07-03', sales: 6100 },
                        { date: '2023-07-04', sales: 5500 },
                        { date: '2023-07-05', sales: 7200 },
                        { date: '2023-07-06', sales: 8100 },
                        { date: '2023-07-07', sales: 8350 }
                    ],
                    topProducts: [
                        { name: 'Premium T-Shirt', units: 42, revenue: '৳12,600' },
                        { name: 'Designer Jeans', units: 38, revenue: '৳9,500' },
                        { name: 'Casual Shoes', units: 35, revenue: '৳8,750' }
                    ],
                    topCategories: [
                        { name: 'Clothing', orders: 65, revenue: '৳19,500' },
                        { name: 'Footwear', orders: 42, revenue: '৳12,600' },
                        { name: 'Accessories', orders: 21, revenue: '৳6,300' }
                    ]
                };
                
                resolve(mockData);
            }, 800); // Simulate network delay
        });
    }
    
    // Function to update the report UI with data
    function updateReportUI(data, reportType) {
        // Update stats
        totalSalesElement.textContent = data.totalSales;
        totalOrdersElement.textContent = data.totalOrders;
        newCustomersElement.textContent = data.newCustomers;
        
        // Update chart
        renderSalesChart(data.salesTrend);
        
        // Update top products table
        renderTopProducts(data.topProducts);
        
        // Update top categories table
        renderTopCategories(data.topCategories);
    }
    
    // Function to render sales chart
    function renderSalesChart(salesData) {
        // In a real implementation, this would use a charting library like Chart.js
        // For this demo, we'll create a simple visual representation
        
        const maxSales = Math.max(...salesData.map(item => item.sales));
        const chartHtml = `
            <div style="display:flex;height:250px;align-items:flex-end;justify-content:space-between;padding:10px 0;">
                ${salesData.map(item => {
                    const height = (item.sales / maxSales) * 100;
                    const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return `
                        <div style="display:flex;flex-direction:column;align-items:center;width:${100 / salesData.length}%;">
                            <div style="height:${height}%;width:30px;background:linear-gradient(to top, #393e6e, #4c51bf);border-radius:4px 4px 0 0;"></div>
                            <div style="margin-top:8px;font-size:12px;color:#4b5563;">${date}</div>
                            <div style="font-size:12px;font-weight:500;color:#393e6e;">৳${item.sales}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        salesChart.innerHTML = chartHtml;
    }
    
    // Function to render top products table
    function renderTopProducts(products) {
        topProductsBody.innerHTML = products.map(product => `
            <tr>
                <td style="padding:0.5rem;border-bottom:1px solid #e5e7eb;">${product.name}</td>
                <td style="text-align:right;padding:0.5rem;border-bottom:1px solid #e5e7eb;">${product.units}</td>
                <td style="text-align:right;padding:0.5rem;border-bottom:1px solid #e5e7eb;">${product.revenue}</td>
            </tr>
        `).join('');
    }
    
    // Function to render top categories table
    function renderTopCategories(categories) {
        topCategoriesBody.innerHTML = categories.map(category => `
            <tr>
                <td style="padding:0.5rem;border-bottom:1px solid #e5e7eb;">${category.name}</td>
                <td style="text-align:right;padding:0.5rem;border-bottom:1px solid #e5e7eb;">${category.orders}</td>
                <td style="text-align:right;padding:0.5rem;border-bottom:1px solid #e5e7eb;">${category.revenue}</td>
            </tr>
        `).join('');
    }
    
    // Function to update date range
    function updateDateRange() {
        // In a real implementation, this would update the date range for the report
        // For this demo, we'll just regenerate the report
        generateReport();
    }
    
    // Function to update report type
    function updateReportType() {
        // In a real implementation, this would update the report type
        // For this demo, we'll just regenerate the report
        generateReport();
    }
});