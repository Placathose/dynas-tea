import {
  Page,
  Layout,
  Card,
  Form,
  FormLayout,
  TextField,
  Button,
  Select,
  Banner,
  InlineStack,
  Thumbnail,
  BlockStack,
  InlineError,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useLoaderData, useActionData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getBundle, createBundle, updateBundle, validateBundle } from "../models/Bundle.server";
import { json } from "@remix-run/node";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  
  // If no ID is provided, this is a create route
  if (!params.id || params.id === "new") {
    return json({ bundle: null, isEditing: false });
  }
  
  // If ID is provided, try to fetch the bundle
  try {
    const bundle = await getBundle(parseInt(params.id), admin.graphql);
    if (!bundle) {
      throw new Response("Bundle not found", { status: 404 });
    }
    return json({ bundle, isEditing: true });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw new Response("Bundle not found", { status: 404 });
  }
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const bundleData = {
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    discountedPrice: parseFloat(formData.get("discountedPrice") || "0"),
    isActive: formData.get("isActive") === "true",
    targetProductId: formData.get("targetProductId"),
    targetProductVariantId: formData.get("targetProductVariantId"),
    targetProductHandle: formData.get("targetProductHandle"),
    targetProductTitle: formData.get("targetProductTitle"),
    targetProductImage: formData.get("targetProductImage"),
    targetProductAlt: formData.get("targetProductAlt"),
    shopId: session.shop,
  };

  const validation = validateBundle(bundleData);
  if (!validation.isValid) {
    return { errors: validation.errors };
  }

  try {
    // If no ID is provided, this is a create route
    if (!params.id || params.id === "new") {
      await createBundle(bundleData);
    } else {
      await updateBundle(parseInt(params.id), bundleData);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving bundle:", error);
    return { errors: { general: "Failed to save bundle. Please try again." } };
  }
}

export default function CreateBundle() {
  const { bundle, isEditing } = useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const submit = useSubmit();
  
  const [formData, setFormData] = useState({
    title: bundle?.title || "",
    description: bundle?.description || "",
    imageUrl: bundle?.imageUrl || "",
    discountedPrice: bundle?.discountedPrice?.toString() || "",
    isActive: bundle?.isActive ?? true,
  });

  const [selectedProduct, setSelectedProduct] = useState({
    productId: bundle?.targetProducts ? JSON.parse(bundle.targetProducts)[0] : "",
    productTitle: bundle?.enrichedProducts?.[0]?.title || "",
    productHandle: bundle?.enrichedProducts?.[0]?.handle || "",
    productImage: bundle?.enrichedProducts?.[0]?.images?.edges?.[0]?.node?.url || "",
    productAlt: bundle?.enrichedProducts?.[0]?.images?.edges?.[0]?.node?.altText || "",
    productVariantId: bundle?.enrichedProducts?.[0]?.variants?.edges?.[0]?.node?.id || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("title", formData.title);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("imageUrl", formData.imageUrl);
    formDataToSubmit.append("discountedPrice", formData.discountedPrice);
    formDataToSubmit.append("isActive", formData.isActive.toString());
    formDataToSubmit.append("targetProductId", selectedProduct.productId);
    formDataToSubmit.append("targetProductVariantId", selectedProduct.productVariantId);
    formDataToSubmit.append("targetProductHandle", selectedProduct.productHandle);
    formDataToSubmit.append("targetProductTitle", selectedProduct.productTitle);
    formDataToSubmit.append("targetProductImage", selectedProduct.productImage);
    formDataToSubmit.append("targetProductAlt", selectedProduct.productAlt);
    
    submit(formDataToSubmit, { method: "post" });
  };

  const selectTargetProduct = async () => {
    try {
      const product = await window.shopify.resourcePicker({
        type: "product",
        action: "select",
      });

      if (product) {
        const { id, title, handle, images, variants } = product[0];
        setSelectedProduct({
          productId: id,
          productTitle: title,
          productHandle: handle,
          productImage: images?.[0]?.src || "",
          productAlt: images?.[0]?.alt || "",
          productVariantId: variants?.[0]?.id || "",
        });
      }
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  const handleCancel = () => {
    navigate("/app");
  };

  useEffect(() => {
    if (actionData?.success) {
      navigate("/app");
    }
  }, [actionData, navigate]);

  const errors = actionData?.errors || {};

  return (
    <Page
      title={isEditing ? "Edit Bundle" : "Create Bundle"}
      backAction={{ content: "Bundles", onAction: handleCancel }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              <FormLayout>
                {errors.general && (
                  <Banner tone="critical">
                    <p>{errors.general}</p>
                  </Banner>
                )}

                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(value) => setFormData({ ...formData, title: value })}
                  autoComplete="off"
                  requiredIndicator
                  error={errors.title}
                />

                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  multiline={3}
                  autoComplete="off"
                />

                <TextField
                  label="Image URL"
                  value={formData.imageUrl}
                  onChange={(value) => setFormData({ ...formData, imageUrl: value })}
                  autoComplete="off"
                />

                <TextField
                  label="Discounted Price"
                  type="number"
                  value={formData.discountedPrice}
                  onChange={(value) => setFormData({ ...formData, discountedPrice: value })}
                  prefix="$"
                  autoComplete="off"
                  requiredIndicator
                />

                <Select
                  label="Status"
                  options={[
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                  value={formData.isActive.toString()}
                  onChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                />

                <BlockStack gap="400">
                  <div>
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Target Product</strong>
                      <span style={{ color: "red" }}> *</span>
                    </div>
                    
                    {selectedProduct.productId ? (
                      <InlineStack gap="400" align="start">
                        <Thumbnail
                          source={selectedProduct.productImage || ""}
                          alt={selectedProduct.productAlt || "Product image"}
                          size="medium"
                        />
                        <BlockStack gap="200">
                          <div>
                            <strong>{selectedProduct.productTitle}</strong>
                          </div>
                          <Button onClick={selectTargetProduct} variant="secondary" size="slim">
                            Change product
                          </Button>
                        </BlockStack>
                      </InlineStack>
                    ) : (
                      <Button onClick={selectTargetProduct} variant="secondary">
                        Select target product
                      </Button>
                    )}
                    
                    {errors.targetProductId && (
                      <InlineError message={errors.targetProductId} />
                    )}
                  </div>
                </BlockStack>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button variant="primary" submit>
                    {isEditing ? "Save Changes" : "Create Bundle"}
                  </Button>
                </div>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 