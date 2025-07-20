// main.js for Admin Panel
// Add your JavaScript logic here

document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logoutBtn');

    // Simple page content for demonstration
    const pages = {
        dashboard: `<h1>Dashboard</h1><p>Welcome to your e-commerce admin panel. Select a section from the sidebar to get started.</p>`,
        orders: `<h1>Orders</h1><p>Manage and view all orders here.</p>`,
        products: `<h1>Products</h1><p>Manage your product listings here.</p>`,
        categories: () => {
            if (window.initCategoryManagement) {
                window.initCategoryManagement(mainContent);
            } else {
                mainContent.innerHTML = '<p>Loading category management...</p>';
            }
        },
        users: `<h1>Users</h1><p>View and manage user accounts here.</p>`,
        reviews: `<h1>Reviews</h1><p>View and manage product reviews here.</p>`,
        reports: `<h1>Reports</h1><p>View sales, revenue, and inventory reports here.</p>`,
        settings: `<h1>Settings</h1><p>Manage platform settings here.</p>`
    };

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only intercept if data-page is present (SPA navigation)
            const page = this.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                // Remove active from all
                sidebarLinks.forEach(l => l.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
                // Update main content
                if (typeof pages[page] === 'function') {
                    pages[page]();
                } else {
                    mainContent.innerHTML = pages[page] || '<h1>Not Found</h1>';
                }
            }
        });
    });

    // Sidebar toggle for mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    // Check if window.adminAuth exists before using it
                    if (window.adminAuth) {
                        const result = await window.adminAuth.signOut();
                        if (result.success) {
                            // Redirect to index.html to show login form
                            window.location.href = 'index.html';
                        } else {
                            alert(result.error || 'Error logging out');
                        }
                    } else {
                        // Fallback if adminAuth is not available
                        window.location.href = 'index.html';
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                    // Fallback redirect
                    window.location.href = 'index.html';
                }
            }
        });
    }

    // Set Dashboard as default active
    sidebarLinks[0].classList.add('active');

    // Handle quick action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const page = this.getAttribute('data-page');
            if (page) {
                e.preventDefault();
                // Remove active from all sidebar links
                sidebarLinks.forEach(l => l.classList.remove('active'));
                // Add active to corresponding sidebar link
                const correspondingLink = document.querySelector(`[data-page="${page}"]`);
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
                // Update main content
                if (typeof pages[page] === 'function') {
                    pages[page]();
                } else {
                    mainContent.innerHTML = pages[page] || '<h1>Not Found</h1>';
                }
            }
        });
    });

    // Load dashboard stats (placeholder data for now)
    if (document.getElementById('totalOrders')) {
        loadDashboardStats();
    }
});

