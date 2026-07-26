import test from 'node:test';
import assert from 'node:assert/strict';
import { retailerSearchLinks, withRetailerLinkFallbacks } from '../src/utils/retailerLinks.js';

test('retailer search links are generated when an ingredient URL is missing', () => {
  const links = retailerSearchLinks('Rypsiöljy');
  assert.match(links.sKaupatUrl, /^https:\/\/www\.s-kaupat\.fi\/hakutulokset\?queryString=/);
  assert.match(links.kRuokaUrl, /^https:\/\/www\.k-ruoka\.fi\/kauppa\/tuotehaku\?haku=/);
  assert.match(links.sKaupatUrl, /Rypsi%C3%B6ljy/);
});

test('reviewed direct product links are kept while blank links receive search fallbacks', () => {
  const links = withRetailerLinkFallbacks('Banaani', {
    sKaupatUrl: 'https://www.s-kaupat.fi/tuote/chiquita-banaani/2000503600002',
    kRuokaUrl: '',
    selectedPrice: { retailer: 'S-kaupat' },
  });
  assert.equal(links.sKaupatUrl, 'https://www.s-kaupat.fi/tuote/chiquita-banaani/2000503600002');
  assert.match(links.kRuokaUrl, /^https:\/\/www\.k-ruoka\.fi\//);
  assert.deepEqual(links.selectedPrice, { retailer: 'S-kaupat' });
});
