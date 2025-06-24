import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  TextField,
  Banner,
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

export default function TestAPI() {
  const { bundles, shop } = useLoaderData();
  const [apiTestResult, setApiTestResult] = useState(null);
  const [apiTestLoading, setApiTestLoading] = useState(false);
  const [testProductId, setTestProductId] = useState("gid://shopify/Product/123");
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setApiTestLoading(true);
    setApiTestResult(null);
    setError(null);
    
    try {
      const encodedProductId = encodeURIComponent(testProductId);
      const response = await fetch(`/api/bundles/product/${encodedProductId}?shop=${shop}`);
      const data = await response.json();
      
      setApiTestResult(data);
      console.log("API Test Result:", data);
    } catch (err) {
      setError(err.message);
      console.error("API Test Error:", err);
    } finally {
      setApiTestLoading(false);
    }
  };

  const testWithExistingBundle = (bundle) => {
    if (bundle.targetProduct?.productId) {
      setTestProductId(bundle.targetProduct.productId);
    }
  };

  return (
    <Page>
      <TitleBar title="API Test" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Bundle API Test
                </Text>
                <Text variant="bodyMd" as="p">
                  Test the bundle API endpoint for a specific product. This endpoint will be used by the Shopify theme to fetch active bundles for product pages.
                </Text>
                
                <InlineStack gap="200" align="end">
                  <TextField
                    label="Product ID"
                    value={testProductId}
                    onChange={setTestProductId}
                    placeholder="gid://shopify/Product/123"
                    autoComplete="off"
                    helpText="Enter a Shopify product ID to test"
                  />
                  <Button 
                    onClick={testAPI} 
                    loading={apiTestLoading}
                    variant="primary"
                  >
                    Test API
                  </Button>
                </InlineStack>

                {error && (
                  <Banner tone="critical">
                    <p>Error: {error}</p>
                  </Banner>
                )}

                {apiTestResult && (
                  <div>
                    <Text as="h3" variant="headingSm">
                      API Response:
                    </Text>
                    <pre style={{ 
                      backgroundColor: '#f6f6f7', 
                      padding: '16px', 
                      borderRadius: '8px',
                      overflow: 'auto',
                      fontSize: '12px',
                      maxHeight: '400px',
                      border: '1px solid #e1e3e5'
                    }}>
                      {JSON.stringify(apiTestResult, null, 2)}
                    </pre>
                  </div>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Quick Test with Existing Bundles
                </Text>
                <Text variant="bodyMd" as="p">
                  Click on any bundle below to test the API with its target product ID.
                </Text>
                
                {bundles.length === 0 ? (
                  <Text variant="bodyMd" color="subdued">
                    No bundles available. Create a bundle first to test with its target product.
                  </Text>
                ) : (
                  <BlockStack gap="300">
                    {bundles.map((bundle) => (
                      <Card key={bundle.id}>
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="100">
                            <Text as="h3" variant="headingSm">
                              {bundle.title}
                            </Text>
                            <Text variant="bodySm" color="subdued">
                              Target Product: {bundle.targetProduct?.productId || "None"}
                            </Text>
                            <Text variant="bodySm" color="subdued">
                              Status: {bundle.isActive ? "Active" : "Inactive"}
                            </Text>
                          </BlockStack>
                          <Button
                            onClick={() => testWithExistingBundle(bundle)}
                            variant="secondary"
                            size="slim"
                            disabled={!bundle.targetProduct?.productId}
                          >
                            Test with this bundle
                          </Button>
                        </InlineStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
} 