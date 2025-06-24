class BundleSelector {
  constructor() {
    this.bundles = [];
    this.selectedBundle = null;
    this.shop = window.Shopify?.shop || this.getShopFromUrl();
    this.productId = this.getProductId();
    
    console.log('🔍 Bundle Selector initialized:', {
      shop: this.shop,
      productId: this.productId,
      shopifyShop: window.Shopify?.shop,
      url: window.location.href
    });
    
    this.init();
  }

  async init() {
    if (!this.shop || !this.productId) {
      console.log('❌ Bundle Selector: Missing shop or product ID', {
        shop: this.shop,
        productId: this.productId
      });
      return;
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log('🔧 Bundle Selector: Setting up...');
    
    // Find the Add to Cart button
    const addToCartButton = this.findAddToCartButton();
    
    if (addToCartButton) {
      console.log('✅ Bundle Selector: Found Add to Cart button, inserting bundle selector');
      this.insertBundleSelector(addToCartButton);
      this.fetchAndDisplayBundles();
    } else {
      console.log('⚠️ Bundle Selector: Add to Cart button not found, trying alternative placement');
      this.insertBundleSelectorAlternative();
    }
  }

  findAddToCartButton() {
    // Common selectors for Add to Cart buttons
    const selectors = [
      'button[name="add"]',
      'input[name="add"]',
      'button[type="submit"]',
      '.product-form__submit',
      '.btn--add-to-cart',
      '.add-to-cart',
      '[data-add-to-cart]',
      '.product__form .btn',
      '.product-form button[type="submit"]',
      'form[action*="/cart/add"] button[type="submit"]'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button) {
        console.log('✅ Bundle Selector: Found Add to Cart button with selector:', selector);
        return button;
      }
    }

    console.log('❌ Bundle Selector: No Add to Cart button found with any selector');
    return null;
  }

  insertBundleSelector(addToCartButton) {
    const container = document.getElementById('bundle-selector-container');
    const loading = document.getElementById('bundle-selector-loading');
    const empty = document.getElementById('bundle-selector-empty');
    
    if (!container) {
      console.error('❌ Bundle Selector: Container not found');
      return;
    }

    // Find the best insertion point (usually the form or parent container)
    let insertionPoint = addToCartButton.closest('form') || 
                        addToCartButton.closest('.product-form') || 
                        addToCartButton.closest('.product__form') ||
                        addToCartButton.parentElement;

    if (insertionPoint) {
      // Insert bundle selector before the Add to Cart button
      insertionPoint.insertBefore(container, addToCartButton);
      container.style.display = 'block';
      
      // Also insert loading and empty states
      if (loading) {
        insertionPoint.insertBefore(loading, addToCartButton);
        loading.style.display = 'block';
      }
      if (empty) {
        insertionPoint.insertBefore(empty, addToCartButton);
      }
      
      console.log('✅ Bundle Selector: Successfully inserted above Add to Cart button');
    } else {
      console.error('❌ Bundle Selector: Could not find insertion point');
    }
  }

  insertBundleSelectorAlternative() {
    // Fallback: try to insert in common product areas
    const container = document.getElementById('bundle-selector-container');
    const loading = document.getElementById('bundle-selector-loading');
    const empty = document.getElementById('bundle-selector-empty');
    
    if (!container) return;

    const fallbackSelectors = [
      '.product__info',
      '.product-single__info',
      '.product-details',
      '.product-form',
      '.product__form',
      '.product-single__form',
      '.product__content',
      '.product-single__content'
    ];

    for (const selector of fallbackSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        element.appendChild(container);
        container.style.display = 'block';
        
        if (loading) {
          element.appendChild(loading);
          loading.style.display = 'block';
        }
        if (empty) {
          element.appendChild(empty);
        }
        
        console.log('✅ Bundle Selector: Inserted using fallback selector:', selector);
        this.fetchAndDisplayBundles();
        return;
      }
    }

    // Last resort: append to body
    document.body.appendChild(container);
    container.style.display = 'block';
    console.log('⚠️ Bundle Selector: Inserted to body as last resort');
    this.fetchAndDisplayBundles();
  }

  async fetchBundles(shop, productId) {
    console.log('🔍 Bundle Selector: Fetching bundles for:', { shop, productId });
    
    try {
      const encodedProductId = encodeURIComponent(productId);
      const apiUrl = `/apps/bundle-selector/api/bundles/product/${encodedProductId}?shop=${shop}`;
      
      console.log('🌐 Bundle Selector: Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('📡 Bundle Selector: API response status:', response.status);
      console.log('📡 Bundle Selector: API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Bundle Selector: API response data:', data);
      
      if (data.success && data.bundles) {
        this.bundles = data.bundles.filter(bundle => bundle.isActive);
        console.log(`✅ Bundle Selector: Found ${this.bundles.length} active bundles`);
        console.log('📋 Bundle Selector: Bundle details:', this.bundles.map(b => ({
          id: b.id,
          title: b.title,
          targetProduct: b.targetProduct?.productId
        })));
      } else {
        console.log('⚠️ Bundle Selector: No bundles found or API error:', data);
        this.bundles = [];
      }
    } catch (error) {
      console.error('❌ Bundle Selector: Error fetching bundles:', error);
      this.bundles = [];
    }
  }

  async fetchAndDisplayBundles() {
    console.log('🔄 Bundle Selector: Starting fetch and display process');
    await this.fetchBundles(this.shop, this.productId);
    this.displayBundles();
  }

  displayBundles() {
    console.log('🎨 Bundle Selector: Displaying bundles...');
    
    const container = document.getElementById('bundle-selector-container');
    const loading = document.getElementById('bundle-selector-loading');
    const empty = document.getElementById('bundle-selector-empty');
    const bundlesContainer = document.getElementById('bundle-selector-bundles');

    if (!container || !bundlesContainer) {
      console.error('❌ Bundle Selector: Required containers not found');
      return;
    }

    // Hide loading
    if (loading) {
      loading.style.display = 'none';
    }

    if (this.bundles.length === 0) {
      console.log('📭 Bundle Selector: No bundles to display, showing empty state');
      // Show empty state
      if (empty) {
        empty.style.display = 'block';
      }
      container.style.display = 'none';
      return;
    }

    console.log('✅ Bundle Selector: Displaying', this.bundles.length, 'bundles');

    // Hide empty state
    if (empty) {
      empty.style.display = 'none';
    }

    // Display bundles
    bundlesContainer.innerHTML = this.bundles.map(bundle => this.getBundleHTML(bundle)).join('');
    container.style.display = 'block';
  }

  getBundleHTML(bundle) {
    const savingsText = bundle.savingsPercentage > 0 
      ? `<span class="bundle-savings">Save ${bundle.savingsPercentage}%</span>` 
      : '';

    return `
      <div class="bundle-item" data-bundle-id="${bundle.id}">
        <div class="bundle-header" onclick="window.bundleSelector.toggleBundle(${bundle.id})">
          <div class="bundle-info">
            <div class="bundle-image">
              <img src="${bundle.imageUrl || '/assets/no-image.png'}" alt="${bundle.imageAlt || bundle.title}" />
            </div>
            <div class="bundle-details">
              <h4 class="bundle-title">${bundle.title}</h4>
              ${bundle.description ? `<p class="bundle-description">${bundle.description}</p>` : ''}
              <div class="bundle-pricing">
                <span class="bundle-original-price">$${bundle.originalPrice.toFixed(2)}</span>
                <span class="bundle-discounted-price">$${bundle.discountedPrice.toFixed(2)}</span>
                ${savingsText}
              </div>
            </div>
          </div>
          <div class="bundle-toggle">
            <span class="bundle-toggle-icon">▼</span>
          </div>
        </div>
        
        <div class="bundle-products" id="bundle-products-${bundle.id}" style="display: none;">
          <div class="bundle-products-header">
            <h5>Included Products:</h5>
          </div>
          <div class="bundle-products-list">
            ${bundle.bundleProducts.map(product => `
              <div class="bundle-product">
                <span class="bundle-product-title">Product ID: ${product.productId}</span>
                <span class="bundle-product-quantity">Qty: ${product.quantity}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="bundle-selection">
          <button class="bundle-select-btn" onclick="window.bundleSelector.selectBundle(${bundle.id})">
            Select Bundle
          </button>
        </div>
      </div>
    `;
  }

  toggleBundle(bundleId) {
    const productsContainer = document.getElementById(`bundle-products-${bundleId}`);
    const toggleIcon = document.querySelector(`[data-bundle-id="${bundleId}"] .bundle-toggle-icon`);
    
    if (productsContainer) {
      const isVisible = productsContainer.style.display !== 'none';
      productsContainer.style.display = isVisible ? 'none' : 'block';
      if (toggleIcon) {
        toggleIcon.textContent = isVisible ? '▼' : '▲';
      }
    }
  }

  selectBundle(bundleId) {
    this.selectedBundle = this.bundles.find(b => b.id === bundleId);
    console.log('Bundle selected:', this.selectedBundle);
    
    // Update UI to show selection
    document.querySelectorAll('.bundle-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`[data-bundle-id="${bundleId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
    
    // TODO: Integrate with cart functionality
    alert(`Bundle "${this.selectedBundle.title}" selected! Cart integration coming soon.`);
  }

  getShopFromUrl() {
    const hostname = window.location.hostname;
    if (hostname.includes('.myshopify.com')) {
      return hostname;
    }
    return null;
  }

  getProductId() {
    // Try to get product ID from various sources
    const productId = this.getProductIdFromUrl() || 
                     this.getProductIdFromMeta() || 
                     this.getProductIdFromData();
    
    console.log('🔍 Bundle Selector: Product ID detection results:', {
      fromUrl: this.getProductIdFromUrl(),
      fromMeta: this.getProductIdFromMeta(),
      fromData: this.getProductIdFromData(),
      final: productId
    });
    
    return productId;
  }

  getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || urlParams.get('product_id');
    console.log('🔍 Bundle Selector: Product ID from URL params:', id);
    return id;
  }

  getProductIdFromMeta() {
    const metaTag = document.querySelector('meta[property="og:url"]');
    if (metaTag) {
      const url = new URL(metaTag.content);
      const id = url.searchParams.get('id') || url.searchParams.get('product_id');
      console.log('🔍 Bundle Selector: Product ID from meta tag:', id);
      return id;
    }
    return null;
  }

  getProductIdFromData() {
    // Look for product data in script tags or data attributes
    const scripts = document.querySelectorAll('script[type="application/json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.product && data.product.id) {
          console.log('🔍 Bundle Selector: Product ID from script data:', data.product.id);
          return data.product.id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Try data attributes
    const productElements = document.querySelectorAll('[data-product-id]');
    for (const element of productElements) {
      const id = element.getAttribute('data-product-id');
      if (id) {
        console.log('🔍 Bundle Selector: Product ID from data attribute:', id);
        return id;
      }
    }
    
    return null;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Bundle Selector: DOM loaded, initializing...');
    window.bundleSelector = new BundleSelector();
  });
} else {
  console.log('🚀 Bundle Selector: DOM already loaded, initializing...');
  window.bundleSelector = new BundleSelector();
} 