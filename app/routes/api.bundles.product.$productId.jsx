import { json } from "@remix-run/node";
import { getBundlesForProduct } from "../models/Bundle.server";

export async function loader({ request, params }) {
  const { productId } = params;
  
  console.log('🔍 API: Bundle request received:', {
    productId,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  if (!productId) {
    console.log('❌ API: Product ID is missing');
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    // Get the shop from the request URL
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    console.log('🔍 API: Parsed request parameters:', {
      shop,
      productId,
      searchParams: Object.fromEntries(url.searchParams.entries())
    });
    
    if (!shop) {
      console.log('❌ API: Shop parameter is missing');
      return json({ error: "Shop parameter is required" }, { status: 400 });
    }

    console.log('🔍 API: Calling getBundlesForProduct with:', { shop, productId });
    
    // Fetch active bundles for this product
    const bundles = await getBundlesForProduct(shop, productId);
    
    console.log('📦 API: Database query result:', {
      bundlesCount: bundles.length,
      bundles: bundles.map(b => ({
        id: b.id,
        title: b.title,
        isActive: b.isActive,
        targetProduct: b.targetProduct?.productId
      }))
    });
    
    // Return response with CORS headers for theme integration
    const response = { 
      bundles,
      success: true,
      productId,
      shop
    };
    
    console.log('✅ API: Returning successful response:', response);
    
    return json(response, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  } catch (error) {
    console.error('❌ API: Error in bundle loader:', error);
    return json({ 
      error: "Failed to fetch bundles",
      bundles: [],
      productId,
      shop: new URL(request.url).searchParams.get("shop")
    }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function action({ request }) {
  if (request.method === "OPTIONS") {
    console.log('🔍 API: Handling CORS preflight request');
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
  
  console.log('❌ API: Method not allowed:', request.method);
  return json({ error: "Method not allowed" }, { status: 405 });
} 