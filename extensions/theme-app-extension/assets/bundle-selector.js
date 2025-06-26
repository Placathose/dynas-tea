/**
 * Bundle Selector - Complete Module
 * Includes API, DOM, and main coordination functionality
 */

// Bundle API Module
class BundleAPI {
  constructor(shop) {
    this.shop = shop;
  }

  async fetchBundles(productId) {
    console.log('🔍 Bundle API: Fetching bundles for:', { shop: this.shop, productId });
    
    try {
      const encodedProductId = encodeURIComponent(productId);
      const apiUrl = `/apps/bundle-selector/api/bundles/product/${encodedProductId}?shop=${this.shop}`;
      
      console.log('🌐 Bundle API: Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('📡 Bundle API: API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Bundle API: API response data:', data);
      
      if (data.success && data.bundles) {
        const activeBundles = data.bundles.filter(bundle => bundle.isActive);
        console.log(`✅ Bundle API: Found ${activeBundles.length} active bundles`);
        return activeBundles;
      } else {
        console.log('⚠️ Bundle API: No bundles found or API error:', data);
        return [];
      }
    } catch (error) {
      console.error('❌ Bundle API: Error fetching bundles:', error);
      return [];
    }
  }

  async fetchProductDetails(productIds) {
    if (!productIds || productIds.length === 0) return {};
    
    console.log('🔍 Bundle API: Fetching product details for:', productIds);
    
    const productDetails = {};
    const batchSize = 5; // Process in batches to avoid rate limiting
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      try {
        const promises = batch.map(productId => this.fetchSingleProduct(productId));
        const results = await Promise.all(promises);
        
        results.forEach((result, index) => {
          if (result) {
            productDetails[batch[index]] = result;
          }
        });
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < productIds.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error('❌ Bundle API: Error fetching product batch:', error);
      }
    }
    
    console.log('✅ Bundle API: Fetched product details for', Object.keys(productDetails).length, 'products');
    return productDetails;
  }

