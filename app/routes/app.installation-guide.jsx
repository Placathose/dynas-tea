import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  List,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export default function InstallationGuide() {
  const { shop } = useLoaderData();

  return (
    <Page>
      <TitleBar title="Installation Guide" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Bundle Selector Installation Guide
                </Text>
                <Text variant="bodyMd" as="p">
                  Follow these steps to add the bundle selector to your product pages.
                </Text>
                
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Step 1: Access Your Theme Customizer
                  </Text>
                  <List type="number">
                    <List.Item>Go to your Shopify admin</List.Item>
                    <List.Item>Navigate to Online Store → Themes</List.Item>
                    <List.Item>Click "Customize" on your active theme</List.Item>
                  </List>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Step 2: Add the Bundle Selector
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Important:</strong> The bundle selector is a snippet, not a section, so it won't appear in the "Add section" list. You need to add it manually to your theme files.
                  </Text>
                  
                  <List type="number">
                    <List.Item>Go to Online Store → Themes → Actions → Edit code</List.Item>
                    <List.Item>Find your product template file (usually named product.liquid, product-template.liquid, or similar)</List.Item>
                    <List.Item>Add the snippet code where you want bundles to appear</List.Item>
                    <List.Item>Save the file</List.Item>
                  </List>
                  
                  <Text variant="bodyMd" as="p">
                    <strong>Alternative for Advanced Users:</strong> If you're comfortable with theme development, you can also add the snippet through the theme customizer by editing the product template directly.
                  </Text>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Step 3: Position the Bundle Selector
                  </Text>
                  <Text variant="bodyMd" as="p">
                    You can place the bundle selector anywhere on your product page. Here are some common locations:
                  </Text>
                  
                  <BlockStack gap="200">
                    <InlineStack align="start" gap="200">
                      <Badge tone="success">Recommended</Badge>
                      <Text variant="bodyMd">Above the "Add to Cart" button</Text>
                    </InlineStack>
                    <InlineStack align="start" gap="200">
                      <Badge tone="info">Alternative</Badge>
                      <Text variant="bodyMd">Below the product description</Text>
                    </InlineStack>
                    <InlineStack align="start" gap="200">
                      <Badge tone="info">Alternative</Badge>
                      <Text variant="bodyMd">In the product sidebar</Text>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Manual Installation (Primary Method)
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Since the bundle selector is a snippet, you need to add it manually to your product template:
                  </Text>
                  
                  <pre style={{ 
                    backgroundColor: '#f6f6f7', 
                    padding: '16px', 
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '14px',
                    border: '1px solid #e1e3e5'
                  }}>
                    {`{% render 'bundle-selector' %}`}
                  </pre>
                  
                  <Text variant="bodyMd" as="p">
                    Common placement examples:
                  </Text>
                  
                  <BlockStack gap="200">
                    <div>
                      <Text variant="bodySm" fontWeight="bold">Above Add to Cart:</Text>
                      <pre style={{ 
                        backgroundColor: '#f6f6f7', 
                        padding: '16px', 
                        borderRadius: '8px',
                        overflow: 'auto',
                        fontSize: '14px',
                        border: '1px solid #e1e3e5'
                      }}>
                        {`<div class="product-form">
  {% render 'bundle-selector' %}
  <button type="submit" name="add">Add to Cart</button>
</div>`}
                      </pre>
                    </div>
                    
                    <div>
                      <Text variant="bodySm" fontWeight="bold">Below Description:</Text>
                      <pre style={{ 
                        backgroundColor: '#f6f6f7', 
                        padding: '16px', 
                        borderRadius: '8px',
                        overflow: 'auto',
                        fontSize: '14px',
                        border: '1px solid #e1e3e5'
                      }}>
                        {`<div class="product-description">
  {{ product.description }}
</div>
{% render 'bundle-selector' %}`}
                      </pre>
                    </div>
                  </BlockStack>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Step 4: Test Your Installation
                  </Text>
                  <List type="number">
                    <List.Item>Save your theme changes</List.Item>
                    <List.Item>Visit a product page that has active bundles</List.Item>
                    <List.Item>Verify the bundle selector appears</List.Item>
                    <List.Item>Test expanding/collapsing bundles</List.Item>
                    <List.Item>Test bundle selection</List.Item>
                  </List>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Troubleshooting
                  </Text>
                  
                  <BlockStack gap="200">
                    <div>
                      <Text variant="bodySm" fontWeight="bold">Bundle Selector Not Appearing?</Text>
                      <List>
                        <List.Item>Make sure you have active bundles for the product</List.Item>
                        <List.Item>Check that the snippet is properly added to your theme</List.Item>
                        <List.Item>Verify the app is installed and active</List.Item>
                      </List>
                    </div>
                    
                    <div>
                      <Text variant="bodySm" fontWeight="bold">Styling Issues?</Text>
                      <List>
                        <List.Item>The component uses standard CSS that works with most themes</List.Item>
                        <List.Item>You can customize styles using CSS overrides</List.Item>
                        <List.Item>Check browser console for any JavaScript errors</List.Item>
                      </List>
                    </div>
                  </BlockStack>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    Need Help?
                  </Text>
                  <Text variant="bodyMd" as="p">
                    If you're having trouble with the installation, you can:
                  </Text>
                  <List>
                    <List.Item>Check the browser console for error messages</List.Item>
                    <List.Item>Verify your theme is compatible with theme app extensions</List.Item>
                    <List.Item>Contact support if issues persist</List.Item>
                  </List>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
} 