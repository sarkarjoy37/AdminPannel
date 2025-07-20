// Sample product with both regular price and sale price
const sampleProduct = {
    Title: "Test Product with Sale Price",
    Description: "This is a test product to verify that both regular price and sale price display correctly in the app.",
    SKU: "TEST-SALE-001",
    Price: 1500.00, // Regular price
    SalePrice: 1200.00, // Sale price (20% discount)
    Stock: 50,
    Thumbnail: "https://firebasestorage.googleapis.com/v0/b/ecommerceapp-c9ea3.appspot.com/o/products%2Ftest-product%2Fmain-image.jpg?alt=media&token=none",
    Images: [
        "https://firebasestorage.googleapis.com/v0/b/ecommerceapp-c9ea3.appspot.com/o/products%2Ftest-product%2Fimage1.jpg?alt=media&token=none",
        "https://firebasestorage.googleapis.com/v0/b/ecommerceapp-c9ea3.appspot.com/o/products%2Ftest-product%2Fimage2.jpg?alt=media&token=none"
    ],
    CategoryId: "electronics", // Make sure this category exists
    BrandId: "", // Optional
    IsFeatured: true,
    IsActive: true,
    Rating: 0,
    ReviewCount: 0,
    Attributes: {
        Color: ["Black", "White"],
        Size: ["M", "L", "XL"]
    }
};

// Add the sample product to Firestore
async function addSampleProduct() {
    try {
        const docRef = await db.collection('Products').add(sampleProduct);
        console.log('✅ Sample product added successfully with ID:', docRef.id);
        console.log('📊 Product details:');
        console.log('- Regular Price: ৳' + sampleProduct.Price);
        console.log('- Sale Price: ৳' + sampleProduct.SalePrice);
        console.log('- Discount: ' + ((sampleProduct.Price - sampleProduct.SalePrice) / sampleProduct.Price * 100).toFixed(1) + '%');
        console.log('- Colors: ' + sampleProduct.Attributes.Color.join(', '));
        console.log('- Sizes: ' + sampleProduct.Attributes.Size.join(', '));
    } catch (error) {
        console.error('❌ Error adding sample product:', error);
    }
}

// Run the function
addSampleProduct(); 