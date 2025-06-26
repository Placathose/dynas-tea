# Bundle Selector - Theme App Extension

A Shopify theme app extension that displays available product bundles on product pages, allowing customers to select and purchase bundles with discounted pricing.

## Features

- **App Block Integration**: Seamlessly integrates with Shopify themes using app blocks
- **Modular Architecture**: Clean, maintainable code split into focused modules
- **Internationalization**: Full locale support for multi-language stores
- **Responsive Design**: Works across all device sizes and theme layouts
- **Performance Optimized**: Efficient asset loading and minimal bundle size
- **Shopify Standards Compliant**: Follows Shopify's theme app extension best practices

## File Structure

```
theme-app-extension/
├── assets/
│   ├── bundle-selector.css      # Main stylesheet
│   ├── bundle-api.js           # API handling module
│   ├── bundle-dom.js           # DOM manipulation module
│   └── bundle-selector.js      # Main coordination module
├── blocks/
│   └── bundle-selector.liquid  # App block template
├── locales/
│   ├── en.default.json         # Customer-facing translations
│   └── en.default.schema.json  # Merchant-facing translations
├── shopify.theme.extension.toml
└── README.md
```

## Installation

### 1. Deploy the Extension

```bash
shopify app deploy
```

### 2. Install the App

1. Go to your Shopify admin
2. Navigate to **Apps** > **Develop apps**
3. Install the Bundle Selector app
4. Enable the theme app extension

### 3. Add to Your Theme

1. Go to **Online Store** > **Themes**
2. Click **Customize** on your active theme
3. Navigate to a **Product page**
4. Click **Add section** or **Add block**
5. Find **Bundle Selector** in the apps list
6. Add it to your desired location
7. Configure the settings as needed
8. Click **Save**

## Configuration

### Block Settings

- **Title**: Custom title for the bundle selector (default: "Available Bundles")
- **Loading Text**: Text shown while loading bundles
- **Empty State Text**: Text shown when no bundles are available
- **Background Color**: Custom background color
- **Border Color**: Custom border color
- **Border Radius**: Custom border radius (0-20px)

### Styling

The extension uses CSS custom properties and follows Shopify's design system. All styles are contained in `bundle-selector.css` and can be customized through the theme editor.

## Architecture

### Modular Design

The extension is built with a modular architecture for maintainability:

- **BundleAPI**: Handles all API calls and data fetching
- **BundleDOM**: Manages DOM manipulation and UI interactions
- **BundleSelector**: Main coordinator that ties everything together

### Asset Loading

Assets are loaded using Shopify's schema-based loading system:
- CSS and JS files are automatically optimized and cached
- Multiple JS files are loaded in the correct order
- No manual script or stylesheet tags needed

### Internationalization

Full locale support with:
- Customer-facing translations in `en.default.json`
- Merchant-facing translations in `en.default.schema.json`
- Fallback translations in JavaScript for offline support

## Development

### Adding New Features

1. **New API endpoints**: Add to `bundle-api.js`
2. **New UI components**: Add to `bundle-dom.js`
3. **New functionality**: Add to `bundle-selector.js`
4. **New styles**: Add to `bundle-selector.css`
5. **New translations**: Add to locale files

### Testing

1. Deploy the extension: `shopify app deploy`
2. Test on a product page with bundles
3. Verify all functionality works as expected
4. Check responsive design on different screen sizes

## Troubleshooting

### Bundle Selector Not Appearing

1. Ensure the app is installed and enabled
2. Check that the block is added to the product page
3. Verify the product has associated bundles
4. Check browser console for JavaScript errors

### Styling Issues

1. Check if CSS is loading properly
2. Verify theme compatibility
3. Test with different themes
4. Check for CSS conflicts

### API Errors

1. Verify the app is properly installed
2. Check network requests in browser dev tools
3. Ensure bundles exist for the current product
4. Check server logs for backend errors

## Performance

- **Asset Size**: Total JS < 10KB, CSS < 100KB
- **Loading**: Assets loaded only on product pages
- **Caching**: All assets cached by Shopify CDN
- **Rate Limiting**: API calls include delays to avoid rate limits

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This extension is part of the Bundle Selector app and follows Shopify's app development guidelines. 