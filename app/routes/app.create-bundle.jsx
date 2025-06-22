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
  BlockStack,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useLoaderData, useActionData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { createBundle, validateBundle } from "../models/Bundle.server";
import { json, unstable_parseMultipartFormData } from "@remix-run/node";
import ImagePicker from "../components/ImagePicker";
import ProductPicker from "../components/ProductPicker";
import BundleItemPicker from "../components/BundleItemPicker";
import BundleItemList from "../components/BundleItemList";
import db from "../db.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  
  // This is always a create route
  return json({ bundle: null, isEditing: false });
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  
  // Temporary cleanup of corrupted data
  try {
    const corruptedBundles = await db.bundle.findMany({
      where: {
        shopId: session.shop,
        title: "[object Object]"
      }
    });
    
    if (corruptedBundles.length > 0) {
      console.log(`Cleaning up ${corruptedBundles.length} corrupted bundles`);
      await db.bundle.deleteMany({
        where: {
          id: { in: corruptedBundles.map(b => b.id) }
        }
      });
    }
  } catch (error) {
    console.error("Error cleaning up corrupted bundles:", error);
  }
  
  const formData = await unstable_parseMultipartFormData(request, async ({ name, contentType, filename, data }) => {
    if (name === "imageFile") {
      const chunks = [];
      for await (const chunk of data) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      return new File([buffer], filename, { type: contentType });
    }
    // For all other fields, collect the data as a string
    const chunks = [];
    for await (const chunk of data) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString();
  });
  
  console.log("Action function - formData entries:");
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.type})` : value);
  }
  
  // Debug: Check if formData is working correctly
  console.log("Form data debug:");
  console.log("title type:", typeof formData.get("title"));
  console.log("title value:", formData.get("title"));
  console.log("targetProductId type:", typeof formData.get("targetProductId"));
  console.log("targetProductId value:", formData.get("targetProductId"));
  
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
  
  console.log("Image upload debug:", {
    hasImageFile: !!imageFile,
    imageFileType: imageFile?.type,
    imageFileName: imageFile?.name,
    initialImageUrl: imageUrl,
    initialImageAlt: imageAlt
  });
  
  if (imageFile && imageFile instanceof File) {
    try {
      console.log("Starting image upload process...");
      
      // Convert the file to a base64 data URL for now
      // This is a simpler approach that doesn't require external uploads
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${imageFile.type};base64,${base64}`;
      
      // For now, we'll store the data URL directly
      // In production, you might want to use a CDN or image hosting service
      imageUrl = dataUrl;
      imageAlt = imageFile.name;
      
      console.log("Image converted to data URL successfully:", {
        imageUrl: imageUrl.substring(0, 100) + "...",
        imageAlt: imageAlt
      });
      
    } catch (error) {
      console.error("Image upload error:", error);
      // Don't fail the entire bundle creation if image upload fails
      imageUrl = "";
      imageAlt = "";
    }
  }

  // Extract form data as strings
  const title = formData.get("title") || "";
  const description = formData.get("description") || "";
  const discountedPrice = formData.get("discountedPrice") || "0";
  const isActive = formData.get("isActive") === "true";
  const targetProductId = formData.get("targetProductId") || "";
  const targetProductVariantId = formData.get("targetProductVariantId") || "";
  const targetProductHandle = formData.get("targetProductHandle") || "";
  const targetProductTitle = formData.get("targetProductTitle") || "";
  const targetProductImage = formData.get("targetProductImage") || "";
  const targetProductAlt = formData.get("targetProductAlt") || "";

  // Parse bundle items from form data
  const bundleItemsData = formData.get("bundleItems");
  let bundleItems = [];
  if (bundleItemsData) {
    try {
      bundleItems = JSON.parse(bundleItemsData);
    } catch (error) {
      console.error("Error parsing bundle items:", error);
    }
  }

  const bundleData = {
    title: title,
    description: description,
    imageUrl: imageUrl,
    imageAlt: imageAlt,
    imageSource: formData.get("imageSource"),
    sourceId: formData.get("sourceId"),
    discountedPrice: parseFloat(discountedPrice),
    isActive: isActive,
    shopId: session.shop,
    // Create the targetProduct relation properly
    targetProduct: {
      create: {
        productId: targetProductId,
        productHandle: targetProductHandle,
        productVariantId: targetProductVariantId,
        productTitle: targetProductTitle,
        productImage: targetProductImage,
        productAlt: targetProductAlt,
      }
    },
    // Create bundle products
    bundleProducts: {
      create: bundleItems.map(item => ({
        productId: item.id,
        quantity: item.quantity || 1,
      }))
    }
  };

  console.log("Bundle data being saved:", {
    title: bundleData.title,
    imageUrl: bundleData.imageUrl,
    imageAlt: bundleData.imageAlt,
    imageSource: bundleData.imageSource,
    bundleItemsCount: bundleItems.length
  });

  const validation = validateBundle(bundleData);
  
  if (!validation.isValid) {
    return { errors: validation.errors };
  }

  try {
    await createBundle(bundleData);
    return { success: true };
  } catch (error) {
    return { errors: { general: `Failed to save bundle: ${error.message}` } };
  }
}

