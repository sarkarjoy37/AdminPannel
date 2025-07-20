// product.js - Handles product management (UI + Firestore CRUD)
// Assumes Firebase and db are already initialized globally

function initProductManagement() {
    let products = [];
    let categories = [];
    let brands = [];
    let editingProductId = null;
    let uploadedImages = [];

    // DOM elements
    const productTableBody = document.getElementById('productTableBody');
    const productForm = document.getElementById('productForm');
    const productId = document.getElementById('productId');
    const productTitle = document.getElementById('productTitle');
    const productSKU = document.getElementById('productSKU');
    const productDescription = document.getElementById('productDescription');
    const productCategory = document.getElementById('productCategory');
    const productBrand = document.getElementById('productBrand');
    const productPrice = document.getElementById('productPrice');
    const productSalePrice = document.getElementById('productSalePrice');
    const productStock = document.getElementById('productStock');
    const productImages = document.getElementById('productImages');
    const imagePreviewGrid = document.getElementById('imagePreviewGrid');
    const uploadImagesBtn = document.getElementById('uploadImagesBtn');
    const productImagesUrls = document.getElementById('productImagesUrls');
    const productFeatured = document.getElementById('productFeatured');
    const productActive = document.getElementById('productActive');
    const productSubmitBtn = document.getElementById('productSubmitBtn');
    const productCancelBtn = document.getElementById('productCancelBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchProducts = document.getElementById('searchProducts');
    const productColor = document.getElementById('productColor');
    const productSize = document.getElementById('productSize');

    // Fetch categories from Firestore
    async function fetchCategories() {
        try {
            console.log('Fetching categories...');
            const snapshot = await db.collection('Categories').get();
            categories = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Categories loaded:', categories.length);
            populateCategoryOptions();
        } catch (error) {
            console.error('Error fetching categories:', error);
            showMessage('Error loading categories: ' + error.message, 'error');
        }
    }

    // Fetch brands from Firestore
    async function fetchBrands() {
        try {
            console.log('Fetching brands...');
            const snapshot = await db.collection('Brands').get();
            brands = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Brands loaded:', brands.length);
            populateBrandOptions();
        } catch (error) {
            console.error('Error fetching brands:', error);
            // Don't show error for brands as they're optional
        }
    }

    // Fetch products from Firestore
    async function fetchProducts() {
        try {
            console.log('Fetching products...');
            const snapshot = await db.collection('Products').get();
            products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log('Products loaded:', products.length);
        } catch (error) {
            console.error('Error fetching products:', error);
            showMessage('Error loading products: ' + error.message, 'error');
        }
    }

    // Populate category dropdowns
    function populateCategoryOptions() {
        let categoryOptions = '<option value="">Select a category</option>';
        categories.forEach(cat => {
            categoryOptions += `<option value="${cat.id}">${cat.Name}</option>`;
        });
        productCategory.innerHTML = categoryOptions;
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + categoryOptions.replace('Select a category', 'All Categories');
    }

    // Populate brand dropdowns
    function populateBrandOptions() {
        let brandOptions = '<option value="">Select a brand (optional)</option>';
        brands.forEach(brand => {
            brandOptions += `<option value="${brand.id}">${brand.Name}</option>`;
        });
        productBrand.innerHTML = brandOptions;
    }

    // Get category name by ID
    function getCategoryNameById(id) {
        if (!id) return '';
        const cat = categories.find(c => c.id === id);
        return cat ? cat.Name : '';
    }

    // Get brand name by ID
    function getBrandNameById(id) {
        if (!id) return '';
        const brand = brands.find(b => b.id === id);
        return brand ? brand.Name : '';
    }

    // Upload multiple images to Firebase Storage
    async function uploadImages(files) {
        const uploadPromises = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file
            if (!file.type.startsWith('image/')) {
                showMessage(`File ${file.name} is not an image`, 'error');
                continue;
            }
            
            if (file.size > 2 * 1024 * 1024) {
                showMessage(`File ${file.name} is too large (max 2MB)`, 'error');
                continue;
            }

            // Generate unique filename
            const timestamp = Date.now() + i;
            const fileName = `products/${timestamp}_${file.name}`;
            const storageRef = storage.ref().child(fileName);

            // Upload file
            const uploadTask = storageRef.put(file);
            
            uploadPromises.push(
                uploadTask.then(async (snapshot) => {
                    const downloadURL = await snapshot.ref.getDownloadURL();
                    return {
                        url: downloadURL,
                        name: file.name
                    };
                })
            );
        }

        try {
            const results = await Promise.all(uploadPromises);
            uploadedImages = [...uploadedImages, ...results];
            updateImagePreview();
            showMessage(`${results.length} images uploaded successfully!`, 'success');
        } catch (error) {
            console.error('Error uploading images:', error);
            showMessage('Error uploading images: ' + error.message, 'error');
        }
    }

    // Update image preview grid
    function updateImagePreview() {
        if (uploadedImages.length === 0) {
            imagePreviewGrid.innerHTML = `
                <div class="upload-placeholder">
                    <span class="upload-icon">📷</span>
                    <p>Click to upload images</p>
                    <small>JPG, PNG, GIF up to 2MB each</small>
                </div>
            `;
            imagePreviewGrid.classList.remove('has-images');
        } else {
            imagePreviewGrid.innerHTML = uploadedImages.map((image, index) => `
                <div class="image-item">
                    <img src="${image.url}" alt="${image.name}" />
                    <button type="button" class="remove-image-btn" onclick="removeProductImage(${index})">×</button>
                </div>
            `).join('');
            imagePreviewGrid.classList.add('has-images');
        }
        
        // Update hidden input with URLs
        productImagesUrls.value = JSON.stringify(uploadedImages.map(img => img.url));
    }

    // Remove product image (global function)
    window.removeProductImage = function(index) {
        uploadedImages.splice(index, 1);
        updateImagePreview();
    };

    // Add or update product in Firestore
    async function saveProduct(product) {
        try {
            const productData = {
                Title: product.title,
                Description: product.description,
                SKU: product.sku,
                Price: parseFloat(product.price), // Price is the main price
                SalePrice: product.salePrice ? parseFloat(product.salePrice) : null, // SalePrice is the discounted price
                Stock: parseInt(product.stock),
                Thumbnail: product.images.length > 0 ? product.images[0] : '',
                Images: product.images.filter(url => url.startsWith('http')),
                CategoryId: product.categoryId,
                BrandId: product.brandId || '',
                IsFeatured: product.isFeatured,
                IsActive: product.isActive,
                Rating: 0,
                ReviewCount: 0,
                Attributes: {
                    Color: product.color,
                    Size: product.size
                }
            };

            if (product.id) {
                // Update
                await db.collection('Products').doc(product.id).set(productData);
                showMessage('Product updated successfully!', 'success');
            } else {
                // Add
                await db.collection('Products').add(productData);
                showMessage('Product added successfully!', 'success');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            showMessage('Error saving product: ' + error.message, 'error');
        }
    }

    // Delete product from Firestore
    async function deleteProduct(id) {
        try {
            await db.collection('Products').doc(id).delete();
            showMessage('Product deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showMessage('Error deleting product: ' + error.message, 'error');
        }
    }

    // Show message
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
        const header = document.querySelector('.product-header');
        header.parentNode.insertBefore(messageDiv, header.nextSibling);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // Render products table
    async function renderProductsTable() {
        await fetchProducts();
        
        let productRows = '';
        if (products.length > 0) {
            productRows = products.map(product => {
                const categoryName = getCategoryNameById(product.CategoryId);
                const brandName = getBrandNameById(product.BrandId);
                // Use first valid image from Images array, fallback to Thumbnail
                let mainImage = '';
                if (product.Images && Array.isArray(product.Images) && product.Images.length > 0) {
                    mainImage = product.Images.find(url => !!url);
                }
                if (!mainImage && product.Thumbnail) {
                    mainImage = product.Thumbnail;
                }
                
                const price = typeof product.Price === 'number' ? product.Price : parseFloat(product.Price);
                const salePrice = typeof product.SalePrice === 'number' ? product.SalePrice : parseFloat(product.SalePrice);

                // Price display logic
                let priceHtml = '';
                if (salePrice && salePrice < price) {
                    priceHtml = `<span class="product-sale-price highlight large">৳${salePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> <span class="product-price strikethrough red small">৳${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
                } else {
                    priceHtml = `<span class="product-price highlight large">৳${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
                }

                return `
                    <tr>
                        <td>
                            ${mainImage ? `<img src="${mainImage}" alt="${product.Title}" class="product-image" onerror="this.style.display='none'" />` : 'No image'}
                        </td>
                        <td>
                            <div class="product-title" title="${product.Title}">${product.Title}</div>
                            <div class="product-category">${categoryName}</div>
                        </td>
                        <td>${categoryName || 'No category'}</td>
                        <td>
                            ${priceHtml}
                        </td>
                        <td>
                            <span class="product-stock ${product.Stock < 10 ? 'low' : product.Stock < 50 ? 'medium' : 'high'}">
                                ${product.Stock}
                            </span>
                        </td>
                        <td>
                            <span class="product-status ${product.IsActive ? 'active' : 'inactive'}">
                                ${product.IsActive ? 'Active' : 'Inactive'}
                            </span>
                            ${product.IsFeatured ? '<span class="product-status featured">Featured</span>' : ''}
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="edit-btn" data-id="${product.id}">Edit</button>
                                <button class="delete-btn" data-id="${product.id}">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            productRows = '<tr><td colspan="7" class="empty-state">No products found. Add your first product above!</td></tr>';
        }

        productTableBody.innerHTML = productRows;
        addButtonEventListeners();
    }

    // Add event listeners to buttons
    function addButtonEventListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                const product = products.find(p => p.id === id);
                if (product) {
                    editingProductId = id;
                    productId.value = product.id;
                    productTitle.value = product.Title;
                    productSKU.value = product.SKU;
                    productDescription.value = product.Description;
                    productCategory.value = product.CategoryId;
                    productBrand.value = product.BrandId || '';
                    productPrice.value = product.Price;
                    productSalePrice.value = product.SalePrice || '';
                    productStock.value = product.Stock;
                    productFeatured.checked = product.IsFeatured;
                    productActive.checked = product.IsActive;
                    
                    // Load existing images
                    uploadedImages = (product.Images || []).map(url => ({ url, name: 'Existing image' }));
                    updateImagePreview();
                    
                    productSubmitBtn.textContent = 'Update Product';
                    productCancelBtn.style.display = 'inline-block';
                    
                    // Scroll to form
                    document.querySelector('.product-form-container').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                    productColor.value = (product.Attributes && Array.isArray(product.Attributes.Color)) ? product.Attributes.Color.join(', ') : '';
                    productSize.value = (product.Attributes && Array.isArray(product.Attributes.Size)) ? product.Attributes.Size.join(', ') : '';
                }
            };
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = async function() {
                if (confirm('Are you sure you want to delete this product?')) {
                    const id = this.getAttribute('data-id');
                    await deleteProduct(id);
                    await renderProductsTable();
                }
            };
        });
    }

    // Initialize image upload functionality
    function initImageUpload() {
        // Handle file input change
        productImages.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                uploadImages(files);
            }
        });

        // Handle upload button click
        uploadImagesBtn.addEventListener('click', function() {
            productImages.click();
        });

        // Handle image preview grid click
        imagePreviewGrid.addEventListener('click', function(e) {
            if (e.target === imagePreviewGrid || e.target.classList.contains('upload-placeholder')) {
                productImages.click();
            }
        });

        // Handle drag and drop
        imagePreviewGrid.addEventListener('dragover', function(e) {
            e.preventDefault();
            imagePreviewGrid.classList.add('uploading');
        });

        imagePreviewGrid.addEventListener('dragleave', function(e) {
            e.preventDefault();
            imagePreviewGrid.classList.remove('uploading');
        });

        imagePreviewGrid.addEventListener('drop', function(e) {
            e.preventDefault();
            imagePreviewGrid.classList.remove('uploading');
            
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                uploadImages(imageFiles);
            } else {
                showMessage('Please select image files', 'error');
            }
        });
    }

    // Form submission
    productForm.onsubmit = async function(e) {
        e.preventDefault();
        
        // Validate required fields
        if (!productTitle.value.trim()) {
            showMessage('Product title is required', 'error');
            return;
        }
        
        if (!productSKU.value.trim()) {
            showMessage('SKU is required', 'error');
            return;
        }
        
        if (!productDescription.value.trim()) {
            showMessage('Product description is required', 'error');
            return;
        }
        
        if (!productCategory.value) {
            showMessage('Please select a category', 'error');
            return;
        }
        
        if (!productPrice.value || parseFloat(productPrice.value) <= 0) {
            showMessage('Please enter a valid price', 'error');
            return;
        }
        
        if (!productStock.value || parseInt(productStock.value) < 0) {
            showMessage('Please enter a valid stock quantity', 'error');
            return;
        }
        
        // Validate sale price is less than regular price
        if (productSalePrice.value && parseFloat(productSalePrice.value) >= parseFloat(productPrice.value)) {
            showMessage('Sale price must be less than regular price', 'error');
            return;
        }

        const colorArray = productColor.value.trim() ? productColor.value.split(',').map(c => c.trim()).filter(Boolean) : [];
        const sizeArray = productSize.value.trim() ? productSize.value.split(',').map(s => s.trim()).filter(Boolean) : [];
        const product = {
            id: editingProductId,
            title: productTitle.value.trim(),
            sku: productSKU.value.trim(),
            description: productDescription.value.trim(),
            categoryId: productCategory.value,
            brandId: productBrand.value || null,
            // Map form fields to correct Firestore fields:
            price: productPrice.value, // Regular price (main price)
            salePrice: productSalePrice.value || null, // Sale price (discounted price)
            stock: productStock.value,
            images: uploadedImages.map(img => img.url).filter(url => url.startsWith('http')),
            isFeatured: productFeatured.checked,
            isActive: productActive.checked,
            color: colorArray,
            size: sizeArray
        };

        await saveProduct(product);
        
        // Reset form
        editingProductId = null;
        productForm.reset();
        uploadedImages = [];
        updateImagePreview();
        productSubmitBtn.textContent = 'Add Product';
        productCancelBtn.style.display = 'none';
        
        // Refresh table
        await renderProductsTable();
    };

    // Cancel button
    productCancelBtn.onclick = function() {
        editingProductId = null;
        productForm.reset();
        uploadedImages = [];
        updateImagePreview();
        productSubmitBtn.textContent = 'Add Product';
        productCancelBtn.style.display = 'none';
    };

    // Filter and search functionality
    categoryFilter.addEventListener('change', function() {
        filterProducts();
    });

    searchProducts.addEventListener('input', function() {
        filterProducts();
    });

    function filterProducts() {
        const categoryFilterValue = categoryFilter.value;
        const searchValue = searchProducts.value.toLowerCase();
        
        const filteredProducts = products.filter(product => {
            const categoryMatch = !categoryFilterValue || product.CategoryId === categoryFilterValue;
            const searchMatch = !searchValue || 
                product.Title.toLowerCase().includes(searchValue) ||
                product.SKU.toLowerCase().includes(searchValue) ||
                product.Description.toLowerCase().includes(searchValue);
            
            return categoryMatch && searchMatch;
        });

        renderFilteredProducts(filteredProducts);
    }

    function renderFilteredProducts(filteredProducts) {
        let productRows = '';
        if (filteredProducts.length > 0) {
            productRows = filteredProducts.map(product => {
                const categoryName = getCategoryNameById(product.CategoryId);
                const mainImage = product.Images && product.Images.length > 0 ? product.Images[0] : product.Thumbnail;
                
                const price = typeof product.Price === 'number' ? product.Price : parseFloat(product.Price);
                const salePrice = typeof product.SalePrice === 'number' ? product.SalePrice : parseFloat(product.SalePrice);

                // Price display logic
                let priceHtml = '';
                if (salePrice && salePrice < price) {
                    priceHtml = `<span class="product-sale-price highlight large">৳${salePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> <span class="product-price strikethrough red small">৳${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
                } else {
                    priceHtml = `<span class="product-price highlight large">৳${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>`;
                }

                return `
                    <tr>
                        <td>
                            ${mainImage ? `<img src="${mainImage}" alt="${product.Title}" class="product-image" onerror="this.style.display='none'" />` : 'No image'}
                        </td>
                        <td>
                            <div class="product-title" title="${product.Title}">${product.Title}</div>
                            <div class="product-category">${categoryName}</div>
                        </td>
                        <td>${categoryName || 'No category'}</td>
                        <td>
                            ${priceHtml}
                        </td>
                        <td>
                            <span class="product-stock ${product.Stock < 10 ? 'low' : product.Stock < 50 ? 'medium' : 'high'}">
                                ${product.Stock}
                            </span>
                        </td>
                        <td>
                            <span class="product-status ${product.IsActive ? 'active' : 'inactive'}">
                                ${product.IsActive ? 'Active' : 'Inactive'}
                            </span>
                            ${product.IsFeatured ? '<span class="product-status featured">Featured</span>' : ''}
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="edit-btn" data-id="${product.id}">Edit</button>
                                <button class="delete-btn" data-id="${product.id}">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            productRows = '<tr><td colspan="7" class="empty-state">No products found matching your criteria.</td></tr>';
        }

        productTableBody.innerHTML = productRows;
        addButtonEventListeners();
    }

    // Initialize
    initImageUpload();
    fetchCategories();
    fetchBrands();
    renderProductsTable();
}

// Auto-initialize if we're on the products page
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('productTableBody')) {
        console.log('Initializing product management...');
        initProductManagement();
    }
});

// Make it available globally
window.initProductManagement = initProductManagement; 