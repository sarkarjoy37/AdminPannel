// add-sample-categories.js - Script to add sample categories to Firestore
// Run this in the browser console on your admin panel page

async function addSampleCategories() {
    try {
        console.log('Adding sample categories...');
        
        const sampleCategories = [
            {
                Name: 'Electronics',
                Image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200',
                ParentId: null,
                IsFeatured: true,
                IsActive: true
            },
            {
                Name: 'Clothing',
                Image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
                ParentId: null,
                IsFeatured: true,
                IsActive: true
            },
            {
                Name: 'Books',
                Image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200',
                ParentId: null,
                IsFeatured: false,
                IsActive: true
            },
            {
                Name: 'Smartphones',
                Image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200',
                ParentId: null, // Will be updated after Electronics is created
                IsFeatured: true,
                IsActive: true
            },
            {
                Name: 'Laptops',
                Image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200',
                ParentId: null, // Will be updated after Electronics is created
                IsFeatured: true,
                IsActive: true
            }
        ];

        // Add categories
        for (const category of sampleCategories) {
            const docRef = await db.collection('Categories').add(category);
            console.log(`Added category: ${category.Name} with ID: ${docRef.id}`);
        }

        // Update subcategories with parent IDs
        const categoriesSnapshot = await db.collection('Categories').get();
        const categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const electronics = categories.find(cat => cat.Name === 'Electronics');
        if (electronics) {
            // Update Smartphones and Laptops to be subcategories of Electronics
            const smartphones = categories.find(cat => cat.Name === 'Smartphones');
            const laptops = categories.find(cat => cat.Name === 'Laptops');

            if (smartphones) {
                await db.collection('Categories').doc(smartphones.id).update({
                    ParentId: electronics.id
                });
                console.log('Updated Smartphones parent to Electronics');
            }

            if (laptops) {
                await db.collection('Categories').doc(laptops.id).update({
                    ParentId: electronics.id
                });
                console.log('Updated Laptops parent to Electronics');
            }
        }

        console.log('✅ Sample categories added successfully!');
        console.log('🔄 Refresh the page to see the new categories');
        
    } catch (error) {
        console.error('❌ Error adding sample categories:', error);
    }
}

// Run the function
addSampleCategories(); 