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
  InlineError,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useLoaderData, useActionData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getBundle, updateBundle, validateBundle } from "../models/Bundle.server";
import { json } from "@remix-run/node";
import ImagePicker from "../components/ImagePicker";
import ProductPicker from "../components/ProductPicker";
import BundleProducts from "../components/BundleProducts";
import db from "../db.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  
  // Get the bundle ID from params
  const bundleId = parseInt(params.id);
  
  if (!bundleId || isNaN(bundleId)) {
    throw new Response("Invalid bundle ID", { status: 400 });
  }
  
  try {
    const bundle = await getBundle(bundleId, admin.graphql);
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
  const { admin, session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  const bundleId = parseInt(params.id);
  
  // Ensure the shop exists in the database
  try {
    await db.shop.upsert({
      where: { id: session.shop },
      update: {},
      create: {
        id: session.shop,
        name: session.shop,
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    return { errors: { general: "Failed to initialize shop data. Please try again." } };
  }
  
  // Handle image file upload if present
  let imageUrl = formData.get("imageUrl");
  let imageAlt = formData.get("imageAlt");
  
  const imageFile = formData.get("imageFile");
  
  if (imageFile && imageFile instanceof File) {
    try {
      // Upload file to Shopify
      const uploadResponse = await admin.graphql(
        `#graphql
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              resourceUrl
              url
              parameters {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            input: [
              {
                filename: imageFile.name,
                mimeType: imageFile.type,
                resource: "FILE",
              },
            ],
          },
        }
      );

      const uploadData = await uploadResponse.json();
      
      if (uploadData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
        return { errors: { general: "Failed to upload image: " + uploadData.data.stagedUploadsCreate.userErrors[0].message } };
      }
      
      const stagedTarget = uploadData.data.stagedUploadsCreate.stagedTargets[0];

      if (stagedTarget) {
        // Upload the file to the staged URL
        const uploadFormData = new FormData();
        stagedTarget.parameters.forEach(({ name, value }) => {
          uploadFormData.append(name, value);
        });
        uploadFormData.append("file", imageFile);

        const fileUploadResponse = await fetch(stagedTarget.url, {
          method: "POST",
          body: uploadFormData,
        });

        if (fileUploadResponse.ok) {
          // Create a file record in Shopify
          const fileCreateResponse = await admin.graphql(
            `#graphql
            mutation fileCreate($files: [FileCreateInput!]!) {
              fileCreate(files: $files) {
                files {
                  id
                  fileStatus
                  preview {
                    image {
                      url
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
            {
              variables: {
                files: [
                  {
                    originalSource: stagedTarget.resourceUrl,
                    contentType: "IMAGE",
                  },
                ],
              },
            }
          );

          const fileData = await fileCreateResponse.json();
          
          if (fileData.data?.fileCreate?.userErrors?.length > 0) {
            return { errors: { general: "Failed to create file: " + fileData.data.fileCreate.userErrors[0].message } };
          }
          
          const file = fileData.data.fileCreate.files[0];

          if (file?.preview?.image?.url) {
            imageUrl = file.preview.image.url;
            imageAlt = imageFile.name;
          }
        }
      }
    } catch (error) {
      return { errors: { general: "Failed to upload image. Please try again." } };
    }
  }

  const bundleData = {
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl: imageUrl,
    imageAlt: imageAlt,
    imageSource: formData.get("imageSource"),
    sourceId: formData.get("sourceId"),
    discountedPrice: parseFloat(formData.get("discountedPrice") || "0"),
    isActive: formData.get("isActive") === "true",
    shopId: session.shop,
    graphql: admin.graphql,
    // Create the targetProduct relation properly
    targetProduct: {
      create: {
        productId: formData.get("targetProductId") || "",
        productHandle: formData.get("targetProductHandle") || "",
        productVariantId: formData.get("targetProductVariantId") || "",
        productTitle: formData.get("targetProductTitle") || "",
        productImage: formData.get("targetProductImage") || "",
        productAlt: formData.get("targetProductAlt") || "",
      }
    },
    // Parse bundle products data
    bundleProducts: {
      create: []
    }
  };

  // Parse bundle products from form data
  const bundleProductsData = [];
  let index = 0;
  while (formData.get(`bundleProducts[${index}][productId]`)) {
    const productId = formData.get(`bundleProducts[${index}][productId]`);
    const quantity = parseInt(formData.get(`bundleProducts[${index}][quantity]`) || "1");
    
    if (productId) {
      bundleProductsData.push({
        productId: productId,
        quantity: quantity
      });
    }
    index++;
  }
  
  bundleData.bundleProducts.create = bundleProductsData;
  
  console.log('Bundle data for update:', {
    title: bundleData.title,
    targetProduct: bundleData.targetProduct,
    bundleProductsCount: bundleData.bundleProducts.create.length,
    bundleProducts: bundleData.bundleProducts.create
  });

  const validation = validateBundle(bundleData);
  
  if (!validation.isValid) {
    return { errors: validation.errors };
  }

  try {
    await updateBundle(bundleId, bundleData);
    return { success: true };
  } catch (error) {
    return { errors: { general: `Failed to save bundle: ${error.message}` } };
  }
}

export default function EditBundle() {
  const { bundle } = useLoaderData();
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
    productId: bundle?.targetProduct?.productId || "",
    productTitle: bundle?.targetProduct?.productTitle || bundle?.enrichedProduct?.title || "",
    productHandle: bundle?.targetProduct?.productHandle || bundle?.enrichedProduct?.handle || "",
    productImage: bundle?.targetProduct?.productImage || bundle?.enrichedProduct?.media?.edges?.[0]?.node?.image?.url || "",
    productAlt: bundle?.targetProduct?.productAlt || bundle?.enrichedProduct?.media?.edges?.[0]?.node?.image?.altText || "",
    productVariantId: bundle?.targetProduct?.productVariantId || bundle?.enrichedProduct?.variants?.edges?.[0]?.node?.id || "",
  });

  const [selectedImage, setSelectedImage] = useState({
    imageId: "",
    imageUrl: bundle?.imageUrl || "",
    imageAlt: bundle?.imageAlt || "",
    imageSource: bundle?.imageSource || "",
    sourceId: bundle?.sourceId || "",
  });

  const [bundleProducts, setBundleProducts] = useState(
    bundle?.bundleProducts?.map(bp => ({
      id: bp.id,
      productId: bp.productId,
      quantity: bp.quantity,
      product: bp.product,
      error: bp.error
    })) || []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSubmit = new FormData();
    formDataToSubmit.append("title", formData.title);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("discountedPrice", formData.discountedPrice);
    formDataToSubmit.append("isActive", formData.isActive.toString());
    formDataToSubmit.append("targetProductId", selectedProduct.productId);
    formDataToSubmit.append("targetProductVariantId", selectedProduct.productVariantId);
    formDataToSubmit.append("targetProductHandle", selectedProduct.productHandle);
    formDataToSubmit.append("targetProductTitle", selectedProduct.productTitle);
    formDataToSubmit.append("targetProductImage", selectedProduct.productImage);
    formDataToSubmit.append("targetProductAlt", selectedProduct.productAlt);
    
    // Add bundle products data
    bundleProducts.forEach((product, index) => {
      formDataToSubmit.append(`bundleProducts[${index}][productId]`, product.productId);
      formDataToSubmit.append(`bundleProducts[${index}][quantity]`, product.quantity.toString());
    });
    
    // Handle image upload if it's a file
    if (selectedImage.file) {
      formDataToSubmit.append("imageFile", selectedImage.file);
      formDataToSubmit.append("imageSource", "upload");
    } else {
      formDataToSubmit.append("imageUrl", selectedImage.imageUrl);
      formDataToSubmit.append("imageAlt", selectedImage.imageAlt);
      formDataToSubmit.append("imageSource", selectedImage.imageSource);
      formDataToSubmit.append("sourceId", selectedImage.sourceId);
    }
    
    submit(formDataToSubmit, { method: "post" });
  };

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
  };

  const handleProductSelect = (productData) => {
    setSelectedProduct(productData);
  };

  const handleBundleProductsChange = (products) => {
    setBundleProducts(products);
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
      title="Edit Bundle"
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

                <ImagePicker
                  selectedImage={selectedImage}
                  onImageSelect={handleImageSelect}
                  label="Bundle Image"
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

                <ProductPicker
                  selectedProduct={selectedProduct}
                  onProductSelect={handleProductSelect}
                  label="Target Product"
                />

                {errors.targetProductId && (
                  <InlineError message={errors.targetProductId} />
                )}

                <BundleProducts
                  bundleProducts={bundleProducts}
                  onBundleProductsChange={handleBundleProductsChange}
                  label="Bundle Products"
                />

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button variant="primary" submit>
                    Save Changes
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