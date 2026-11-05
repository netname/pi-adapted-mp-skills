// Review probe only: the existing project's catalog/pricing APIs are supplied.
export async function quoteBatch(requests, loadCatalog, calculateTotalCents) {
  const results = [];
  for (const { path, sku, quantity } of requests) {
    const products = await loadCatalog(path);
    const product = products.find(item => item.sku === sku);
    if (!product) throw new Error(`Unknown SKU: ${sku}`);
    results.push({ sku, quantity, totalCents: calculateTotalCents(product.unitPriceCents, quantity) });
  }
  return results;
}
