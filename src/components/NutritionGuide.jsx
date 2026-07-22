import React from 'react';
import Icon from './Icon';
import SourceLinks from './SourceLinks';
import { nutritionGuide, researchSources } from '../data/mealPlan';

export default function NutritionGuide() {
  return (
    <main className="page guide-page">
      <section className="guide-hero">
        <div>
          <span className="eyebrow">Remember the reason</span>
          <h1>Nutrition guide</h1>
          <p>A compact explanation of what the routine is trying to achieve for a 93 kg lifter aiming to move gradually toward 80–85 kg while protecting training and muscle.</p>
        </div>
        <div className="guide-target-card">
          <span>Priority order</span>
          <strong>Consistency → protein → food quality</strong>
          <small>Then adjust total food using your trend and recovery</small>
        </div>
      </section>

      <section className="guide-disclaimer panel">
        <Icon name="info" size={23} />
        <p>This is general meal-planning guidance, not diagnosis or an individually calculated medical diet. Health conditions, medication, allergies, kidney disease, diabetes, gastrointestinal problems or a history of disordered eating should be discussed with a qualified healthcare professional or registered dietitian.</p>
      </section>

      <section className="guide-card-grid">
        {nutritionGuide.map((entry, index) => (
          <details className="panel guide-card" key={entry.id} open={index < 2}>
            <summary>
              <span className="guide-card-icon"><Icon name={entry.id === 'protein' ? 'strength' : entry.id === 'limit' ? 'shield' : 'guide'} size={22} /></span>
              <span><small>{entry.target}</small><strong>{entry.title}</strong></span>
              <Icon name="chevron" size={18} />
            </summary>
            <div className="guide-card-body">
              <p>{entry.body}</p>
              <ul>{entry.actions.map((action) => <li key={action}>{action}</li>)}</ul>
              <SourceLinks sourceIds={entry.sourceIds} compact />
            </div>
          </details>
        ))}
      </section>

      <section className="panel source-library">
        <div className="panel-heading"><div><span className="eyebrow">Verify it yourself</span><h2>Source library</h2></div></div>
        <div className="source-library-list">
          {researchSources.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <span><strong>{source.label}</strong><small>{source.note}</small></span>
              <Icon name="external" size={17} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
