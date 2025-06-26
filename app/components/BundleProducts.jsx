import React, { useState } from "react";
import {
  Card,
  Button,
  TextField,
  InlineStack,
  Text,
  Thumbnail,
  BlockStack,
  InlineError,
} from "@shopify/polaris";
import ProductPicker from "./ProductPicker";

export default function BundleProducts({ 
  bundleProducts = [], 
  onBundleProductsChange,
  label = "Bundle Products"
}) {
  const [products, setProducts] = useState(
    bundleProducts.map(bp => ({
      id: bp.id || `temp-${Date.now()}-${Math.random()}`,
      productId: bp.productId || "",
      quantity: bp.quantity || 1,
      product: bp.product || null,
      error: bp.error || null
    }))
  );

  const handleAddProduct = () => {
    const newProduct = {
      id: `temp-${Date.now()}-${Math.random()}`,
      productId: "",
      quantity: 1,
      product: null,
      error: null
    };
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    onBundleProductsChange(updatedProducts);
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    onBundleProductsChange(updatedProducts);
  };

  const handleProductSelect = (index, productData) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      productId: productData.productId,
      product: productData,
      error: null
    };
    setProducts(updatedProducts);
    onBundleProductsChange(updatedProducts);
  };

  const handleQuantityChange = (index, value) => {
    const quantity = parseInt(value) || 1;
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      quantity: Math.max(1, quantity)
    };
    setProducts(updatedProducts);
    onBundleProductsChange(updatedProducts);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingMd">
            {label}
          </Text>
          <Button
            onClick={handleAddProduct}
            variant="tertiary"
          >
            Add Product
          </Button>
        </InlineStack>

        {products.length === 0 ? (
          <Text as="p" variant="bodyMd" color="subdued">
            No products added to this bundle yet. Click "Add Product" to get started.
          </Text>
        ) : (
          <BlockStack gap="400">
            {products.map((product, index) => (
              <Card key={product.id} padding="400">
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h4" variant="headingSm">
                      Product {index + 1}
                    </Text>
                    <Button
                      onClick={() => handleRemoveProduct(index)}
                      variant="tertiary"
                      tone="critical"
                    >
                      Remove
                    </Button>
                  </InlineStack>

                  <ProductPicker
                    selectedProduct={product.product || {}}
                    onProductSelect={(productData) => handleProductSelect(index, productData)}
                    label="Select Product"
                  />

                  <TextField
                    label="Quantity"
                    type="number"
                    value={product.quantity.toString()}
                    onChange={(value) => handleQuantityChange(index, value)}
                    min="1"
                    autoComplete="off"
                  />

                  {product.product && (
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail
                        source={product.product.productImage || "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"}
                        alt={product.product.productTitle || "Product"}
                        size="small"
                      />
                      <BlockStack gap="100">
                        <Text as="p" variant="bodyMd" fontWeight="medium">
                          {product.product.productTitle}
                        </Text>
                        {product.product.productPrice && (
                          <Text as="p" variant="bodyMd" color="subdued">
                            ${product.product.productPrice}
                          </Text>
                        )}
                      </BlockStack>
                    </InlineStack>
                  )}

                  {product.error && (
                    <InlineError message={product.error} />
                  )}
                </BlockStack>
              </Card>
            ))}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
} 