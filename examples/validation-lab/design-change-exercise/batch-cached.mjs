// Alternative candidate for the review exercise; not application code.
export async function quoteBatch(requests, loadCatalog, calculateTotalCents) {
  const catalogs = new Map();
  const results = [];
  for (const { path, sku, quantity } of requests) {
    if (!catalogs.has(path)) catalogs.set(path, await loadCatalog(path));
    const product = catalogs.get(path).find(item => item.sku === sku);
    if (!product) throw new Error(`Unknown SKU: ${sku}`);
    results.push({ sku, quantity, totalCents: calculateTotalCents(product.unitPriceCents, quantity) });
  }
  return results;
}
