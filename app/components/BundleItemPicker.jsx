import { useState, useCallback } from "react";
import {
  Button,
  BlockStack,
  InlineStack,
  Text,
  Thumbnail,
} from "@shopify/polaris";

export default function BundleItemPicker({ onProductsSelected, existingProductIds = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const handleConfirm = useCallback(() => {
    if (selectedProducts.length > 0) {
      onProductsSelected(selectedProducts);
      setSelectedProducts([]);
      setIsOpen(false);
    }
  }, [selectedProducts, onProductsSelected]);

  const handleCancel = useCallback(() => {
    setSelectedProducts([]);
    setIsOpen(false);
  }, []);

  const handleSelectAll = useCallback(() => {
    // This would need to be implemented based on the current ResourcePicker selection
    // For now, we'll rely on the ResourcePicker's built-in selection
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const openResourcePicker = useCallback(async () => {
    try {
      console.log("Opening resource picker for multiple products...");
      
      // Use multiple selection to allow up to 3 products
      const products = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
        multiple: true,
        max: 3,
      });

      if (products && products.length > 0) {
        // Process all selected products
        const formattedProducts = products.map((product) => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          image: product.images?.[0]?.originalSrc || product.images?.[0]?.src || product.images?.[0]?.url || "",
          alt: product.images?.[0]?.altText || product.images?.[0]?.alt || "",
          price: product.variants?.[0]?.price || "0",
          variantId: product.variants?.[0]?.id || "",
        }));

        // Filter out products that are already selected or in the bundle
        const newProducts = formattedProducts.filter(
          (product) => !selectedProducts.some(p => p.id === product.id) && 
                      !existingProductIds.includes(product.id)
        );

        if (newProducts.length > 0) {
          setSelectedProducts(prev => [...prev, ...newProducts]);
        }
      }
    } catch (error) {
      console.error("Error selecting products:", error);
    }
  }, [selectedProducts, existingProductIds]);

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} primary>
        Add Bundle Items
      </Button>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "24px",
        maxWidth: "600px",
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <Text variant="headingLg" as="h2">Select Bundle Items</Text>
          <button
            onClick={handleCancel}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <BlockStack gap="400">
          <Text variant="bodyMd" as="p">
            Select products to add to your bundle. You can select up to 3 products at once.
          </Text>

          {existingProductIds.length > 0 && (
            <div style={{
              border: "1px solid #e1e3e5",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "#f6f6f7"
            }}>
              <Text variant="bodyMd" as="p" color="subdued">
                Note: Products already in your bundle are automatically filtered out.
              </Text>
            </div>
          )}

          <Button 
            onClick={openResourcePicker} 
            primary
            disabled={selectedProducts.length >= 3}
          >
            Select Products ({selectedProducts.length}/3)
          </Button>

          {selectedProducts.length > 0 && (
            <div style={{
              border: "1px solid #e1e3e5",
              borderRadius: "8px",
              padding: "16px",
              backgroundColor: "white"
            }}>
              <BlockStack gap="300">
                <InlineStack distribution="equalSpacing" align="center">
                  <Text variant="headingMd" as="h3">
                    Selected Products ({selectedProducts.length})
                  </Text>
                  <InlineStack gap="200">
                    <Button onClick={handleSelectAll} size="slim">
                      Select All
                    </Button>
                    <Button onClick={handleClearAll} size="slim" destructive>
                      Clear All
                    </Button>
                  </InlineStack>
                </InlineStack>

                <BlockStack gap="300">
                  {selectedProducts.map((product) => (
                    <div key={product.id} style={{
                      border: "1px solid #e1e3e5",
                      borderRadius: "8px",
                      padding: "16px",
                      backgroundColor: "white"
                    }}>
                      <InlineStack align="center">
                        <Thumbnail
                          source={product.image}
                          alt={product.alt}
                          size="small"
                        />
                        <BlockStack gap="100">
                          <Text variant="bodyMd" as="p" fontWeight="bold">
                            {product.title}
                          </Text>
                          <Text variant="bodySm" as="p" color="subdued">
                            ${product.price}
                          </Text>
                        </BlockStack>
                        <div style={{
                          backgroundColor: "#50b83c",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px"
                        }}>
                          Selected
                        </div>
                      </InlineStack>
                    </div>
                  ))}
                </BlockStack>

                <div style={{
                  border: "1px solid #e1e3e5",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "white"
                }}>
                  <InlineStack distribution="equalSpacing" align="center">
                    <Text variant="headingMd" as="h3">
                      Total Value
                    </Text>
                    <Text variant="headingMd" as="h3" fontWeight="bold">
                      ${selectedProducts
                        .reduce((sum, product) => sum + parseFloat(product.price), 0)
                        .toFixed(2)}
                    </Text>
                  </InlineStack>
                </div>
              </BlockStack>
            </div>
          )}
        </BlockStack>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          marginTop: "24px"
        }}>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            primary
            disabled={selectedProducts.length === 0}
          >
            Add {selectedProducts.length} Products
          </Button>
        </div>
      </div>
    </div>
  );
} 