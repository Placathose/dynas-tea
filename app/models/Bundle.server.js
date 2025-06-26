import db from "../db.server";

export async function getBundle(id, graphql) {
  const bundle = await db.bundle.findUnique({
    where: { id },
    include: {
      shop: true,
      bundleProducts: true,
      targetProduct: true,
    },
  });

  if (!bundle) {
    return null;
  }

  return await supplementBundleData(bundle, graphql);
}

export async function getBundles(shop, graphql) {
  const bundles = await db.bundle.findMany({
    where: { shopId: shop },
    include: {
      shop: true,
      bundleProducts: true,
      targetProduct: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("Raw bundles from database:", bundles.map(b => ({
    id: b.id,
    title: b.title,
    imageUrl: b.imageUrl,
    imageAlt: b.imageAlt
  })));

  return await Promise.all(
    bundles.map((bundle) => supplementBundleData(bundle, graphql))
  );
}

export async function supplementBundleData(bundle, graphql) {
  let enhancedBundle = { ...bundle };

  // Fetch target product data if it exists
  if (bundle.targetProduct) {
    try {
      const targetProductId = bundle.targetProduct.productId;
      
      if (targetProductId && typeof targetProductId === 'string' && targetProductId.startsWith('gid://shopify/Product/')) {
        try {
          const response = await graphql(
            `#graphql
            query getProduct($id: ID!) {
              product(id: $id) {
                id
                title
                handle
                media(first: 1) {
                  edges {
                    node {
                      id
                      ... on MediaImage {
                        image {
                          id
                          url
                          altText
                        }
                      }
                    }
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      price
                    }
                  }
                }
              }
            }`,
            {
              variables: { id: targetProductId },
            }
          );

          const responseJson = await response.json();
          const product = responseJson.data?.product;

          enhancedBundle = {
            ...enhancedBundle,
            enrichedProduct: product,
          };
        } catch (error) {
          console.error(`Error fetching target product ${targetProductId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error parsing target product:", error);
    }
  }

  // Fetch bundle products data if they exist
  if (bundle.bundleProducts && bundle.bundleProducts.length > 0) {
    try {
      const enhancedBundleProducts = await Promise.all(
        bundle.bundleProducts.map(async (bundleProduct) => {
          try {
            const productId = bundleProduct.productId;
            
            if (!productId || typeof productId !== 'string' || !productId.startsWith('gid://shopify/Product/')) {
              console.log(`Skipping invalid product ID: ${productId}`);
              return {
                ...bundleProduct,
                product: null,
                error: "Invalid product ID"
              };
            }

            const response = await graphql(
              `#graphql
              query getProduct($id: ID!) {
                product(id: $id) {
                  id
                  title
                  handle
                  media(first: 1) {
                    edges {
                      node {
                        id
                        ... on MediaImage {
                          image {
                            id
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                  variants(first: 1) {
                    edges {
                      node {
                        id
                        title
                        price
                      }
                    }
                  }
                }
              }`,
              {
                variables: { id: productId },
              }
            );

            const responseJson = await response.json();
            const product = responseJson.data?.product;

            if (!product) {
              return {
                ...bundleProduct,
                product: null,
                error: "Product not found"
              };
            }

            return {
              ...bundleProduct,
              product: {
                title: product.title,
                image: product.media?.edges?.[0]?.node?.image?.url || null,
                imageAlt: product.media?.edges?.[0]?.node?.image?.altText || product.title,
                price: product.variants?.edges?.[0]?.node?.price || "0.00"
              }
            };
          } catch (error) {
            console.error(`Error fetching bundle product ${bundleProduct.productId}:`, error);
            return {
              ...bundleProduct,
              product: null,
              error: "Failed to fetch product"
            };
          }
        })
      );

      enhancedBundle = {
        ...enhancedBundle,
        bundleProducts: enhancedBundleProducts
      };
    } catch (error) {
      console.error("Error fetching bundle products:", error);
    }
  }

  return enhancedBundle;
}

export async function getBundlesForProduct(shop, productId) {
  console.log('🔍 DB: getBundlesForProduct called with:', { shop, productId });
  
  // Find active bundles where the target product matches the given product ID
  const query = {
    where: { 
      shopId: shop,
      isActive: true,
      targetProduct: {
        productId: productId
      }
    },
    include: {
      bundleProducts: true,
      targetProduct: true,
    },
    orderBy: { createdAt: "desc" },
  };
  
  console.log('🔍 DB: Database query:', JSON.stringify(query, null, 2));
  
  const bundles = await db.bundle.findMany(query);

  console.log(`📦 DB: Raw database result: Found ${bundles.length} bundles`);
  console.log('📋 DB: Bundle details:', bundles.map(b => ({
    id: b.id,
    title: b.title,
    isActive: b.isActive,
    shopId: b.shopId,
    targetProductId: b.targetProduct?.productId,
    bundleProductsCount: b.bundleProducts?.length || 0
  })));

  // Return bundles with basic data (no need to enhance with GraphQL for theme usage)
  const result = bundles.map(bundle => ({
    id: bundle.id,
    title: bundle.title,
    description: bundle.description,
    imageUrl: bundle.imageUrl,
    imageAlt: bundle.imageAlt,
    originalPrice: bundle.originalPrice,
    discountedPrice: bundle.discountedPrice,
    savingsAmount: bundle.savingsAmount,
    savingsPercentage: bundle.savingsPercentage,
    bundleProducts: bundle.bundleProducts.map(bp => ({
      id: bp.id,
      productId: bp.productId,
      quantity: bp.quantity
    }))
  }));
  
  console.log('✅ DB: Returning processed bundles:', result.map(b => ({
    id: b.id,
    title: b.title,
    bundleProductsCount: b.bundleProducts.length
  })));
  
  return result;
}

export function validateBundle(data) {
  const errors = {};

  if (!data.title || data.title.trim() === "") {
    errors.title = "Title is required";
  }

  if (!data.targetProduct || !data.targetProduct.create || !data.targetProduct.create.productId) {
    errors.targetProductId = "Target product is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Helper function to calculate pricing data
async function calculateBundlePricing(bundleData, graphql) {
  let originalPrice = 0;
  
  // Calculate target product price
  if (bundleData.targetProduct?.create?.productId) {
    try {
      const response = await graphql(
        `#graphql
        query getProduct($id: ID!) {
          product(id: $id) {
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }`,
        {
          variables: { id: bundleData.targetProduct.create.productId },
        }
      );

      const responseJson = await response.json();
      const price = responseJson.data?.product?.variants?.edges?.[0]?.node?.price;
      if (price) {
        originalPrice += parseFloat(price);
      }
    } catch (error) {
      console.error("Error fetching target product price:", error);
    }
  }

  // Calculate bundle products prices
  if (bundleData.bundleProducts?.create) {
    for (const bundleProduct of bundleData.bundleProducts.create) {
      try {
        const response = await graphql(
          `#graphql
          query getProduct($id: ID!) {
            product(id: $id) {
              variants(first: 1) {
                edges {
                  node {
                    price
                  }
                }
              }
            }
          }`,
          {
            variables: { id: bundleProduct.productId },
          }
        );

        const responseJson = await response.json();
        const price = responseJson.data?.product?.variants?.edges?.[0]?.node?.price;
        if (price) {
          originalPrice += parseFloat(price) * bundleProduct.quantity;
        }
      } catch (error) {
        console.error(`Error fetching bundle product price for ${bundleProduct.productId}:`, error);
      }
    }
  }

  const discountedPrice = bundleData.discountedPrice || 0;
  const savingsAmount = originalPrice - discountedPrice;
  const savingsPercentage = originalPrice > 0 ? Math.round((savingsAmount / originalPrice) * 100) : 0;

  return {
    originalPrice,
    discountedPrice,
    savingsAmount,
    savingsPercentage
  };
}

export async function createBundle(data) {
  console.log("Creating bundle with data:", {
    title: data.title,
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    bundleProductsCount: data.bundleProducts?.create?.length || 0
  });

  // Calculate pricing data
  const pricingData = await calculateBundlePricing(data, data.graphql);

  const result = await db.bundle.create({
    data: {
      shopId: data.shopId,
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      imageAlt: data.imageAlt || "",
      imageSource: data.imageSource || "",
      sourceId: data.sourceId || "",
      targetProduct: data.targetProduct,
      bundleProducts: data.bundleProducts,
      originalPrice: pricingData.originalPrice,
      discountedPrice: pricingData.discountedPrice,
      savingsAmount: pricingData.savingsAmount,
      savingsPercentage: pricingData.savingsPercentage,
      isActive: data.isActive !== false,
    },
    include: {
      bundleProducts: true,
      targetProduct: true,
    }
  });

  console.log("Bundle created:", {
    id: result.id,
    title: result.title,
    imageUrl: result.imageUrl,
    imageAlt: result.imageAlt,
    bundleProductsCount: result.bundleProducts?.length || 0,
    originalPrice: result.originalPrice,
    discountedPrice: result.discountedPrice,
    savingsAmount: result.savingsAmount,
    savingsPercentage: result.savingsPercentage
  });

  return result;
}

export async function updateBundle(id, data) {
  // Calculate pricing data for updates
  const pricingData = await calculateBundlePricing(data, data.graphql);

  return await db.bundle.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      imageAlt: data.imageAlt || "",
      imageSource: data.imageSource || "",
      sourceId: data.sourceId || "",
      targetProduct: data.targetProduct ? {
        upsert: {
          create: data.targetProduct.create,
          update: data.targetProduct.create,
        }
      } : undefined,
      bundleProducts: data.bundleProducts ? {
        deleteMany: {}, // Delete all existing bundle products
        create: data.bundleProducts.create || [] // Create new ones
      } : undefined,
      originalPrice: pricingData.originalPrice,
      discountedPrice: pricingData.discountedPrice,
      savingsAmount: pricingData.savingsAmount,
      savingsPercentage: pricingData.savingsPercentage,
      isActive: data.isActive !== false,
    },
    include: {
      bundleProducts: true,
      targetProduct: true,
    }
  });
}

export async function deleteBundle(id) {
  return await db.bundle.delete({
    where: { id },
  });
}