// Function to load dashboard statistics
async function loadDashboardStats() {
    try {
        // Get counts from Firestore
        const ordersSnapshot = await db.collection('Orders').get();
        const usersSnapshot = await db.collection('Users').get();
        const productsSnapshot = await db.collection('Products').get();
        
        // Get previous month data for comparison
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        
        // Update stats
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        document.getElementById('totalCustomers').textContent = usersSnapshot.size;
        document.getElementById('totalProducts').textContent = productsSnapshot.size;

        // Calculate turn over (total order amount)
        let totalRevenue = 0;
        let lastMonthRevenue = 0;
        
        // Count orders by status
        const orderStatusCounts = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            refunded: 0
        };
        
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            
            // Count by status
            if (order.Status) {
                orderStatusCounts[order.Status] = (orderStatusCounts[order.Status] || 0) + 1;
            } else {
                // Default to pending if no status
                orderStatusCounts.pending++;
            }
            
            if (order.TotalAmount) {
                totalRevenue += order.TotalAmount;
                
                // Check if order is from last month for comparison
                if (order.OrderDate) {
                    const orderDate = new Date(order.OrderDate);
                    if (orderDate.getMonth() === lastMonth.getMonth() && 
                        orderDate.getFullYear() === lastMonth.getFullYear()) {
                        lastMonthRevenue += order.TotalAmount;
                    }
                }
            }
        });
        
        // Update order status counts
        document.getElementById('pendingCount').textContent = orderStatusCounts.pending || 0;
        document.getElementById('processingCount').textContent = orderStatusCounts.processing || 0;
        document.getElementById('shippedCount').textContent = orderStatusCounts.shipped || 0;
        document.getElementById('deliveredCount').textContent = orderStatusCounts.delivered || 0;
        document.getElementById('cancelledCount').textContent = orderStatusCounts.cancelled || 0;
        document.getElementById('refundedCount').textContent = orderStatusCounts.refunded || 0;
        
        // Update turn over with ৳ symbol
        document.getElementById('totalRevenue').textContent = `৳${totalRevenue.toFixed(2)}`;
        
        // Calculate and update percentage change
        if (lastMonthRevenue > 0) {
            const percentChange = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
            const changeElement = document.getElementById('revenueChange');
            if (changeElement) {
                changeElement.textContent = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}% from last month`;
                changeElement.className = `stat-change ${percentChange >= 0 ? 'positive' : 'negative'}`;
            }
        }
        
        // Load recent activities
        loadRecentActivities();

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Keep default values if there's an error
    }
}

// Function to load recent activities
async function loadRecentActivities() {
    try {
        const recentActivityContainer = document.getElementById('recentActivity');
        if (!recentActivityContainer) return;
        
        // Clear existing activities
        recentActivityContainer.innerHTML = '';
        
        // Get recent orders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Get recent orders
        const recentOrders = await db.collection('Orders')
            .orderBy('OrderDate', 'desc')
            .limit(3)
            .get();
            
        // Get recent reviews
        const recentReviews = await db.collection('Reviews')
            .orderBy('ReviewDate', 'desc')
            .limit(3)
            .get();
            
        // Get recent users
        const recentUsers = await db.collection('Users')
            .orderBy('CreatedAt', 'desc')
            .limit(3)
            .get();
        
        // Combine all activities and sort by date
        const allActivities = [];
        
        recentOrders.forEach(doc => {
            const order = doc.data();
            if (order.OrderDate) {
                allActivities.push({
                    type: 'order',
                    icon: '📦',
                    text: `New order #${order.OrderNumber || doc.id.slice(-6)}`,
                    date: new Date(order.OrderDate),
                    customerName: order.CustomerName || 'Customer'
                });
            }
        });
        
        recentReviews.forEach(doc => {
            const review = doc.data();
            if (review.ReviewDate) {
                allActivities.push({
                    type: 'review',
                    icon: '⭐',
                    text: `New product review`,
                    date: new Date(review.ReviewDate),
                    rating: review.Rating || 5,
                    productId: review.ProductId
                });
            }
        });
        
        recentUsers.forEach(doc => {
            const user = doc.data();
            if (user.CreatedAt) {
                allActivities.push({
                    type: 'user',
                    icon: '👤',
                    text: 'New user registered',
                    date: new Date(user.CreatedAt),
                    userName: user.Name || user.Email || 'User'
                });
            }
        });
        
        // Sort activities by date (newest first)
        allActivities.sort((a, b) => b.date - a.date);
        
        // Display the 5 most recent activities
        const activitiesToShow = allActivities.slice(0, 5);
        
        if (activitiesToShow.length === 0) {
            recentActivityContainer.innerHTML = '<div class="empty-state">No recent activity</div>';
            return;
        }
        
        // Format and display activities
        activitiesToShow.forEach(activity => {
            const timeAgo = getTimeAgo(activity.date);
            
            const activityHTML = `
                <div class="activity-item">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <p>${activity.text}</p>
                        <small>${timeAgo}</small>
                    </div>
                </div>
            `;
            
            recentActivityContainer.innerHTML += activityHTML;
        });
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
        // Keep default activities if there's an error
    }
}

// Helper function to format time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}