import React, { useEffect, useState } from 'react';
import Icon from './Icon';

const navItems = [
  { id: 'library', label: 'Recipes', icon: 'book' },
  { id: 'routine', label: 'Routine', icon: 'calendar' },
  { id: 'ingredients', label: 'Ingredients', icon: 'ingredients' },
  { id: 'guide', label: 'Guide', icon: 'guide' },
  { id: 'substitutions', label: 'Swaps', icon: 'swap' },
  { id: 'cart', label: 'Cart', icon: 'cart' },
  { id: 'stats', label: 'Stats', icon: 'chart' },
];

const mobilePrimaryItems = navItems.filter((item) => ['library', 'routine', 'ingredients', 'cart'].includes(item.id));
const mobileMoreItems = navItems.filter((item) => ['guide', 'substitutions', 'stats'].includes(item.id));

function NavIcon({ item, cartCount }) {
  return (
    <span className="nav-icon-wrap">
      <Icon name={item.icon} size={19} />
      {item.id === 'cart' && cartCount ? <small>{cartCount > 99 ? '99+' : cartCount}</small> : null}
    </span>
  );
}

export default function Header({ view, onChangeView, onAdd, cartCount = 0, backend = 'local', onLogout = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreActive = mobileMoreItems.some((item) => item.id === view);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [view]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  function changeView(nextView) {
    setMobileMenuOpen(false);
    onChangeView(nextView);
  }

  return (
    <>
      <header className="app-header">
        <button className="brand" type="button" onClick={() => changeView('library')} aria-label="Open LettuceCook recipes">
          <span className="brand-mark"><Icon name="leaf" size={27} /></span>
          <span>
            <strong>LettuceCook</strong>
            <small>{backend === 'firebase' ? 'Cloud kitchen · synced' : 'Local kitchen'}</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              className={view === item.id ? 'is-active' : ''}
              type="button"
              key={item.id}
              onClick={() => changeView(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
              aria-label={item.label}
            >
              <NavIcon item={item} cartCount={cartCount} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button className="button button-primary header-add" type="button" onClick={onAdd}>
            <Icon name="plus" size={18} />
            <span>Add recipe</span>
          </button>
          {onLogout ? (
            <button className="session-button" type="button" onClick={onLogout} title="Sign out on this device" aria-label="Sign out on this device">
              <Icon name="shield" size={17} />
              <span>Sign out</span>
            </button>
          ) : null}
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {mobilePrimaryItems.map((item) => (
          <button
            className={view === item.id ? 'is-active' : ''}
            type="button"
            key={item.id}
            onClick={() => changeView(item.id)}
            aria-current={view === item.id ? 'page' : undefined}
          >
            <NavIcon item={item} cartCount={cartCount} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={moreActive || mobileMenuOpen ? 'is-active' : ''}
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-more-menu"
        >
          <Icon name="more" size={20} />
          <span>More</span>
        </button>
      </nav>

      {mobileMenuOpen ? (
        <>
          <button className="mobile-nav-backdrop" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu" />
          <section className="mobile-nav-sheet" id="mobile-more-menu" aria-label="More LettuceCook pages">
            <div className="mobile-nav-sheet-handle" aria-hidden="true" />
            <div className="mobile-nav-sheet-heading">
              <div>
                <span className="eyebrow">LettuceCook</span>
                <h2>More tools</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><Icon name="close" size={19} /></button>
            </div>
            <div className="mobile-nav-sheet-grid">
              {mobileMoreItems.map((item) => (
                <button className={view === item.id ? 'is-active' : ''} type="button" key={item.id} onClick={() => changeView(item.id)}>
                  <span><Icon name={item.icon} size={21} /></span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
            <div className="mobile-nav-sheet-actions">
              <button className="button button-primary" type="button" onClick={() => { setMobileMenuOpen(false); onAdd(); }}><Icon name="plus" size={18} /> Add recipe</button>
              {onLogout ? <button className="button button-secondary" type="button" onClick={onLogout}><Icon name="shield" size={18} /> Sign out</button> : null}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
