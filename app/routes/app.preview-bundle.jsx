import { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  Select,
  Badge,
  InlineStack,
  Thumbnail,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { getBundles } from "../models/Bundle.server";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    const bundles = await getBundles(session.shop, admin.graphql);
    return json({ bundles, shop: session.shop });
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return json({ bundles: [], shop: session.shop });
  }
};

export default function PreviewBundle() {
  const { bundles, shop } = useLoaderData();
  const [selectedVariant, setSelectedVariant] = useState('1');
  const [quantity, setQuantity] = useState(1);

  // Simulate product data
  const sampleProduct = {
    title: "Organic Green Tea Blend",
    price: "$24.99",
    comparePrice: "$29.99",
    description: "A premium blend of organic green tea leaves, carefully selected and hand-picked from the finest tea gardens.",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    variants: [
      { id: '1', title: '50g Package', price: '$24.99' },
      { id: '2', title: '100g Package', price: '$44.99' },
      { id: '3', title: '250g Package', price: '$99.99' }
    ],
    tags: ['Organic', 'Premium', 'Jasmine']
  };

  const activeBundles = bundles.filter(bundle => bundle.isActive);

  // Create bundle selector component
  useEffect(() => {
    const container = document.getElementById('bundle-selector-preview');
    if (!container || activeBundles.length === 0) return;

    container.innerHTML = `
      <div class="bundle-selector" style="
        margin: 20px 0; 
        padding: 20px; 
        border: 1px solid #ddd; 
        border-radius: 8px; 
        background: #f9f9f9;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #202223;">
          Available Bundles
        </h3>
        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${activeBundles.map(bundle => `
            <div style="
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 15px;
              border: 1px solid #e0e0e0;
              border-radius: 6px;
              background: white;
            ">
              <img src="${bundle.imageUrl || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=60&h=60&fit=crop'}" 
                   alt="${bundle.title}" 
                   style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;" />
              <div style="flex: 1;">
                <h4 style="font-weight: 500; margin: 0 0 5px 0; color: #202223; font-size: 16px;">
                  ${bundle.title}
                </h4>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #6d7175; text-decoration: line-through; font-size: 14px;">
                    $${bundle.originalPrice.toFixed(2)}
                  </span>
                  <span style="color: #d82c0d; font-weight: 600; font-size: 16px;">
                    $${bundle.discountedPrice.toFixed(2)}
                  </span>
                  ${bundle.savingsPercentage > 0 ? `
                    <span style="background: #d82c0d; color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                      Save ${bundle.savingsPercentage}%
                    </span>
                  ` : ''}
                </div>
              </div>
              <button style="
                background: #5c6ac4;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
              " onclick="alert('Bundle \\'${bundle.title}\\' selected!')">
                Select Bundle
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }, [activeBundles]);

  return (
    <Page>
      <TitleBar title="Bundle Selector Preview" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Bundle Selector Preview
                </Text>
                <Text variant="bodyMd" as="p">
                  This page shows exactly how the bundle selector will appear on a real product page.
                </Text>
                
                {activeBundles.length === 0 ? (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    backgroundColor: '#f6f6f7', 
                    borderRadius: '8px',
                    border: '1px dashed #c9cccf'
                  }}>
                    <Text variant="bodyMd" color="subdued">
                      No active bundles found. Create and activate a bundle to see the preview.
                    </Text>
                  </div>
                ) : (
                  <InlineStack gap="200">
                    <Badge tone="success">{activeBundles.length} Active Bundle{activeBundles.length !== 1 ? 's' : ''}</Badge>
                    <Badge tone="info">Preview Mode</Badge>
                  </InlineStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product Page Simulation
                </Text>
                <Text variant="bodyMd" as="p">
                  Below is a realistic simulation of how your product page will look with the bundle selector.
                </Text>
                
                <div style={{ 
                  border: '1px solid #e1e3e5', 
                  borderRadius: '8px', 
                  padding: '24px',
                  backgroundColor: 'white',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  {/* Product Header */}
                  <div style={{ marginBottom: '24px' }}>
                    <InlineStack gap="400" align="start">
                      <div style={{ flex: '0 0 200px' }}>
                        <Thumbnail
                          source={sampleProduct.image}
                          alt={sampleProduct.title}
                          size="large"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text as="h1" variant="headingLg" style={{ marginBottom: '8px' }}>
                          {sampleProduct.title}
                        </Text>
                        <InlineStack gap="200" align="baseline" style={{ marginBottom: '12px' }}>
                          <Text as="span" variant="headingMd" color="success">
                            {sampleProduct.price}
                          </Text>
                          <Text as="span" variant="bodyMd" color="subdued" style={{ textDecoration: 'line-through' }}>
                            {sampleProduct.comparePrice}
                          </Text>
                        </InlineStack>
                        <InlineStack gap="200" style={{ marginBottom: '16px' }}>
                          {sampleProduct.tags.map(tag => (
                            <Badge key={tag} tone="info">{tag}</Badge>
                          ))}
                        </InlineStack>
                      </div>
                    </InlineStack>
                  </div>

                  <Divider />

                  {/* Product Description */}
                  <div style={{ marginBottom: '24px' }}>
                    <Text as="h3" variant="headingMd" style={{ marginBottom: '12px' }}>
                      Description
                    </Text>
                    <Text variant="bodyMd" as="p" style={{ lineHeight: '1.6', color: '#6d7175' }}>
                      {sampleProduct.description}
                    </Text>
                  </div>

                  <Divider />

                  {/* Product Options */}
                  <div style={{ marginBottom: '24px' }}>
                    <Text as="h3" variant="headingMd" style={{ marginBottom: '12px' }}>
                      Product Options
                    </Text>
                    <BlockStack gap="300">
                      <div>
                        <Text as="label" variant="bodyMd" fontWeight="medium" style={{ display: 'block', marginBottom: '8px' }}>
                          Size
                        </Text>
                        <Select
                          options={sampleProduct.variants.map(v => ({ label: v.title, value: v.id }))}
                          value={selectedVariant}
                          onChange={setSelectedVariant}
                        />
                      </div>
                      <div>
                        <Text as="label" variant="bodyMd" fontWeight="medium" style={{ display: 'block', marginBottom: '8px' }}>
                          Quantity
                        </Text>
                        <Select
                          options={[
                            { label: '1', value: '1' },
                            { label: '2', value: '2' },
                            { label: '3', value: '3' },
                            { label: '4', value: '4' },
                            { label: '5', value: '5' }
                          ]}
                          value={quantity.toString()}
                          onChange={(value) => setQuantity(parseInt(value))}
                        />
                      </div>
                    </BlockStack>
                  </div>

                  <Divider />

                  {/* Bundle Selector */}
                  <div id="bundle-selector-preview">
                    {activeBundles.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px', 
                        color: '#6d7175',
                        fontStyle: 'italic'
                      }}>
                        Bundle Selector Component will appear here when bundles are active
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <div style={{ marginTop: '24px' }}>
                    <Button variant="primary" size="large" fullWidth>
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
} 