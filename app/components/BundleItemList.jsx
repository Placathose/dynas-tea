import { useState, useCallback } from "react";
import {
  Button,
  BlockStack,
  InlineStack,
  Text,
} from "@shopify/polaris";

export default function BundleItemList({ 
  bundleItems, 
  onQuantityChange, 
  onRemoveItem, 
  targetProductPrice = 0 
}) {
  const [quantities, setQuantities] = useState(
    bundleItems.reduce((acc, item) => {
      acc[item.id] = item.quantity || 1;
      return acc;
    }, {})
  );

  const handleQuantityChange = useCallback((productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
    onQuantityChange(productId, quantity);
  }, [onQuantityChange]);

  const handleRemoveItem = useCallback((productId) => {
    onRemoveItem(productId);
    setQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });
  }, [onRemoveItem]);

  const calculateItemTotal = (item) => {
    const quantity = quantities[item.id] || 1;
    return parseFloat(item.price) * quantity;
  };

  const calculateBundleTotal = () => {
    const itemsTotal = bundleItems.reduce((sum, item) => {
      return sum + calculateItemTotal(item);
    }, 0);
    return itemsTotal + parseFloat(targetProductPrice);
  };

  if (bundleItems.length === 0) {
    return (
      <div style={{
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "white"
      }}>
        <InlineStack align="center" distribution="center">
          <Text variant="bodyMd" as="p" color="subdued">
            No bundle items added yet. Click "Add Bundle Items" to get started.
          </Text>
        </InlineStack>
      </div>
    );
  }

  return (
    <BlockStack gap="400">
      <div style={{
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "white"
      }}>
        <InlineStack distribution="equalSpacing" align="center">
          <Text variant="headingMd" as="h3">
            Bundle Items ({bundleItems.length})
          </Text>
          <Text variant="bodySm" as="span" color="subdued">
            {bundleItems.length} item{bundleItems.length !== 1 ? 's' : ''}
          </Text>
        </InlineStack>
      </div>

      <BlockStack gap="300">
        {bundleItems.map((item, index) => (
          <div key={item.id} style={{
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "white"
          }}>
            <InlineStack align="center" distribution="equalSpacing">
              <BlockStack gap="100">
                <Text variant="bodyMd" as="p" fontWeight="bold">
                  {item.title}
                </Text>
                <Text variant="bodySm" as="p" color="subdued">
                  ${parseFloat(item.price).toFixed(2)} each
                </Text>
              </BlockStack>

              <InlineStack align="center" gap="200">
                <Text variant="bodyMd" as="p">
                  Quantity:
                </Text>
                <select
                  value={String(quantities[item.id] || 1)}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </InlineStack>

              <BlockStack gap="100" align="end">
                <Text variant="bodyMd" as="p" fontWeight="bold">
                  ${calculateItemTotal(item).toFixed(2)}
                </Text>
                <Text variant="bodySm" as="p" color="subdued">
                  ({quantities[item.id] || 1} × ${parseFloat(item.price).toFixed(2)})
                </Text>
              </BlockStack>

              <Button
                onClick={() => handleRemoveItem(item.id)}
                destructive
                size="slim"
              >
                Remove
              </Button>
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
        <BlockStack gap="300">
          {/* Visual separator */}
          <div style={{ 
            height: "1px", 
            backgroundColor: "var(--p-border-subdued)", 
            margin: "8px 0" 
          }} />
          
          <InlineStack distribution="equalSpacing" align="center">
            <Text variant="bodyMd" as="p">
              Target Product:
            </Text>
            <Text variant="bodyMd" as="p" fontWeight="bold">
              ${parseFloat(targetProductPrice).toFixed(2)}
            </Text>
          </InlineStack>

          <InlineStack distribution="equalSpacing" align="center">
            <Text variant="bodyMd" as="p">
              Bundle Items Total:
            </Text>
            <Text variant="bodyMd" as="p" fontWeight="bold">
              ${bundleItems.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(2)}
            </Text>
          </InlineStack>

          {/* Visual separator */}
          <div style={{ 
            height: "1px", 
            backgroundColor: "var(--p-border-subdued)", 
            margin: "8px 0" 
          }} />

          <InlineStack distribution="equalSpacing" align="center">
            <Text variant="headingMd" as="h3">
              Bundle Total:
            </Text>
            <Text variant="headingMd" as="h3" fontWeight="bold">
              ${calculateBundleTotal().toFixed(2)}
            </Text>
          </InlineStack>

          <Text variant="bodySm" as="p" color="subdued" alignment="center">
            Target Product + All Bundle Items
          </Text>
        </BlockStack>
      </div>
    </BlockStack>
  );
} 