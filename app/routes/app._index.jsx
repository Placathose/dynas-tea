import { useEffect, useState } from "react";
import { useFetcher, Link, useLoaderData, useSubmit, useActionData, useNavigate } from "@remix-run/react";
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState(null);

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
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBundleToDelete(null);
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
                            actions={actionMenuItems(bundle)}
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