export default function CreateBundle() {
  useLoaderData();
  const actionData = useActionData();
  const navigate = useNavigate();
  const submit = useSubmit();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    discountedPrice: "",
    isActive: true,
  });

  const [selectedProduct, setSelectedProduct] = useState({
    productId: "",
    productTitle: "",
    productHandle: "",
    productImage: "",
    productAlt: "",
    productVariantId: "",
    price: "0",
  });

  const [selectedImage, setSelectedImage] = useState({
    imageId: "",
    imageUrl: "",
    imageAlt: "",
    imageSource: "",
    sourceId: "",
    file: null,
  });

  const [bundleItems, setBundleItems] = useState([]);

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
    
    // Add bundle items to form data
    formDataToSubmit.append("bundleItems", JSON.stringify(bundleItems));
    
    console.log("Submit debug - selectedImage:", {
      hasFile: !!selectedImage.file,
      fileType: selectedImage.file?.type,
      fileName: selectedImage.file?.name,
      imageSource: selectedImage.imageSource
    });
    
    // Handle image upload if it's a file
    if (selectedImage.file) {
      formDataToSubmit.append("imageFile", selectedImage.file);
      formDataToSubmit.append("imageSource", "upload");
      console.log("Appending file to FormData");
      submit(formDataToSubmit, { method: "post", encType: "multipart/form-data" });
    } else {
      formDataToSubmit.append("imageUrl", selectedImage.imageUrl);
      formDataToSubmit.append("imageAlt", selectedImage.imageAlt);
      formDataToSubmit.append("imageSource", selectedImage.imageSource);
      formDataToSubmit.append("sourceId", selectedImage.sourceId);
      console.log("No file, using imageUrl:", selectedImage.imageUrl);
      submit(formDataToSubmit, { method: "post" });
    }
  };

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
  };

  const handleProductSelect = (productData) => {
    setSelectedProduct(productData);
  };

  const handleBundleItemsSelected = (products) => {
    const newItems = products.map(product => ({
      ...product,
      quantity: 1
    }));
    setBundleItems(prev => [...prev, ...newItems]);
  };

  const handleQuantityChange = (productId, quantity) => {
    setBundleItems(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setBundleItems(prev => prev.filter(item => item.id !== productId));
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

  // Get existing product IDs for filtering
  const existingProductIds = [
    selectedProduct.productId,
    ...bundleItems.map(item => item.id)
  ].filter(Boolean);

  return (
    <Page
      title="Create Bundle"
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

                <BlockStack gap="400">
                  <BundleItemPicker
                    onProductsSelected={handleBundleItemsSelected}
                    existingProductIds={existingProductIds}
                  />

                  <BundleItemList
                    bundleItems={bundleItems}
                    onQuantityChange={handleQuantityChange}
                    onRemoveItem={handleRemoveItem}
                    targetProductPrice={selectedProduct.price}
                  />
                </BlockStack>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <Button onClick={handleCancel}>Cancel</Button>
                  <Button variant="primary" submit>
                    Create Bundle
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