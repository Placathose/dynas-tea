import { Button, InlineStack, Thumbnail, BlockStack, Text } from "@shopify/polaris";

export default function ProductPicker({ 
  selectedProduct, 
  onProductSelect, 
  label = "Product",
  size = "medium" 
}) {
  const selectProduct = async () => {
    try {
      const product = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
      });

      if (product) {
        const { id, title, handle, images, variants } = product[0];
        
        // Try different possible image paths
        let productImage = "";
        let productAlt = "";
        
        if (images && images.length > 0) {
          productImage = images[0].originalSrc || images[0].src || images[0].url || images[0].image?.url || "";
          productAlt = images[0].altText || images[0].alt || images[0].image?.altText || "";
        }
        
        const productData = {
          productId: id,
          productTitle: title,
          productHandle: handle,
          productImage: productImage,
          productAlt: productAlt,
          productVariantId: variants?.[0]?.id || "",
          price: variants?.[0]?.price || "0",
        };
        
        console.log("ProductPicker - Selected product data:", productData);
        
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
      price: "0",
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
      </div>
    </BlockStack>
  );
} 