import db from "../db.server";

export async function getBundle(id, graphql) {
  const bundle = await db.bundle.findUnique({
    where: { id },
    include: {
      shop: true,
      bundleProducts: true,
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
    },
    orderBy: { createdAt: "desc" },
  });

  return await Promise.all(
    bundles.map((bundle) => supplementBundleData(bundle, graphql))
  );
}

export async function supplementBundleData(bundle, graphql) {
  if (!bundle.targetProduct) {
    return bundle;
  }

  try {
    const targetProductId = bundle.targetProduct.productId;
    
    if (!targetProductId) {
      return bundle;
    }

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

      return {
        ...bundle,
        enrichedProduct: product,
      };
    } catch (error) {
      console.error(`Error fetching product ${targetProductId}:`, error);
      return bundle;
    }
  } catch (error) {
    console.error("Error parsing target product:", error);
    return bundle;
  }
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

export async function createBundle(data) {
  return await db.bundle.create({
    data: {
      shopId: data.shopId,
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      imageAlt: data.imageAlt || "",
      imageSource: data.imageSource || "",
      sourceId: data.sourceId || "",
      targetProduct: data.targetProduct,
      originalPrice: data.originalPrice || 0,
      discountedPrice: data.discountedPrice || 0,
      isActive: data.isActive !== false,
    },
  });
}

export async function updateBundle(id, data) {
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
      originalPrice: data.originalPrice || 0,
      discountedPrice: data.discountedPrice || 0,
      isActive: data.isActive !== false,
    },
  });
}