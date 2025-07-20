// admin_panel/js/user/users.js

// Firebase config (assumes firebase is already initialized in HTML)
const db = firebase.firestore();

const userTableBody = document.getElementById('userTableBody');
const userModal = document.getElementById('userModal');
const userModalContent = document.getElementById('userModalContent');
const searchUserID = document.getElementById('searchUserID');
const searchUsername = document.getElementById('searchUsername');

let currentUsers = []; // Store all users for filtering

const USER_STATUSES = ['active', 'blocked'];
const STATUS_LABELS = {
  active: 'Active',
  blocked: 'Blocked',
};
const STATUS_COLORS = {
  active: '#4CAF50', // green
  blocked: '#F44336', // red
};

// Listen to Users collection in real time
function listenToUsers() {
  try {
    db.collection('Users').onSnapshot(
      snapshot => {
        console.log('[DEBUG] Users snapshot received:', snapshot.size, 'users');
        currentUsers = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          currentUsers.push({ id: doc.id, ...data });
        });
        applyFiltersAndSearch();
      },
      error => {
        console.error('[ERROR] Firestore onSnapshot error:', error);
        userTableBody.innerHTML = `<tr><td colspan="7" class="error">Error loading users: ${error.message}</td></tr>`;
      }
    );
  } catch (err) {
    console.error('[ERROR] listenToUsers exception:', err);
    userTableBody.innerHTML = `<tr><td colspan="7" class="error">Exception: ${err.message}</td></tr>`;
  }
}

// Apply filters and search to users
function applyFiltersAndSearch() {
  const userIDTerm = searchUserID.value.trim().toLowerCase();
  const usernameTerm = searchUsername.value.trim().toLowerCase();
  
  let filteredUsers = currentUsers;
  
  // Apply User ID search filter
  if (userIDTerm) {
    filteredUsers = filteredUsers.filter(user => 
      user.id.toLowerCase().includes(userIDTerm)
    );
  }
  
  // Apply Username search filter
  if (usernameTerm) {
    filteredUsers = filteredUsers.filter(user => {
      const username = user.Username || '';
      return username.toLowerCase().includes(usernameTerm);
    });
  }
  
  renderUsersTable(filteredUsers);
}

