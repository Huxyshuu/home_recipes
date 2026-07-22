import React from 'react';
import Icon from './Icon';
import { researchSources } from '../data/mealPlan';

export default function SourceLinks({ sourceIds = [], compact = false }) {
  const sources = sourceIds.map((id) => researchSources.find((source) => source.id === id)).filter(Boolean);
  if (!sources.length) return null;

  return (
    <div className={`source-links ${compact ? 'is-compact' : ''}`}>
      {sources.map((source) => (
        <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
          <Icon name="external" size={14} />
          <span>{compact ? source.shortLabel : source.label}</span>
        </a>
      ))}
    </div>
  );
}
