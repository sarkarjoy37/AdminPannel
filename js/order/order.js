// admin_panel/js/order/order.js

// Firebase config (assumes firebase is already initialized in HTML)
const db = firebase.firestore();

const orderTableBody = document.getElementById('orderTableBody');
const orderModal = document.getElementById('orderModal');
const orderModalContent = document.getElementById('orderModalContent');
const orderSearch = document.getElementById('orderSearch');
const statusFilters = document.getElementById('statusFilters');

let currentOrders = []; // Store all orders for filtering
let activeFilter = 'all'; // Default filter

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: '#FFA500', // orange
  processing: '#2196F3', // blue
  shipped: '#9C27B0', // purple
  delivered: '#4CAF50', // green
  cancelled: '#F44336', // red
};

// Listen to Orders collection in real time
function listenToOrders() {
  try {
    db.collection('Orders').orderBy('OrderDate', 'desc').onSnapshot(
      snapshot => {
        console.log('[DEBUG] Orders snapshot received:', snapshot.size, 'orders');
        currentOrders = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          currentOrders.push({ id: doc.id, ...data });
        });
        applyFiltersAndSearch();
      },
      error => {
        console.error('[ERROR] Firestore onSnapshot error:', error);
        orderTableBody.innerHTML = `<tr><td colspan="6" class="error">Error loading orders: ${error.message}</td></tr>`;
      }
    );
  } catch (err) {
    console.error('[ERROR] listenToOrders exception:', err);
    orderTableBody.innerHTML = `<tr><td colspan="6" class="error">Exception: ${err.message}</td></tr>`;
  }
}

// Apply filters and search to orders
function applyFiltersAndSearch() {
  const searchTerm = orderSearch.value.trim().toLowerCase();
  
  let filteredOrders = currentOrders;
  
  // Apply status filter
  if (activeFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.Status === activeFilter);
  }
  
  // Apply search filter (last 6 digits of order number)
  if (searchTerm) {
    filteredOrders = filteredOrders.filter(order => {
      const orderNumber = order.OrderNumber || order.id || '';
      // Extract last 6 digits if order number is long enough
      const last6Digits = orderNumber.length >= 6 ? 
        orderNumber.substring(orderNumber.length - 6) : orderNumber;
      return last6Digits.toLowerCase().includes(searchTerm);
    });
  }
  
  renderOrdersTable(filteredOrders);
}

// Render orders in table
function renderOrdersTable(orders) {
  if (!orders.length) {
    orderTableBody.innerHTML = '<tr><td colspan="6" class="empty-state" data-label="Status">No orders found.</td></tr>';
    return;
  }
  orderTableBody.innerHTML = orders.map(order => {
    const date = order.OrderDate ? new Date(order.OrderDate).toLocaleString() : '';
    const status = order.Status || 'pending';
    return `
      <tr>
        <td data-label="Order #">${order.OrderNumber || order.id}</td>
        <td data-label="Customer">${order.CustomerName || ''}</td>
        <td data-label="Date">${date}</td>
        <td data-label="Status"><span class="order-status-badge" style="background:${STATUS_COLORS[status]};color:#fff;padding:4px 10px;border-radius:12px;font-size:13px;">${STATUS_LABELS[status]}</span></td>
        <td data-label="Total">৳${order.TotalAmount || 0}</td>
        <td data-label="Actions" class="action-buttons">
          <button class="view-btn" data-id="${order.id}">View</button>
          ${status === 'pending' ? `<button class="accept-btn" data-id="${order.id}">Accept</button>` : ''}
          ${status === 'processing' ? `<button class="ship-btn" data-id="${order.id}">Ship</button>` : ''}
          ${status === 'shipped' ? `<button class="deliver-btn" data-id="${order.id}">Deliver</button>` : ''}
          ${status !== 'cancelled' && status !== 'delivered' ? `<button class="cancel-btn" data-id="${order.id}">Cancel</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
  addOrderTableListeners();
}

// Add listeners to action buttons
function addOrderTableListeners() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = () => showOrderDetails(btn.getAttribute('data-id'));
  });
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.onclick = () => updateOrderStatus(btn.getAttribute('data-id'), 'processing');
  });
  document.querySelectorAll('.ship-btn').forEach(btn => {
    btn.onclick = () => updateOrderStatus(btn.getAttribute('data-id'), 'shipped');
  });
  document.querySelectorAll('.deliver-btn').forEach(btn => {
    btn.onclick = () => updateOrderStatus(btn.getAttribute('data-id'), 'delivered');
  });
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.onclick = () => updateOrderStatus(btn.getAttribute('data-id'), 'cancelled');
  });
}

// Show order details modal
function showOrderDetails(orderId) {
  db.collection('Orders').doc(orderId).get().then(doc => {
    if (!doc.exists) return;
    const order = doc.data();
    
    // If we have a customer ID, fetch the customer details to get the profile picture
    if (order.CustomerID) {
      db.collection('Users').doc(order.CustomerID).get().then(userDoc => {
        let customerData = {};
        if (userDoc.exists) {
          customerData = userDoc.data();
        }
        orderModalContent.innerHTML = renderOrderDetails(order, orderId, customerData);
        orderModal.style.display = 'block';
        document.getElementById('closeOrderModal').onclick = () => {
          orderModal.style.display = 'none';
        };
      });
    } else {
      // If no customer ID, just render with the order data
      orderModalContent.innerHTML = renderOrderDetails(order, orderId, {});
      orderModal.style.display = 'block';
      document.getElementById('closeOrderModal').onclick = () => {
        orderModal.style.display = 'none';
      };
    }
  });
}