// Render users in table
function renderUsersTable(users) {
  if (!users.length) {
    userTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found.</td></tr>';
    return;
  }
  userTableBody.innerHTML = users.map(user => {
    const name = `${user.FirstName || ''} ${user.LastName || ''}`.trim();
    const email = user.Email || '';
    const username = user.Username || '-';
    const status = user.Status || 'active';
    let profileImg = user.ProfilePicture || user.ProfileImage || user.PhotoURL || '';
    if (!profileImg || !/^https?:\/\//.test(profileImg)) {
      profileImg = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || user.Email || 'User') + '&background=393e6e&color=fff&size=64';
    }
    return `
      <tr>
        <td data-label="Profile"><img src="${profileImg}" class="user-profile" alt="Profile" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.Email || 'User')}&background=393e6e&color=fff&size=64';" /></td>
        <td data-label="User ID">${user.id}</td>
        <td data-label="Username">${username}</td>
        <td data-label="Name">${name}</td>
        <td data-label="Email">${email}</td>
        <td data-label="Status"><span class="order-status-badge" style="background:${STATUS_COLORS[status]};color:#fff;padding:4px 10px;border-radius:12px;font-size:13px;">${STATUS_LABELS[status] || status}</span></td>
        <td data-label="Actions">
          <button class="view-btn" data-id="${user.id}">View</button>
          <button class="delete-btn" data-id="${user.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
  addUserTableListeners();
}

// Initialize event listeners for search
function initializeSearch() {
  // Search inputs
  searchUserID.addEventListener('input', () => {
    applyFiltersAndSearch();
  });
  
  searchUsername.addEventListener('input', () => {
    applyFiltersAndSearch();
  });
}

// Add listeners to action buttons
function addUserTableListeners() {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = () => showUserDetails(btn.getAttribute('data-id'));
  });
  document.querySelectorAll('.block-btn').forEach(btn => {
    btn.onclick = () => updateUserStatus(btn.getAttribute('data-id'), 'blocked');
  });
  document.querySelectorAll('.unblock-btn').forEach(btn => {
    btn.onclick = () => updateUserStatus(btn.getAttribute('data-id'), 'active');
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => confirmDeleteUser(btn.getAttribute('data-id'));
  });
}

// Show user details modal
function showUserDetails(userId) {
  db.collection('Users').doc(userId).get().then(doc => {
    if (!doc.exists) return;
    const user = doc.data();
    userModalContent.innerHTML = renderUserDetails(user, userId);
    userModal.style.display = 'block';
    document.getElementById('closeUserModal').onclick = () => {
      userModal.style.display = 'none';
    };
  });
}

// Render user details HTML
function renderUserDetails(user, userId) {
  const name = `${user.FirstName || ''} ${user.LastName || ''}`.trim();
  const email = user.Email || '';
  const username = user.Username || '';
  const date = user.createdAt ? new Date(user.createdAt).toLocaleString() : '';
  let profileImg = user.ProfilePicture || user.ProfileImage || user.PhotoURL || '';
  if (!profileImg || !/^https?:\/\//.test(profileImg)) {
    profileImg = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || user.Email || 'User') + '&background=393e6e&color=fff&size=96';
  }
  return `
    <div class="modal-header">
      <h2>User: ${name || username || userId}</h2>
      <button id="closeUserModal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="user-detail-profile">
        <img src="${profileImg}" class="user-profile" alt="Profile" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:1.2em;box-shadow:0 2px 8px rgba(44,62,80,0.10);border:2px solid #e5e7eb;background:#f9fafb;" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name || user.Email || 'User')}&background=393e6e&color=fff&size=96';" />
      </div>
      <div class="user-detail-item"><span class="detail-label">Email:</span> <span class="detail-value">${email}</span></div>
      <div class="user-detail-item"><span class="detail-label">Username:</span> <span class="detail-value">${username}</span></div>
      <div class="user-detail-item">
        <span class="detail-label">Status:</span> 
        <span class="detail-value"><span class="order-status-badge" style="background:${STATUS_COLORS[user.Status || 'active']};color:#fff;padding:4px 10px;border-radius:12px;font-size:13px;">${STATUS_LABELS[user.Status || 'active']}</span></span>
      </div>
      <div class="user-detail-item"><span class="detail-label">Registered:</span> <span class="detail-value">${date}</span></div>
      <div class="user-detail-item"><span class="detail-label">UID:</span> <span class="detail-value">${userId}</span></div>
      <div class="user-detail-item"><span class="detail-label">Phone:</span> <span class="detail-value">${user.PhoneNumber || '-'}</span></div>
      <div class="user-detail-item"><span class="detail-label">Provider:</span> <span class="detail-value">${user.providerId || '-'}</span></div>
    </div>
    <div class="modal-footer">
      <button onclick="confirmDeleteUser('${userId}')" class="delete-btn">Delete</button>
    </div>
  `;
}

// Update user status in Firestore
function updateUserStatus(userId, status) {
  db.collection('Users').doc(userId).update({ Status: status })
    .then(() => {
      userModal.style.display = 'none';
    });
}

// Confirmation dialog for status changes
function confirmStatus(userId, status) {
  const label = STATUS_LABELS[status] || status;
  if (confirm(`Are you sure you want to set this user to '${label}'?`)) {
    updateUserStatus(userId, status);
  }
}

// Confirmation dialog for deleting user
function confirmDeleteUser(userId) {
  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    db.collection('Users').doc(userId).delete();
    userModal.style.display = 'none';
  }
}

// Modal close on outside click
window.onclick = function(event) {
  if (event.target === userModal) {
    userModal.style.display = 'none';
  }
};

// Initialize
listenToUsers();
initializeSearch();