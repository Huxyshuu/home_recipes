import React, { useMemo } from 'react';
import Icon from './Icon';
import { formatCartQuantity, shoppingCategoryOrder } from '../utils/shopping';

export default function GroceryCart({ cart, loading, error, onRefresh, onToggle, onRemove, onClearChecked, onClearAll }) {
  const grouped = useMemo(() => {
    const result = {};
    (cart.items || []).forEach((item) => {
      const category = item.category || 'Other';
      if (!result[category]) result[category] = [];
      result[category].push(item);
    });
    return shoppingCategoryOrder.filter((category) => result[category]?.length).map((category) => ({ category, items: result[category] }));
  }, [cart.items]);
  const checked = (cart.items || []).filter((item) => item.checked).length;
  const total = (cart.items || []).length;

  return (
    <main className="page cart-page">
      <section className="cart-hero">
        <div>
          <span className="eyebrow">Shared on your home network</span>
          <h1>{cart.name || 'My grocery cart'}</h1>
          <p>Create a cart from the weekly routine or add any recipe individually. Open this tab on your phone and check items off in the store.</p>
        </div>
        <div className="cart-progress"><strong>{checked}/{total}</strong><span>picked</span></div>
      </section>

      <section className="cart-toolbar panel">
        <button className="button button-secondary" type="button" onClick={onRefresh}><Icon name="refresh" size={17} /> Refresh</button>
        <div>
          <button className="button button-secondary" type="button" onClick={onClearChecked} disabled={!checked}><Icon name="check" size={17} /> Remove checked</button>
          <button className="button button-ghost danger" type="button" onClick={onClearAll} disabled={!total}><Icon name="trash" size={17} /> Clear cart</button>
        </div>
      </section>

      {error ? <div className="error-state panel"><Icon name="info" size={24} /><div><strong>Cart could not be saved</strong><p>{error}</p></div></div> : null}
      {loading ? <div className="loading-state panel"><span className="spinner" /><p>Opening the shared cart…</p></div> : null}
      {!loading && !total ? (
        <section className="empty-state panel">
          <span className="empty-icon"><Icon name="cart" size={36} /></span>
          <h2>Your cart is empty</h2>
          <p>Use a recipe’s “Add to cart” button or create the Sunday or Wednesday cart from the Routine tab.</p>
        </section>
      ) : null}

      {!loading && total ? <section className="cart-groups">
        {grouped.map((group) => (
          <article className="panel cart-group" key={group.category}>
            <header><h2>{group.category}</h2><span>{group.items.filter((item) => item.checked).length}/{group.items.length}</span></header>
            <div className="cart-items">
              {group.items.map((item) => (
                <div className={`cart-item ${item.checked ? 'is-checked' : ''}`} key={item.id}>
                  <button className="cart-item-main" type="button" onClick={() => onToggle(item.id)}>
                    <span className="cart-check"><Icon name="check" size={15} /></span>
                    <strong>{formatCartQuantity(item.quantity)} {item.unit}</strong>
                    <span>{item.name}{item.sources?.length ? <small>{item.sources.slice(0, 2).join(' · ')}{item.sources.length > 2 ? ` +${item.sources.length - 2}` : ''}</small> : null}</span>
                  </button>
                  <div className="cart-retail-links">
                    {item.retail?.sKaupatUrl ? <a href={item.retail.sKaupatUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.name} in S-kaupat`}>S</a> : null}
                    {item.retail?.kRuokaUrl ? <a href={item.retail.kRuokaUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.name} in K-Ruoka`}>K</a> : null}
                  </div>
                  <button className="icon-button danger" type="button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name}`}><Icon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section> : null}

      <footer className="cart-sync-note"><Icon name="refresh" size={16} /> The list is stored by the local Home Recipes server. Tap Refresh on another device to see the latest checks.</footer>
    </main>
  );
}
