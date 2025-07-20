document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase (assuming it's already set up in the HTML)
    const db = firebase.firestore();
    
    // DOM Elements - Tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    const settingsContents = document.querySelectorAll('.settings-content');
    
    // DOM Elements - Form actions
    const saveSettingsBtn = document.getElementById('saveSettings');
    const resetSettingsBtn = document.getElementById('resetSettings');
    const saveStoreSettingsBtn = document.getElementById('saveStoreSettings');
    const resetStoreSettingsBtn = document.getElementById('resetStoreSettings');
    
    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            settingsContents.forEach(content => content.classList.remove('active'));
            settingsContents.forEach(content => content.style.display = 'none');
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId + 'Settings');
            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.style.display = 'block';
            }
        });
    });
    
    // Save settings functionality
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            // Get form values
            const storeName = document.getElementById('storeName').value;
            const storeEmail = document.getElementById('storeEmail').value;
            const storePhone = document.getElementById('storePhone').value;
            const storeAddress = document.getElementById('storeAddress').value;
            const currency = document.getElementById('currency').value;
            const timezone = document.getElementById('timezone').value;
            const dateFormat = document.getElementById('dateFormat').value;
            
            // Validate form
            if (!storeName || !storeEmail) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Save to Firestore
            saveGeneralSettings({
                storeName,
                storeEmail,
                storePhone,
                storeAddress,
                currency,
                timezone,
                dateFormat
            });
        });
    }
    
    // Reset settings functionality
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset to default settings?')) {
                resetGeneralSettings();
            }
        });
    }
    
    // Save store settings functionality
    if (saveStoreSettingsBtn) {
        saveStoreSettingsBtn.addEventListener('click', function() {
            // Get form values
            const primaryColor = document.getElementById('primaryColor').value;
            const accentColor = document.getElementById('accentColor').value;
            const metaTitle = document.getElementById('metaTitle').value;
            const metaDescription = document.getElementById('metaDescription').value;
            const metaKeywords = document.getElementById('metaKeywords').value;
            
            // Validate form
            if (!metaTitle || !metaDescription) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Save to Firestore
            saveStoreSettings({
                primaryColor,
                accentColor,
                metaTitle,
                metaDescription,
                metaKeywords
            });
        });
    }
    
    // Reset store settings functionality
    if (resetStoreSettingsBtn) {
        resetStoreSettingsBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reset to default store settings?')) {
                resetStoreSettings();
            }
        });
    }
    
    // Function to save general settings to Firestore
    function saveGeneralSettings(settings) {
        // In a real implementation, this would save to Firestore
        // For this demo, we'll just show a success message
        console.log('Saving general settings:', settings);
        
        // Show success message
        showNotification('Settings saved successfully!');
    }
    
    // Function to reset general settings
    function resetGeneralSettings() {
        // Reset form values to defaults
        document.getElementById('storeName').value = 'PriyoRong E-commerce';
        document.getElementById('storeEmail').value = 'contact@priyorong.com';
        document.getElementById('storePhone').value = '+880 1234 567890';
        document.getElementById('storeAddress').value = '123 Commerce Street, Dhaka, Bangladesh';
        document.getElementById('currency').value = 'BDT';
        document.getElementById('timezone').value = 'Asia/Dhaka';
        document.getElementById('dateFormat').value = 'DD/MM/YYYY';
        
        // Show success message
        showNotification('Settings reset to defaults!');
    }
    
    // Function to save store settings to Firestore
    function saveStoreSettings(settings) {
        // In a real implementation, this would save to Firestore
        // For this demo, we'll just show a success message
        console.log('Saving store settings:', settings);
        
        // Show success message
        showNotification('Store settings saved successfully!');
    }
    
    // Function to reset store settings
    function resetStoreSettings() {
        // Reset form values to defaults
        document.getElementById('primaryColor').value = '#393e6e';
        document.getElementById('accentColor').value = '#ffb347';
        document.getElementById('metaTitle').value = 'PriyoRong - Premium Fashion E-commerce Store';
        document.getElementById('metaDescription').value = 'Shop the latest fashion trends at PriyoRong. We offer premium clothing, footwear, and accessories with fast delivery across Bangladesh.';
        document.getElementById('metaKeywords').value = 'fashion, clothing, shoes, accessories, bangladesh, online shopping';
        
        // Show success message
        showNotification('Store settings reset to defaults!');
    }
    
    // Function to show notification
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.background = '#4CAF50';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        notification.style.zIndex = '1000';
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
});