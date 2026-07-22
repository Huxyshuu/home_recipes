import React from 'react';
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

export default function Header({ view, onChangeView, onAdd, cartCount = 0 }) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => onChangeView('library')}>
        <span className="brand-mark"><Icon name="chef" size={25} /></span>
        <span>
          <strong>Home Recipes</strong>
          <small>Cook, plan and shop calmly</small>
        </span>
      </button>

      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            className={view === item.id ? 'is-active' : ''}
            type="button"
            key={item.id}
            onClick={() => onChangeView(item.id)}
            aria-label={item.label}
          >
            <span className="nav-icon-wrap"><Icon name={item.icon} size={18} />{item.id === 'cart' && cartCount ? <small>{cartCount}</small> : null}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="button button-primary header-add" type="button" onClick={onAdd}>
        <Icon name="plus" size={18} />
        <span>Add recipe</span>
      </button>
    </header>
  );
}
