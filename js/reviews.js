// admin_panel/js/reviews.js

const db = firebase.firestore();
const reviewTableBody = document.getElementById('reviewTableBody');
const reviewModal = document.getElementById('reviewModal');
const reviewModalContent = document.getElementById('reviewModalContent');

// Fetch and render all reviews with product names and images
async function fetchAndRenderReviews() {
    try {
        const snapshot = await db.collection('Reviews').orderBy('ReviewDate', 'desc').get();
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Fetch product names and images in parallel
        const productIds = [...new Set(reviews.map(r => r.ProductId))];
        const productMap = {};
        if (productIds.length > 0) {
            const productSnaps = await Promise.all(productIds.map(pid => db.collection('Products').doc(pid).get()));
            productSnaps.forEach(doc => {
                if (doc.exists) productMap[doc.id] = { name: doc.data().Title || '', image: doc.data().Thumbnail || '' };
            });
        }
        // Attach product name and image to each review
        reviews.forEach(r => {
            r.ProductName = productMap[r.ProductId]?.name || '(Unknown)';
            r.ProductImage = productMap[r.ProductId]?.image || '';
        });
        renderReviewsTable(reviews);
    } catch (error) {
        reviewTableBody.innerHTML = `<tr><td colspan='7' class='error'>Error loading reviews: ${error.message}</td></tr>`;
    }
}

// Render reviews in table (colorful, modern, time below date)
function renderReviewsTable(reviews) {
    if (!reviews.length) {
        reviewTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No reviews found.</td></tr>';
        return;
    }
    reviewTableBody.innerHTML = reviews.map(review => {
        let dateStr = '';
        let timeStr = '';
        if (review.ReviewDate) {
            const d = new Date(review.ReviewDate);
            dateStr = d.toLocaleDateString();
            timeStr = d.toLocaleTimeString();
        }
        return `
            <tr class="review-row">
                <td class="product-name-cell">
                  <span class="product-name">${review.ProductName || ''}</span>
                </td>
                <td class="product-id-cell">${review.ProductId || ''}</td>
                <td class="user-name-cell">${review.UserName || ''}</td>
                <td class="rating-cell"><span class="rating-badge">${review.Rating || ''}★</span></td>
                <td class="review-text-cell">${review.ReviewText ? review.ReviewText.substring(0, 60) + (review.ReviewText.length > 60 ? '...' : '') : ''}</td>
                <td class="date-cell">
                  <span class="date-str">${dateStr}</span><br>
                  <span class="time-str">${timeStr}</span>
                </td>
                <td class="actions-cell">
                    <button class="delete-btn styled-btn" data-id="${review.id}">Delete</button>
                    <button class="view-btn styled-btn view-btn-alt" data-id="${review.id}">View</button>
                </td>
            </tr>
        `;
    }).join('');
    addReviewTableListeners(reviews);
}

// Add event listeners to delete/view buttons
function addReviewTableListeners(reviews) {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async function() {
            const id = this.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this review?')) {
                await deleteReview(id);
            }
        };
    });
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = function() {
            const id = this.getAttribute('data-id');
            const review = reviews.find(r => r.id === id);
            showReviewModal(review);
        };
    });
}

// Delete review from Firestore
async function deleteReview(reviewId) {
    try {
        await db.collection('Reviews').doc(reviewId).delete();
        fetchAndRenderReviews();
    } catch (error) {
        alert('Error deleting review: ' + error.message);
    }
}

// Show review details in modal (with product image)
function showReviewModal(review) {
    reviewModalContent.innerHTML = `
        <div class="modal-header">
            <h2>Review Details</h2>
            <button id="closeReviewModal">&times;</button>
        </div>
        <div class="modal-body">
            <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
                <img src="${review.ProductImage || ''}" alt="Product Image" style="max-width:90px;max-height:90px;border-radius:10px;border:2px solid #eee;background:#fafafa;object-fit:cover;" onerror="this.style.display='none'" />
                <div>
                  <div style="font-size:1.1em;font-weight:600;">${review.ProductName || ''}</div>
                  <div style="color:#888;font-size:0.95em;">${review.ProductId || ''}</div>
                </div>
            </div>
            <p><strong>User Name:</strong> ${review.UserName || ''}</p>
            <p><strong>User ID:</strong> ${review.UserId || ''}</p>
            <p><strong>Rating:</strong> <span class="rating-badge-modal">${review.Rating || ''}★</span></p>
            <p><strong>Review Text:</strong> ${review.ReviewText || ''}</p>
            <p><strong>Date:</strong> ${review.ReviewDate ? new Date(review.ReviewDate).toLocaleDateString() : ''}</p>
            <p><strong>Time:</strong> ${review.ReviewDate ? new Date(review.ReviewDate).toLocaleTimeString() : ''}</p>
            <p><strong>Verified Purchase:</strong> ${review.IsVerifiedPurchase ? 'Yes' : 'No'}</p>
            <img src="${review.UserProfileImage || ''}" alt="User Profile" style="max-width:60px;max-height:60px;border-radius:50%;margin-top:10px;" onerror="this.style.display='none'" />
        </div>
    `;
    reviewModal.style.display = 'block';
    document.getElementById('closeReviewModal').onclick = function() {
        reviewModal.style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target === reviewModal) {
            reviewModal.style.display = 'none';
        }
    };
}

// Initial fetch
fetchAndRenderReviews();

// Add modern, colorful styles for table, badges, and buttons
const style = document.createElement('style');
style.innerHTML = `
  .review-row {
    background: #f9f9ff;
    border-bottom: 1.5px solid #e5e7eb;
    transition: background 0.2s;
  }
  .review-row:hover {
    background: #f0f4ff;
  }
  .product-name-cell {
    font-weight: 600;
    color: #232946;
    letter-spacing: 0.01em;
    font-size: 1.08em;
    padding-left: 8px;
  }
  .product-id-cell, .user-name-cell, .review-text-cell, .date-cell, .actions-cell {
    font-size: 1em;
    vertical-align: middle;
    padding: 8px 6px;
    word-break: break-all;
  }
  .rating-cell {
    text-align: center;
  }
  .rating-badge {
    display: inline-block;
    background: linear-gradient(90deg, #ffb347 60%, #ffcc80 100%);
    color: #232946;
    font-weight: bold;
    border-radius: 8px;
    padding: 5px 13px;
    font-size: 1.1em;
    box-shadow: 0 1px 4px #ffe0b2;
    letter-spacing: 0.02em;
  }
  .rating-badge-modal {
    display: inline-block;
    background: linear-gradient(90deg, #ffb347 60%, #ffcc80 100%);
    color: #232946;
    font-weight: bold;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 1.08em;
    box-shadow: 0 1px 4px #ffe0b2;
    letter-spacing: 0.02em;
  }
  .styled-btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    margin: 4px 0;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    background: #393e6e;
    color: #fff;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
    display: block;
    width: 100%;
  }
  .styled-btn.delete-btn {
    background: #e53e3e;
    color: #fff;
    margin-bottom: 7px;
  }
  .styled-btn.view-btn-alt {
    background: #393e6e;
    color: #fff;
  }
  .styled-btn:hover {
    background: #232946;
    color: #fff;
    box-shadow: 0 4px 16px rgba(44, 62, 80, 0.13);
  }
  .actions-cell {
    min-width: 90px;
    text-align: center;
  }
  .date-str {
    font-weight: 500;
    color: #232946;
    font-size: 1.04em;
  }
  .time-str {
    color: #6b7280;
    font-size: 0.98em;
    font-style: italic;
    display: block;
    margin-top: 2px;
  }
`;
document.head.appendChild(style); 