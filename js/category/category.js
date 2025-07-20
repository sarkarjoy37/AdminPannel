// category.js - Handles category management (UI + Firestore CRUD)
// Assumes Firebase and db are already initialized globally

function initCategoryManagement() {
    let categories = [];
    let editingCategoryId = null;

    const categoryTableBody = document.getElementById('categoryTableBody');
    const categoryForm = document.getElementById('categoryForm');
    const catId = document.getElementById('catId');
    const catName = document.getElementById('catName');
    const catImage = document.getElementById('catImage');
    const catImageFile = document.getElementById('catImageFile');
    const imagePreview = document.getElementById('imagePreview');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const catFeatured = document.getElementById('catFeatured');
    const catParent = document.getElementById('catParent');
    const catSubmitBtn = document.getElementById('catSubmitBtn');
    const catCancelBtn = document.getElementById('catCancelBtn');

    // Fetch categories from Firestore
    async function fetchCategories() {
        try {
            console.log('Fetching categories from Firestore...');
            const snapshot = await db.collection('Categories').get();
            console.log('Categories snapshot:', snapshot);
            categories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Processed categories:', categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('Error loading categories: ' + error.message, 'error');
        }
    }

    // Add or update category in Firestore
    async function saveCategory(cat) {
        try {
            if (cat.id) {
                // Update
                await db.collection('Categories').doc(cat.id).set({
                    Name: cat.name,
                    Image: cat.image,
                    ParentId: cat.parentId,
                    IsFeatured: cat.isFeatured
                });
                showMessage('Category updated successfully!', 'success');
            } else {
                // Add
                await db.collection('Categories').add({
                    Name: cat.name,
                    Image: cat.image,
                    ParentId: cat.parentId,
                    IsFeatured: cat.isFeatured
                });
                showMessage('Category added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            showMessage('Error saving category: ' + error.message, 'error');
        }
    }

    // Delete category from Firestore
    async function deleteCategory(id) {
        try {
            await db.collection('Categories').doc(id).delete();
            showMessage('Category deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            showMessage('Error deleting category: ' + error.message, 'error');
        }
    }

    // Upload image to Firebase Storage
    async function uploadImage(file) {
        try {
            // Validate file
            if (!file) throw new Error('No file selected');
            if (!file.type.startsWith('image/')) throw new Error('Please select an image file');
            if (file.size > 2 * 1024 * 1024) throw new Error('Image size must be less than 2MB');

            // Show loading state
            imagePreview.classList.add('uploading');
            uploadImageBtn.disabled = true;
            uploadImageBtn.textContent = 'Uploading...';

            // Create progress indicator
            const progressDiv = document.createElement('div');
            progressDiv.className = 'upload-progress';
            progressDiv.innerHTML = `
                <div>
                    <div>Uploading image...</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            `;
            imagePreview.appendChild(progressDiv);

            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `categories/${timestamp}_${file.name}`;
            const storageRef = storage.ref().child(fileName);

            // Upload file with progress tracking
            const uploadTask = storageRef.put(file);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    const progressFill = progressDiv.querySelector('.progress-fill');
                    progressFill.style.width = progress + '%';
                },
                (error) => {
                    // Error
                    throw error;
                },
                async () => {
                    // Success
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Update hidden input with download URL
                    catImage.value = downloadURL;
                    
                    // Show success state
                    imagePreview.classList.remove('uploading');
                    imagePreview.classList.add('upload-success', 'has-image');
                    uploadImageBtn.disabled = false;
                    uploadImageBtn.textContent = 'Change Image';
                    
                    // Remove progress indicator
                    progressDiv.remove();
                    
                    showMessage('Image uploaded successfully!', 'success');
                }
            );

        } catch (error) {
            console.error('Error uploading image:', error);
            
            // Reset UI state
            imagePreview.classList.remove('uploading');
            imagePreview.classList.add('upload-error');
            uploadImageBtn.disabled = false;
            uploadImageBtn.textContent = 'Choose Image';
            
            // Remove progress indicator if exists
            const progressDiv = imagePreview.querySelector('.upload-progress');
            if (progressDiv) progressDiv.remove();
            
            showMessage('Error uploading image: ' + error.message, 'error');
            
            // Reset error state after 3 seconds
            setTimeout(() => {
                imagePreview.classList.remove('upload-error');
            }, 3000);
        }
    }

    // Initialize image upload functionality
    function initImageUpload() {
        // Handle file input change
        catImageFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadImage(file);
            }
        });

        // Handle upload button click
        uploadImageBtn.addEventListener('click', function() {
            catImageFile.click();
        });

        // Handle image preview click
        imagePreview.addEventListener('click', function() {
            if (!imagePreview.classList.contains('uploading')) {
                catImageFile.click();
            }
        });

        // Handle drag and drop
        imagePreview.addEventListener('dragover', function(e) {
            e.preventDefault();
            imagePreview.classList.add('uploading');
        });

        imagePreview.addEventListener('dragleave', function(e) {
            e.preventDefault();
            imagePreview.classList.remove('uploading');
        });

        imagePreview.addEventListener('drop', function(e) {
            e.preventDefault();
            imagePreview.classList.remove('uploading');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    catImageFile.files = files;
                    uploadImage(file);
                } else {
                    showMessage('Please select an image file', 'error');
                }
            }
        });
    }

    function getCategoryNameById(id) {
        if (!id) return '';
        const cat = categories.find(c => c.id == id);
        return cat ? cat.Name : '';
    }

    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert after header
        const header = document.querySelector('.category-header');
        header.parentNode.insertBefore(messageDiv, header.nextSibling);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    async function renderCategoriesTable() {
        await fetchCategories();
        
        let categoryRows = categories.map(cat => `
            <tr>
                <td><strong>${cat.Name}</strong></td>
                <td>
                    ${cat.Image ? `<img src="${cat.Image}" alt="${cat.Name}" onerror="this.style.display='none'" />` : 'No image'}
                </td>
                <td>
                    <span class="${cat.IsFeatured ? 'featured-badge' : 'not-featured'}">
                        ${cat.IsFeatured ? 'Featured' : 'Not Featured'}
                    </span>
                </td>
                <td>${getCategoryNameById(cat.ParentId) || 'Top Level'}</td>
                <td>
                    <button class="edit-btn" data-id="${cat.id}">Edit</button>
                    <button class="delete-btn" data-id="${cat.id}">Delete</button>
                </td>
            </tr>
        `).join('');
        
        if (!categoryRows) {
            categoryRows = '<tr><td colspan="5" style="text-align: center; color: #6b7280; font-style: italic;">No categories found. Add your first category above!</td></tr>';
        }

        categoryTableBody.innerHTML = categoryRows;

        // Update parent category options
        let parentOptions = '<option value="">None (Top Level)</option>';
        categories.forEach(cat => {
            parentOptions += `<option value="${cat.id}">${cat.Name}</option>`;
        });
        catParent.innerHTML = parentOptions;

        // Add event listeners to buttons
        addButtonEventListeners();
    }

    function addButtonEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                const cat = categories.find(c => c.id === id);
                if (cat) {
                    editingCategoryId = id;
                    catId.value = cat.id;
                    catName.value = cat.Name;
                    catImage.value = cat.Image || '';
                    catFeatured.checked = cat.IsFeatured;
                    catParent.value = cat.ParentId || '';
                    catSubmitBtn.textContent = 'Update Category';
                    catCancelBtn.style.display = 'inline-block';
                    
                    // Show existing image if available
                    if (cat.Image) {
                        imagePreview.innerHTML = `
                            <img src="${cat.Image}" alt="${cat.Name}" />
                            <button type="button" class="remove-image" onclick="removeImage()">×</button>
                        `;
                        imagePreview.classList.add('has-image');
                        uploadImageBtn.textContent = 'Change Image';
                    } else {
                        resetImagePreview();
                    }
                    
                    // Scroll to form
                    document.querySelector('.category-form-container').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
            };
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async function() {
                if (confirm('Are you sure you want to delete this category?')) {
                    const id = this.getAttribute('data-id');
                    await deleteCategory(id);
                    await renderCategoriesTable();
                }
            };
        });
    }

    // Form submission
    categoryForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const cat = {
            id: editingCategoryId,
            name: catName.value.trim(),
            image: catImage.value.trim(),
            isFeatured: catFeatured.checked,
            parentId: catParent.value
        };

        if (!cat.name) {
            showMessage('Category name is required', 'error');
            return;
        }

        await saveCategory(cat);
        
        // Reset form
        editingCategoryId = null;
        categoryForm.reset();
        catSubmitBtn.textContent = 'Add Category';
        catCancelBtn.style.display = 'none';
        
        // Refresh table
        await renderCategoriesTable();
    };

    // Cancel button
    catCancelBtn.onclick = function() {
        editingCategoryId = null;
        categoryForm.reset();
        catSubmitBtn.textContent = 'Add Category';
        catCancelBtn.style.display = 'none';
        resetImagePreview();
    };

    // Reset image preview to default state
    function resetImagePreview() {
        imagePreview.innerHTML = `
            <div class="upload-placeholder">
                <span class="upload-icon">📷</span>
                <p>Click to upload image</p>
                <small>JPG, PNG, GIF up to 2MB</small>
            </div>
        `;
        imagePreview.classList.remove('has-image', 'upload-success', 'upload-error');
        uploadImageBtn.textContent = 'Choose Image';
        catImage.value = '';
    }

    // Remove image function (global for onclick)
    window.removeImage = function() {
        resetImagePreview();
    };

    // Initialize
    initImageUpload();
    renderCategoriesTable();
}

// Auto-initialize if we're on the categories page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('categoryTableBody')) {
        console.log('Initializing category management...');
        initCategoryManagement();
    }
});

// Make it available globally
window.initCategoryManagement = initCategoryManagement; 