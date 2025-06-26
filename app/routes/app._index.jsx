import { useEffect, useState } from "react";
import { useFetcher, Link, useLoaderData, useSubmit, useActionData, useNavigate, useRevalidator } from "@remix-run/react";
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
  Modal,
  Banner,
  DataTable,
  Collapsible,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getBundles, deleteBundle } from "../models/Bundle.server";
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

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "delete") {
    const bundleId = parseInt(formData.get("bundleId"));
    
    try {
      await deleteBundle(bundleId);
      return json({ success: true, message: "Bundle deleted successfully" });
    } catch (error) {
      console.error("Error deleting bundle:", error);
      return json({ success: false, message: "Failed to delete bundle" });
              }
            }
  
  return json({ success: false, message: "Invalid action" });
};

export default function Index() {
  const { bundles } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState(null);
  const [expandedBundles, setExpandedBundles] = useState(new Set());

  // Debug: Log bundle data to see what's being returned
  console.log("Bundles data:", bundles);
  bundles.forEach((bundle, index) => {
    console.log(`Bundle ${index + 1}:`, {
      id: bundle.id,
      title: bundle.title,
      imageUrl: bundle.imageUrl,
      imageAlt: bundle.imageAlt,
      originalPrice: bundle.originalPrice,
      discountedPrice: bundle.discountedPrice,
      savingsAmount: bundle.savingsAmount,
      savingsPercentage: bundle.savingsPercentage,
      bundleProducts: bundle.bundleProducts?.map(bp => ({
        id: bp.id,
        productId: bp.productId,
        quantity: bp.quantity,
        product: bp.product,
        error: bp.error
      }))
    });
  });

  const handleEdit = (bundleId) => {
    navigate(`/app/edit-bundle/${bundleId}`);
  };

  const handleDelete = (bundle) => {
    setBundleToDelete(bundle);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (bundleToDelete) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("bundleId", bundleToDelete.id.toString());
      submit(formData, { method: "post" });
      setDeleteModalOpen(false);
      setBundleToDelete(null);
      revalidator.revalidate();
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBundleToDelete(null);
  };

  const toggleBundleExpansion = (bundleId) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(bundleId)) {
      newExpanded.delete(bundleId);
    } else {
      newExpanded.add(bundleId);
    }
    setExpandedBundles(newExpanded);
  };

  const actionMenuItems = (bundle) => [
    {
      content: "Edit",
      onAction: () => handleEdit(bundle.id),
    },
    {
      content: "Delete",
      onAction: () => handleDelete(bundle),
    },
  ];

  const getBundleProductsTableData = (bundleProducts) => {
    if (!bundleProducts || bundleProducts.length === 0) {
      return [];
    }

    return bundleProducts.map((product, index) => {
      // Handle products with errors or missing data
      if (product.error || !product.product) {
        return [
          `${index + 1}`,
          <Thumbnail
            key={`image-${product.id}`}
            source="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            alt="Product not found"
            size="small"
          />,
          <Text key={`title-${product.id}`} variant="bodyMd" color="subdued">
            {product.error || "Product not available"}
          </Text>,
          <Text key={`price-${product.id}`} variant="bodyMd" color="subdued">
            -
          </Text>,
          product.quantity.toString(),
          new Date(product.createdAt).toLocaleDateString(),
        ];
      }

      // Handle products with valid data
      return [
        `${index + 1}`,
        <Thumbnail
          key={`image-${product.id}`}
          source={product.product.image || "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"}
          alt={product.product.imageAlt || product.product.title}
          size="small"
        />,
        <Text key={`title-${product.id}`} variant="bodyMd">
          {product.product.title}
        </Text>,
        <Text key={`price-${product.id}`} variant="bodyMd">
          ${product.product.price}
        </Text>,
        product.quantity.toString(),
        new Date(product.createdAt).toLocaleDateString(),
      ];
    });
  };

  const bundleProductsHeaders = [
    "No.",
    "Image",
    "Title",
    "Price",
    "Quantity",
    "Added Date",
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
                {actionData?.message && (
                  <Banner tone={actionData.success ? "success" : "critical"}>
                    {actionData.message}
                  </Banner>
                )}
                
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
                        <BlockStack gap="400">
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
                                <InlineStack gap="200" align="baseline">
                                  <Text as="p" variant="bodyMd" color="subdued" textDecorationLine="line-through">
                                    ${bundle.originalPrice?.toFixed(2) || "0.00"}
                                  </Text>
                                  <Text as="p" variant="headingSm" tone="success">
                                    ${bundle.discountedPrice?.toFixed(2) || "0.00"}
                                  </Text>
                                  {bundle.savingsPercentage > 0 && (
                                    <Text as="p" variant="bodySm" tone="success">
                                      Save {bundle.savingsPercentage}%
                  </Text>
                                  )}
                                </InlineStack>
                                <Text as="p" variant="bodyMd" color="subdued">
                                  {bundle.bundleProducts?.length || 0} products in bundle
                  </Text>
                </BlockStack>
                            </InlineStack>
                            <InlineStack gap="200">
                    <Button
                                variant="tertiary"
                                onClick={() => toggleBundleExpansion(bundle.id)}
                    >
                                {expandedBundles.has(bundle.id) ? "Hide Products" : "Show Products"}
                    </Button>
                              <ActionMenu
                                actions={actionMenuItems(bundle)}
                                trigger="..."
                              />
                            </InlineStack>
                </InlineStack>
                          
                          <Collapsible
                            open={expandedBundles.has(bundle.id)}
                            id={`bundle-${bundle.id}-products`}
                          >
                            <BlockStack gap="300">
                              <Text as="h4" variant="headingSm">
                                Bundle Products
                    </Text>
                              {bundle.bundleProducts && bundle.bundleProducts.length > 0 ? (
                                <DataTable
                                  columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'text']}
                                  headings={bundleProductsHeaders}
                                  rows={getBundleProductsTableData(bundle.bundleProducts)}
                                />
                              ) : (
                                <Text as="p" variant="bodyMd" color="subdued">
                                  No products added to this bundle yet.
                    </Text>
                              )}
                            </BlockStack>
                          </Collapsible>
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      <Modal
        open={deleteModalOpen}
        onClose={cancelDelete}
        title="Delete Bundle"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: confirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: cancelDelete,
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete "{bundleToDelete?.title}"? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