  async fetchSingleProduct(productId) {
    try {
      const response = await fetch(`/products/${productId}.js`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Bundle API: Error fetching product ${productId}:`, error);
      return null;
    }
  }
}

// Bundle DOM Module
class BundleDOM {
  constructor() {
    this.containers = {
      bundleSelector: null,
      loading: null,
      empty: null,
      bundles: null
    };
  }

  initialize() {
    console.log('🔧 Bundle DOM: Initializing...');
    
    // Cache DOM elements
    this.containers.bundleSelector = document.getElementById('bundle-selector-container');
    this.containers.loading = document.getElementById('bundle-selector-loading');
    this.containers.empty = document.getElementById('bundle-selector-empty');
    this.containers.bundles = document.getElementById('bundle-selector-bundles');
    
    if (!this.containers.bundleSelector) {
      console.error('❌ Bundle DOM: Bundle selector container not found');
      return false;
    }
    
    console.log('✅ Bundle DOM: Initialized successfully');
    return true;
  }

  showLoading() {
    if (this.containers.loading) {
      this.containers.loading.style.display = 'block';
    }
    if (this.containers.bundleSelector) {
      this.containers.bundleSelector.style.display = 'none';
    }
    if (this.containers.empty) {
      this.containers.empty.style.display = 'none';
    }
  }

  hideLoading() {
    if (this.containers.loading) {
      this.containers.loading.style.display = 'none';
    }
  }

  showEmpty() {
    if (this.containers.empty) {
      this.containers.empty.style.display = 'block';
    }
    if (this.containers.bundleSelector) {
      this.containers.bundleSelector.style.display = 'none';
    }
    this.hideLoading();
  }

  showBundles() {
    if (this.containers.bundleSelector) {
      this.containers.bundleSelector.style.display = 'block';
    }
    this.hideLoading();
    if (this.containers.empty) {
      this.containers.empty.style.display = 'none';
    }
  }

  renderBundles(bundles, productDetails) {
    if (!this.containers.bundles) return;
    
    console.log('🎨 Bundle DOM: Rendering bundles:', bundles.length);
    
    this.containers.bundles.innerHTML = '';
    
    bundles.forEach(bundle => {
      const bundleElement = this.createBundleElement(bundle, productDetails);
      this.containers.bundles.appendChild(bundleElement);
    });
  }

  createBundleElement(bundle, productDetails) {
    const bundleDiv = document.createElement('div');
    bundleDiv.className = 'bundle-item';
    bundleDiv.dataset.bundleId = bundle.id;
    
    const targetProduct = productDetails[bundle.targetProduct?.productId];
    const bundleImage = targetProduct?.featured_image || bundle.imageUrl || '/assets/no-image.png';
    const bundleTitle = bundle.title || 'Bundle';
    const bundleDescription = bundle.description || '';
    
    // Calculate pricing
    const originalPrice = this.calculateOriginalPrice(bundle, productDetails);
    const discountedPrice = this.calculateDiscountedPrice(bundle, originalPrice);
    const savings = originalPrice - discountedPrice;
    const savingsPercent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
    
    bundleDiv.innerHTML = `
      <div class="bundle-header" onclick="window.bundleSelector.toggleBundle('${bundle.id}')">
        <div class="bundle-info">
          <div class="bundle-image">
            <img src="${bundleImage}" alt="${bundleTitle}" onerror="this.src='/assets/no-image.png'">
          </div>
          <div class="bundle-details">
            <h4 class="bundle-title">${bundleTitle}</h4>
            ${bundleDescription ? `<p class="bundle-description">${bundleDescription}</p>` : ''}
            <div class="bundle-pricing">
              ${originalPrice > discountedPrice ? `<span class="bundle-original-price">$${(originalPrice / 100).toFixed(2)}</span>` : ''}
              <span class="bundle-discounted-price">$${(discountedPrice / 100).toFixed(2)}</span>
              ${savings > 0 ? `<span class="bundle-savings">Save ${savingsPercent}%</span>` : ''}
            </div>
          </div>
        </div>
        <div class="bundle-toggle">
          <span class="bundle-toggle-icon">▼</span>
        </div>
      </div>
      <div class="bundle-products" style="display: none;">
        <div class="bundle-products-header">
          <h5>Bundle Contents:</h5>
        </div>
        <div class="bundle-products-list">
          ${this.renderBundleProducts(bundle, productDetails)}
        </div>
        <div class="bundle-selection">
          <button class="bundle-select-btn" onclick="window.bundleSelector.selectBundle('${bundle.id}')">
            Select Bundle
          </button>
        </div>
      </div>
    `;
    
    return bundleDiv;
  }

  renderBundleProducts(bundle, productDetails) {
    if (!bundle.bundleProducts || bundle.bundleProducts.length === 0) {
      return '<p>No products in this bundle.</p>';
    }
    
    return bundle.bundleProducts.map(bundleProduct => {
      const product = productDetails[bundleProduct.productId];
      const productImage = product?.featured_image || '/assets/no-image.png';
      const productTitle = product?.title || `Product ${bundleProduct.productId}`;
      const productPrice = product?.price ? (product.price / 100).toFixed(2) : '0.00';
      
      return `
        <div class="bundle-product">
          <img src="${productImage}" alt="${productTitle}" onerror="this.src='/assets/no-image.png'">
          <div class="bundle-product-title">${productTitle}</div>
          <div class="bundle-product-quantity">Qty: ${bundleProduct.quantity}</div>
          <div class="bundle-product-price">$${productPrice}</div>
        </div>
      `;
    }).join('');
  }

  calculateOriginalPrice(bundle, productDetails) {
    if (!bundle.bundleProducts) return 0;
    
    return bundle.bundleProducts.reduce((total, bundleProduct) => {
      const product = productDetails[bundleProduct.productId];
      const productPrice = product?.price || 0;
      return total + (productPrice * bundleProduct.quantity);
    }, 0);
  }

  calculateDiscountedPrice(bundle, originalPrice) {
    if (bundle.discountType === 'percentage' && bundle.discountValue) {
      const discount = (originalPrice * bundle.discountValue) / 100;
      return Math.max(0, originalPrice - discount);
    } else if (bundle.discountType === 'fixed' && bundle.discountValue) {
      return Math.max(0, originalPrice - (bundle.discountValue * 100));
    }
    return originalPrice;
  }

  toggleBundle(bundleId) {
    const bundleElement = document.querySelector(`[data-bundle-id="${bundleId}"]`);
    if (!bundleElement) return;
    
    const productsSection = bundleElement.querySelector('.bundle-products');
    const toggleIcon = bundleElement.querySelector('.bundle-toggle-icon');
    
    if (productsSection.style.display === 'none') {
      productsSection.style.display = 'block';
      toggleIcon.textContent = '▲';
      bundleElement.classList.add('bundle-expanded');
    } else {
      productsSection.style.display = 'none';
      toggleIcon.textContent = '▼';
      bundleElement.classList.remove('bundle-expanded');
    }
  }

  selectBundle(bundleId) {
    // Remove previous selection
    document.querySelectorAll('.bundle-item').forEach(item => {
      item.classList.remove('bundle-selected');
    });
    
    // Add selection to current bundle
    const bundleElement = document.querySelector(`[data-bundle-id="${bundleId}"]`);
    if (bundleElement) {
      bundleElement.classList.add('bundle-selected');
    }
    
    // Update button text
    const button = bundleElement?.querySelector('.bundle-select-btn');
    if (button) {
      button.textContent = 'Bundle Selected';
      button.classList.add('bundle-selected-btn');
    }
    
    console.log('✅ Bundle DOM: Bundle selected:', bundleId);
  }
}

// Main Bundle Selector Class
class BundleSelector {
  constructor() {
    this.bundles = [];
    this.selectedBundle = null;
    this.shop = this.getShopFromUrl();
    this.productId = this.getProductId();
    
    // Initialize modules
    this.api = new BundleAPI(this.shop);
    this.dom = new BundleDOM();
    
    console.log('🔍 Bundle Selector initialized:', {
      shop: this.shop,
      productId: this.productId
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

  async setup() {
    console.log('🔧 Bundle Selector: Setting up...');
    
    // Initialize DOM
    if (!this.dom.initialize()) {
      console.error('❌ Bundle Selector: Failed to initialize DOM');
      return;
    }
    
    // Show loading state
    this.dom.showLoading();
    
    // Fetch and display bundles
    await this.fetchAndDisplayBundles();
  }

  async fetchAndDisplayBundles() {
    console.log('🔄 Bundle Selector: Starting fetch and display process');
    
    try {
      // Fetch bundles
      this.bundles = await this.api.fetchBundles(this.productId);
      
      if (this.bundles.length === 0) {
        console.log('⚠️ Bundle Selector: No bundles found');
        this.dom.showEmpty();
        return;
      }
      
      // Extract product IDs for fetching details
      const productIds = this.extractProductIds(this.bundles);
      
      // Fetch product details
      const productDetails = await this.api.fetchProductDetails(productIds);
      
      // Display bundles
      this.dom.showBundles();
      this.dom.renderBundles(this.bundles, productDetails);
      
      console.log('✅ Bundle Selector: Successfully displayed bundles');
      
    } catch (error) {
      console.error('❌ Bundle Selector: Error in fetch and display:', error);
      this.dom.showEmpty();
    }
  }

  extractProductIds(bundles) {
    const productIds = new Set();
    
    bundles.forEach(bundle => {
      // Add target product ID
      if (bundle.targetProduct?.productId) {
        productIds.add(bundle.targetProduct.productId);
      }
      
      // Add bundle product IDs
      if (bundle.bundleProducts) {
        bundle.bundleProducts.forEach(bundleProduct => {
          productIds.add(bundleProduct.productId);
        });
      }
    });
    
    return Array.from(productIds);
  }

  // Public methods for DOM interactions
  toggleBundle(bundleId) {
    this.dom.toggleBundle(bundleId);
  }

  selectBundle(bundleId) {
    this.selectedBundle = this.bundles.find(b => b.id === bundleId);
    this.dom.selectBundle(bundleId);
    
    console.log('✅ Bundle Selector: Bundle selected:', this.selectedBundle);
    
    // TODO: Integrate with cart functionality
    this.handleBundleSelection();
  }

  handleBundleSelection() {
    if (!this.selectedBundle) return;
    
    console.log('🛒 Bundle Selector: Handling bundle selection:', this.selectedBundle);
    
    // TODO: Add bundle products to cart with discounted pricing
    // This would integrate with Shopify's cart API
    alert(`Bundle "${this.selectedBundle.title}" selected! Cart integration coming soon.`);
  }

  // Utility methods
  getShopFromUrl() {
    return window.Shopify?.shop || window.location.hostname;
  }

  getProductId() {
    // Try multiple methods to get product ID
    return this.getProductIdFromUrl() || 
           this.getProductIdFromMeta() || 
           this.getProductIdFromData();
  }

  getProductIdFromUrl() {
    const match = window.location.pathname.match(/\/products\/[^\/]+/);
    if (match) {
      // Extract product handle and convert to ID if needed
      const handle = match[0].split('/').pop();
      return handle;
    }
    return null;
  }

  getProductIdFromMeta() {
    const metaTag = document.querySelector('meta[property="og:url"]');
    if (metaTag) {
      const url = metaTag.getAttribute('content');
      const match = url.match(/\/products\/[^\/]+/);
      if (match) {
        return match[0].split('/').pop();
      }
    }
    return null;
  }

  getProductIdFromData() {
    // Look for product data in various places
    const productData = window.product || 
                       window.Product || 
                       document.querySelector('[data-product-json]')?.textContent;
    
    if (productData) {
      try {
        const product = typeof productData === 'string' ? JSON.parse(productData) : productData;
        return product.id || product.handle;
      } catch (e) {
        console.error('Error parsing product data:', e);
      }
    }
    return null;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.bundleSelector = new BundleSelector();
  });
} else {
  window.bundleSelector = new BundleSelector();
} 