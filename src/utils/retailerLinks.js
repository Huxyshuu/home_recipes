function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function retailerSearchLinks(ingredientName = '') {
  const query = cleanText(ingredientName);
  if (!query) return { sKaupatUrl: '', kRuokaUrl: '' };
  const encoded = encodeURIComponent(query);
  return {
    sKaupatUrl: `https://www.s-kaupat.fi/hakutulokset?queryString=${encoded}`,
    kRuokaUrl: `https://www.k-ruoka.fi/kauppa/tuotehaku?haku=${encoded}`,
  };
}

export function withRetailerLinkFallbacks(ingredientName = '', retail = {}) {
  const fallback = retailerSearchLinks(ingredientName);
  return {
    ...(retail && typeof retail === 'object' ? retail : {}),
    sKaupatUrl: cleanText(retail?.sKaupatUrl) || fallback.sKaupatUrl,
    kRuokaUrl: cleanText(retail?.kRuokaUrl) || fallback.kRuokaUrl,
    selectedPrice: retail?.selectedPrice ?? null,
  };
}
