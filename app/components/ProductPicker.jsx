import { Button, InlineStack, Thumbnail, BlockStack, Text } from "@shopify/polaris";

export default function ProductPicker({ 
  selectedProduct, 
  onProductSelect, 
  label = "Product",
  size = "medium" 
}) {
  // Debug logging
  console.log("ProductPicker - selectedProduct:", selectedProduct);
  console.log("ProductPicker - productImage:", selectedProduct?.productImage);
  console.log("ProductPicker - productId:", selectedProduct?.productId);

  const selectProduct = async () => {
    try {
      const product = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
      });

      if (product) {
        console.log("Full resource picker response:", product);
        console.log("First product object:", product[0]);
        
        const { id, title, handle, images, variants } = product[0];
        console.log("Resource picker product data:", product[0]);
        console.log("Images from resource picker:", images);
        console.log("Image structure:", images?.[0]);
        
        // Try different possible image paths
        let productImage = "";
        let productAlt = "";
        
        if (images && images.length > 0) {
          productImage = images[0].originalSrc || images[0].src || images[0].url || images[0].image?.url || "";
          productAlt = images[0].altText || images[0].alt || images[0].image?.altText || "";
        }
        
        console.log("Extracted productImage:", productImage);
        console.log("Extracted productAlt:", productAlt);
        
        const productData = {
          productId: id,
          productTitle: title,
          productHandle: handle,
          productImage: productImage,
          productAlt: productAlt,
          productVariantId: variants?.[0]?.id || "",
        };
        
        console.log("Processed product data:", productData);
        onProductSelect(productData);
      }
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  const clearProduct = () => {
    onProductSelect({
      productId: "",
      productTitle: "",
      productHandle: "",
      productImage: "",
      productAlt: "",
      productVariantId: "",
    });
  };

  return (
    <BlockStack gap="400">
      <div>
        <div style={{ marginBottom: "8px" }}>
          <strong>{label}</strong>
          <span style={{ color: "red" }}> *</span>
        </div>
        
        {selectedProduct?.productId ? (
          <InlineStack gap="400" align="start">
            <Thumbnail
              source={selectedProduct.productImage || ""}
              alt={selectedProduct.productAlt || "Product image"}
              size={size}
            />
            <BlockStack gap="200">
              <div>
                <strong>{selectedProduct.productTitle}</strong>
                <Text variant="bodySm" color="subdued">
                  {selectedProduct.productHandle}
                </Text>
              </div>
              <InlineStack gap="200">
                <Button onClick={selectProduct} variant="secondary" size="slim">
                  Change product
                </Button>
                <Button onClick={clearProduct} variant="plain" size="slim" tone="critical">
                  Remove
                </Button>
              </InlineStack>
            </BlockStack>
          </InlineStack>
        ) : (
          <Button onClick={selectProduct} variant="secondary">
            Select {label.toLowerCase()}
          </Button>
        )}
        
        {/* Debug info */}
        {selectedProduct?.productId && (
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            <div>Debug - Product ID: {selectedProduct.productId}</div>
            <div>Debug - Product Image: {selectedProduct.productImage || 'NO IMAGE'}</div>
            <div>Debug - Product Alt: {selectedProduct.productAlt || 'NO ALT'}</div>
          </div>
        )}
      </div>
    </BlockStack>
  );
} 