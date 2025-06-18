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
  if (!bundle.targetProducts) {
    return bundle;
  }

  try {
    const targetProductIds = JSON.parse(bundle.targetProducts);
    
    if (!targetProductIds.length) {
      return bundle;
    }

    const enrichedProducts = await Promise.all(
      targetProductIds.map(async (productId) => {
        try {
          const response = await graphql(
            `#graphql
            query getProduct($id: ID!) {
              product(id: $id) {
                id
                title
                handle
                images(first: 1) {
                  edges {
                    node {
                      id
                      url
                      altText
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
          return responseJson.data?.product;
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
          return null;
        }
      })
    );

    return {
      ...bundle,
      enrichedProducts: enrichedProducts.filter(Boolean),
    };
  } catch (error) {
    console.error("Error parsing target products:", error);
    return bundle;
  }
}

export function validateBundle(data) {
  const errors = {};

  if (!data.title || data.title.trim() === "") {
    errors.title = "Title is required";
  }

  if (!data.targetProductId) {
    errors.targetProductId = "Target product is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export async function createBundle(data) {
  const targetProducts = JSON.stringify([data.targetProductId]);
  
  return await db.bundle.create({
    data: {
      shopId: data.shopId,
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      originalPrice: data.originalPrice || 0,
      discountedPrice: data.discountedPrice || 0,
      isActive: data.isActive !== false,
      targetProducts,
    },
  });
}

export async function updateBundle(id, data) {
  const targetProducts = JSON.stringify([data.targetProductId]);
  
  return await db.bundle.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl || "",
      originalPrice: data.originalPrice || 0,
      discountedPrice: data.discountedPrice || 0,
      isActive: data.isActive !== false,
      targetProducts,
    },
  });
}