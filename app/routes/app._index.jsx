import { useEffect } from "react";
import { useFetcher, Link, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  InlineStack,
  Thumbnail,
  ActionMenu,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getBundles } from "../models/Bundle.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  try {
    const bundles = await getBundles(session.shop, admin.graphql);
    return json({ bundles });
  } catch (error) {
    console.error("Error fetching bundles:", error);
    return json({ bundles: [] });
  }
};

export default function Index() {
  const { bundles } = useLoaderData();

  const handleEdit = (bundleId) => {
    // Phase 2: Implement edit functionality
    console.log("Edit bundle:", bundleId);
  };

  const handleDelete = (bundleId) => {
    // Phase 3: Implement delete functionality
    console.log("Delete bundle:", bundleId);
  };

  const actionMenuItems = (bundleId) => [
    {
      content: "Edit",
      onAction: () => handleEdit(bundleId),
    },
    {
      content: "Delete",
      onAction: () => handleDelete(bundleId),
    },
  ];

  return (
    <Page>
      <TitleBar title="Bundles">
        <Link to="/app/create-bundle">
          <Button variant="primary">Create Bundle</Button>
        </Link>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Your Bundles
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Manage your product bundles here. Create new bundles or edit existing ones.
                  </Text>
                </BlockStack>
                
                {bundles.length === 0 ? (
                  <EmptyState
                    heading="No bundles yet"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Create your first bundle to get started.</p>
                    <Link to="/app/create-bundle">
                      <Button variant="primary">Create Bundle</Button>
                    </Link>
                  </EmptyState>
                ) : (
                  <BlockStack gap="400">
                    {bundles.map((bundle) => (
                      <Card key={bundle.id}>
                        <InlineStack align="space-between" blockAlign="center">
                          <InlineStack gap="400" blockAlign="center">
                            <Thumbnail
                              source={bundle.imageUrl || "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"}
                              alt={bundle.imageAlt || bundle.title}
                              size="medium"
                            />
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingMd">
                                {bundle.title}
                              </Text>
                              {bundle.description && (
                                <Text as="p" variant="bodyMd" color="subdued">
                                  {bundle.description}
                                </Text>
                              )}
                              <Text as="p" variant="bodyMd">
                                ${bundle.discountedPrice}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          <ActionMenu
                            actions={actionMenuItems(bundle.id)}
                            trigger="..."
                          />
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