// Render order details HTML
function renderOrderDetails(order, orderId, customerData) {
  const itemsHtml = (order.Items || []).map(item => `
    <tr>
      <td>${item.ProductTitle}</td>
      <td>${item.Size || ''}</td>
      <td>${item.Quantity}</td>
      <td>৳${item.Price}</td>
      <td>৳${(item.Price * item.Quantity).toFixed(2)}</td>
    </tr>
  `).join('');
  const shipping = order.ShippingAddress || {};
  
  // Get customer name and prepare profile image
  const customerName = order.CustomerName || '';
  let profileImg = customerData.ProfilePicture || customerData.ProfileImage || customerData.PhotoURL || '';
  if (!profileImg || !/^https?:\/\//i.test(profileImg)) {
    profileImg = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(customerName || 'Customer') + '&background=393e6e&color=fff&size=96';
  }
  
  return `
    <div class="modal-header">
      <h2>Order #${order.OrderNumber || orderId}</h2>
      <button id="closeOrderModal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="customer-profile" style="display:flex;align-items:center;margin-bottom:1.5rem;">
        <img src="${profileImg}" alt="Customer" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-right:1rem;box-shadow:0 2px 8px rgba(44,62,80,0.10);border:2px solid #e5e7eb;background:#f9fafb;" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(customerName || 'Customer')}&background=393e6e&color=fff&size=96';" />
        <div>
          <h3 style="margin:0 0 0.3rem 0;">Customer: ${customerName}</h3>
          <p style="margin:0;">Status: <span class="order-status-badge" style="background:${STATUS_COLORS[order.Status]};color:#fff;padding:4px 10px;border-radius:12px;font-size:13px;">${STATUS_LABELS[order.Status]}</span></p>
          <p style="margin:0.3rem 0 0 0;">Date: ${order.OrderDate ? new Date(order.OrderDate).toLocaleString() : ''}</p>
        </div>
      </div>
      <h4>Items</h4>
      <table class="order-items-table">
        <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <h4>Shipping Address</h4>
      <p>${shipping.FullName || ''}, ${shipping.Phone || ''}</p>
      <p>${shipping.Street || ''}, ${shipping.City || ''}, ${shipping.State || ''}, ${shipping.ZipCode || ''}, ${shipping.Country || ''}</p>
      <h4>Total Amount: ৳${order.TotalAmount || 0}</h4>
      <h4>Tracking Number: ${order.TrackingNumber || '-'}</h4>
    </div>
    <div class="modal-footer">
      ${order.Status === 'pending' ? `<button onclick="confirmStatus('${orderId}', 'processing')">Accept</button>` : ''}
      ${order.Status === 'processing' ? `<button onclick="confirmStatus('${orderId}', 'shipped')">Ship</button>` : ''}
      ${order.Status === 'shipped' ? `<button onclick="confirmStatus('${orderId}', 'delivered')">Deliver</button>` : ''}
      ${order.Status !== 'cancelled' && order.Status !== 'delivered' ? `<button onclick="confirmStatus('${orderId}', 'cancelled')">Cancel</button>` : ''}
    </div>
  `;
}

// Update order status in Firestore
function updateOrderStatus(orderId, status) {
  db.collection('Orders').doc(orderId).update({ Status: status })
    .then(() => {
      orderModal.style.display = 'none';
    });
}

// Confirmation dialog for status changes
function confirmStatus(orderId, status) {
  const label = STATUS_LABELS[status] || status;
  if (confirm(`Are you sure you want to set this order to '${label}'?`)) {
    updateOrderStatus(orderId, status);
  }
}

// Modal close on outside click
window.onclick = function(event) {
  if (event.target === orderModal) {
    orderModal.style.display = 'none';
  }
};

// Initialize
listenToOrders();
initializeFilters();

// Initialize event listeners for filters and search
function initializeFilters() {
  // Status filter buttons
  statusFilters.querySelectorAll('.status-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      statusFilters.querySelectorAll('.status-filter').forEach(b => {
        b.classList.remove('active');
      });
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Update active filter
      activeFilter = btn.getAttribute('data-status');
      
      // Apply filters
      applyFiltersAndSearch();
    });
    
    // Set background color for active filter
    const status = btn.getAttribute('data-status');
    if (status !== 'all' && STATUS_COLORS[status]) {
      btn.addEventListener('mouseenter', () => {
        if (!btn.classList.contains('active')) {
          btn.style.backgroundColor = STATUS_COLORS[status] + '22'; // Add transparency
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('active')) {
          btn.style.backgroundColor = '';
        }
      });
    }
  });
  
  // Set active filter colors
  updateActiveFilterColors();
  
  // Search input
  orderSearch.addEventListener('input', () => {
    applyFiltersAndSearch();
  });
}

// Update colors of active filter button
function updateActiveFilterColors() {
  const activeBtn = statusFilters.querySelector('.status-filter.active');
  if (activeBtn) {
    const status = activeBtn.getAttribute('data-status');
    if (status !== 'all' && STATUS_COLORS[status]) {
      activeBtn.style.backgroundColor = STATUS_COLORS[status];
    } else if (status === 'all') {
      activeBtn.style.backgroundColor = '#393e6e';
    }
  }
}