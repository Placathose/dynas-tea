# Bundle Selector Theme App Extension

This theme app extension automatically adds a bundle selector to product pages by finding the "Add to Cart" button and inserting bundles above it. **No manual theme editing required!**

## Features

- **Automatic Placement**: JavaScript automatically finds the "Add to Cart" button and inserts bundles above it
- **No Manual Setup**: Works out of the box without editing theme files
- **Smart Detection**: Finds Add to Cart buttons using multiple selectors for compatibility
- **Fallback Placement**: If Add to Cart button isn't found, uses alternative placement methods
- **Customizable Settings**: Title, loading text, empty state text, and styling options
- **Automatic Bundle Detection**: Shows bundles that include the current product
- **Responsive Design**: Works on all device sizes
- **Loading States**: Smooth loading and empty state handling

## Installation

### For Merchants

1. **Install the App**: Install the Bundle App from the Shopify App Store
2. **Add to Theme**: 
   - Go to **Online Store** → **Themes**
   - Click **Customize** on your active theme
   - Navigate to a **Product page**
   - Click **Add section**
   - Look for **"Bundle Selector"** in the sections list
   - Click to add it to your product page
   - The bundle selector will automatically appear above the Add to Cart button
   - Click **Save**

### How It Works

1. **Automatic Detection**: The extension automatically detects when you're on a product page
2. **Button Finding**: JavaScript searches for the "Add to Cart" button using multiple selectors
3. **Smart Insertion**: Inserts the bundle selector above the Add to Cart button
4. **Bundle Loading**: Fetches and displays available bundles for the current product
5. **Fallback**: If Add to Cart button isn't found, uses alternative placement methods

### Customization Options

Once added, merchants can customize:

- **Title**: Change the main heading text
- **Loading Text**: Customize the loading message
- **Empty Text**: Customize the message when no bundles are available
- **Background Color**: Choose the background color
- **Border Color**: Choose the border color
- **Border Radius**: Adjust the corner roundness

## Technical Details

- **Target**: Product pages only (`template == 'product'`)
- **Automatic Placement**: Finds Add to Cart button using multiple selectors
- **Fallback Methods**: Alternative placement if primary method fails
- **Assets**: Automatically loads required CSS and JavaScript
- **Performance**: Uses deferred script loading for better page performance
- **Styling**: Includes responsive CSS with customizable theme settings

## Add to Cart Button Detection

The extension looks for Add to Cart buttons using these selectors (in order):
1. `button[name="add"]`
2. `input[name="add"]`
3. `button[type="submit"]`
4. `.product-form__submit`
5. `.btn--add-to-cart`
6. `.add-to-cart`
7. `[data-add-to-cart]`
8. `.product__form .btn`
9. `.product-form button[type="submit"]`
10. `form[action*="/cart/add"] button[type="submit"]`

## Fallback Placement

If no Add to Cart button is found, the extension tries these fallback locations:
1. `.product__info`
2. `.product-single__info`
3. `.product-details`
4. `.product-form`
5. `.product__form`
6. `.product-single__form`
7. `.product__content`
8. `.product-single__content`

## Development

This extension is part of the Bundle App and is automatically deployed when the app is updated.

## Support

For support, contact the app developer or refer to the app's documentation. 