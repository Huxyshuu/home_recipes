import React from 'react';
import Icon from './Icon';
import SourceLinks from './SourceLinks';
import { substitutionGroups } from '../data/mealPlan';

export default function SubstitutionsPage() {
  return (
    <main className="page guide-page substitutions-page">
      <section className="guide-hero substitutions-hero">
        <div>
          <span className="eyebrow">Use what the store has</span>
          <h1>Ingredient substitutions</h1>
          <p>Keep the role of the ingredient similar: protein for protein, whole-food carbohydrate for carbohydrate, and vegetables for vegetables. Exact perfection is less important than a repeatable meal.</p>
        </div>
        <div className="guide-target-card">
          <span>Golden rule</span>
          <strong>Do not remove the vegetables</strong>
          <small>Swap the protein or starch while keeping meal structure</small>
        </div>
      </section>

      <section className="substitution-grid">
        {substitutionGroups.map((group) => (
          <article className="panel substitution-card" key={group.title}>
            <header><span className="swap-icon"><Icon name="swap" size={20} /></span><div><h2>{group.title}</h2><p>{group.principle}</p></div></header>
            <div className="swap-list">
              {group.swaps.map((swap) => (
                <div className="swap-row" key={`${swap.from}-${swap.to}`}>
                  <div><small>Instead of</small><strong>{swap.from}</strong></div>
                  <Icon name="arrow" size={18} />
                  <div><small>Use</small><strong>{swap.to}</strong><p>{swap.note}</p></div>
                </div>
              ))}
            </div>
            <SourceLinks sourceIds={group.sourceIds} compact />
          </article>
        ))}
      </section>
    </main>
  );
}
