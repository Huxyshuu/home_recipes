import React, { useMemo, useState } from 'react';
import { api } from '../api/client';
import { recipeNutrition, roundNutrition } from '../utils/nutrition';
import Icon from './Icon';
import NutritionSearch from './NutritionSearch';

function blankIngredient() {
  return {
    id: `local-${Date.now()}-${Math.random()}`,
    name: '', quantity: 0, unit: 'g', grams: 0, note: '', shoppingCategory: 'Other',
    fineliFoodId: null, fineliFoodName: '', fineliMeasures: [],
    nutritionPer100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  };
}

function blankStep(index = 0) {
  return { id: `local-${Date.now()}-${Math.random()}`, title: `Step ${index + 1}`, text: '', timerMinutes: 0 };
}

function initialRecipe(recipe) {
  return recipe ? JSON.parse(JSON.stringify(recipe)) : {
    title: '', description: '', category: 'Everyday', cuisine: 'Home cooking', difficulty: 'Easy',
    prepMinutes: 10, cookMinutes: 20, servings: 4, tags: [], image: '', sourceUrl: '', notes: '', favourite: false,
    slug: '', plannedNutritionPerServing: null, useIngredientNutrition: true,
    ingredients: [blankIngredient()], steps: [blankStep(0)],
  };
}

export default function RecipeEditor({ recipe, onCancel, onSave }) {
  const [form, setForm] = useState(() => initialRecipe(recipe));
  const [tagText, setTagText] = useState((recipe?.tags || []).join(', '));
  const [nutritionIndex, setNutritionIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const nutrition = useMemo(() => recipeNutrition(form).perServing, [form]);

  function patch(fields) {
    setForm((current) => ({ ...current, ...fields }));
  }

  function patchIngredient(index, fields) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) => itemIndex === index ? { ...ingredient, ...fields } : ingredient),
    }));
  }

  function patchNutrition(index, key, value) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) => itemIndex === index ? {
        ...ingredient,
        nutritionPer100g: { ...ingredient.nutritionPer100g, [key]: Number(value) || 0 },
      } : ingredient),
    }));
  }


  function applyFineliMeasure(index, measureCode) {
    const ingredient = form.ingredients[index];
    const measure = (ingredient.fineliMeasures || []).find((item) => item.code === measureCode);
    if (!measure) return;
    const quantity = Number(ingredient.quantity || 1);
    patchIngredient(index, {
      unit: measure.abbreviation || ingredient.unit,
      grams: Math.round(quantity * Number(measure.grams || 0) * 10) / 10,
    });
  }

  function patchStep(index, fields) {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, itemIndex) => itemIndex === index ? { ...step, ...fields } : step),
    }));
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await api.uploadImage(file);
      patch({ image: result.url });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Give the recipe a title.');
      return;
    }
    if (!form.ingredients.some((ingredient) => ingredient.name.trim())) {
      setError('Add at least one ingredient.');
      return;
    }
    if (!form.steps.some((step) => step.text.trim())) {
      setError('Add at least one cooking step.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        tags: tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editor-shell">
      <header className="editor-header">
        <div>
          <span className="eyebrow">{recipe ? 'Update your recipe' : 'Add to the library'}</span>
          <h1>{recipe ? `Edit ${recipe.title}` : 'Create a new recipe'}</h1>
        </div>
        <button className="icon-button large" type="button" onClick={onCancel} aria-label="Close editor"><Icon name="close" /></button>
      </header>

      <form className="recipe-form" onSubmit={submit}>
        <section className="form-section panel">
          <div className="section-title"><span>1</span><div><h2>The recipe</h2><p>Name it and give it a useful cover.</p></div></div>
          <div className="form-grid two-columns">
            <label className="field full"><span>Recipe title</span><input value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="Finnish salmon soup" /></label>
            <label className="field full"><span>Short description</span><textarea rows="3" value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="What makes this recipe worth cooking?" /></label>
            <label className="field"><span>Category</span><input value={form.category} onChange={(event) => patch({ category: event.target.value })} placeholder="Dinner" /></label>
            <label className="field"><span>Cuisine</span><input value={form.cuisine} onChange={(event) => patch({ cuisine: event.target.value })} placeholder="Finnish" /></label>
            <label className="field"><span>Difficulty</span><select value={form.difficulty} onChange={(event) => patch({ difficulty: event.target.value })}><option>Easy</option><option>Medium</option><option>Advanced</option></select></label>
            <label className="field"><span>Servings</span><input type="number" min="1" value={form.servings} onChange={(event) => patch({ servings: Number(event.target.value) })} /></label>
            <label className="field"><span>Preparation minutes</span><input type="number" min="0" value={form.prepMinutes} onChange={(event) => patch({ prepMinutes: Number(event.target.value) })} /></label>
            <label className="field"><span>Cooking minutes</span><input type="number" min="0" value={form.cookMinutes} onChange={(event) => patch({ cookMinutes: Number(event.target.value) })} /></label>
            <label className="field full"><span>Tags, separated by commas</span><input value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="Finnish, comfort food, weekday" /></label>
          </div>
          <div className="cover-upload">
            <div className="cover-preview">{form.image ? <img src={form.image} alt="Recipe cover preview" /> : <Icon name="image" size={38} />}</div>
            <div><strong>Cover image</strong><p>JPEG, PNG or WebP, up to 8 MB.</p><label className="button button-secondary file-button"><Icon name="image" size={17} /> {uploading ? 'Uploading…' : 'Choose image'}<input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} /></label></div>
          </div>
        </section>

        <section className="form-section panel">
          <div className="section-title"><span>2</span><div><h2>Ingredients</h2><p>Enter a gram weight for reliable nutrition calculations.</p></div></div>
          <div className="ingredient-editor-list">
            {form.ingredients.map((ingredient, index) => (
              <div className="ingredient-editor" key={ingredient.id || index}>
                <div className="ingredient-row-top">
                  <strong>Ingredient {index + 1}</strong>
                  <button className="text-button danger" type="button" onClick={() => patch({ ingredients: form.ingredients.filter((_, itemIndex) => itemIndex !== index) })} disabled={form.ingredients.length === 1}><Icon name="trash" size={16} /> Remove</button>
                </div>
                <div className="ingredient-fields">
                  <label className="field ingredient-name"><span>Name</span><input value={ingredient.name} onChange={(event) => patchIngredient(index, { name: event.target.value })} placeholder="Potato" /></label>
                  <label className="field small"><span>Amount</span><input type="number" step="0.01" value={ingredient.quantity} onChange={(event) => patchIngredient(index, { quantity: Number(event.target.value) })} /></label>
                  <label className="field small"><span>Unit</span><input value={ingredient.unit} onChange={(event) => patchIngredient(index, { unit: event.target.value })} placeholder="g" /></label>
                  <label className="field small"><span>Weight (g)</span><input type="number" step="0.1" value={ingredient.grams} onChange={(event) => patchIngredient(index, { grams: Number(event.target.value) })} /></label>
                  <button className="button button-soft nutrition-button" type="button" onClick={() => setNutritionIndex(nutritionIndex === index ? null : index)}><Icon name="search" size={17} /> Fineli</button>
                </div>
                <div className="ingredient-extra-fields">
                  <label className="field"><span>Preparation note</span><input value={ingredient.note} onChange={(event) => patchIngredient(index, { note: event.target.value })} placeholder="peeled and cubed" /></label>
                  <label className="field shopping-category-field"><span>Grocery category</span><select value={ingredient.shoppingCategory || 'Other'} onChange={(event) => patchIngredient(index, { shoppingCategory: event.target.value })}><option>Produce</option><option>Meat & fish</option><option>Plant protein</option><option>Dairy & chilled</option><option>Frozen</option><option>Bakery</option><option>Grains</option><option>Nuts & seeds</option><option>Pantry</option><option>Other</option></select></label>
                </div>
                {ingredient.fineliFoodName ? <div className="source-chip"><Icon name="check" size={15} /> Linked to {ingredient.fineliFoodName}</div> : null}
                {(ingredient.fineliMeasures || []).length ? <label className="fineli-measure-picker"><span>Set weight from a Fineli household measure</span><select value="" onChange={(event) => applyFineliMeasure(index, event.target.value)}><option value="">Choose a measure…</option>{ingredient.fineliMeasures.map((measure) => <option key={measure.code} value={measure.code}>{measure.abbreviation} = {measure.grams} g</option>)}</select></label> : null}
                <details className="manual-nutrition">
                  <summary>Per 100 g nutrition (editable)</summary>
                  <div className="macro-inputs">
                    {['kcal', 'protein', 'carbs', 'fat', 'fibre'].map((key) => <label key={key}><span>{key}</span><input type="number" step="0.1" value={ingredient.nutritionPer100g?.[key] || 0} onChange={(event) => patchNutrition(index, key, event.target.value)} /></label>)}
                  </div>
                </details>
                {nutritionIndex === index ? <NutritionSearch ingredientName={ingredient.name} onClose={() => setNutritionIndex(null)} onSelect={(selection) => {
                  const matchingMeasure = (selection.fineliMeasures || []).find((measure) => measure.abbreviation.toLocaleLowerCase('fi-FI') === String(ingredient.unit || '').toLocaleLowerCase('fi-FI'));
                  patchIngredient(index, {
                    ...selection,
                    grams: matchingMeasure && Number(ingredient.quantity) > 0
                      ? Math.round(Number(ingredient.quantity) * matchingMeasure.grams * 10) / 10
                      : ingredient.grams,
                  });
                }} /> : null}
              </div>
            ))}
          </div>
          <button className="button button-secondary" type="button" onClick={() => patch({ ingredients: [...form.ingredients, blankIngredient()] })}><Icon name="plus" size={17} /> Add ingredient</button>
        </section>

        <section className="form-section panel">
          <div className="section-title"><span>3</span><div><h2>Method</h2><p>Keep each step focused and easy to check off.</p></div></div>
          <div className="step-editor-list">
            {form.steps.map((step, index) => (
              <div className="step-editor" key={step.id || index}>
                <span className="step-number">{index + 1}</span>
                <div className="step-editor-fields">
                  <div className="form-grid step-grid">
                    <label className="field"><span>Step title</span><input value={step.title} onChange={(event) => patchStep(index, { title: event.target.value })} /></label>
                    <label className="field timer-field"><span>Timer (min)</span><input type="number" min="0" value={step.timerMinutes || 0} onChange={(event) => patchStep(index, { timerMinutes: Number(event.target.value) })} /></label>
                  </div>
                  <label className="field"><span>Instruction</span><textarea rows="3" value={step.text} onChange={(event) => patchStep(index, { text: event.target.value })} placeholder="Describe one clear action." /></label>
                </div>
                <button className="icon-button danger" type="button" onClick={() => patch({ steps: form.steps.filter((_, itemIndex) => itemIndex !== index) })} disabled={form.steps.length === 1} aria-label="Remove step"><Icon name="trash" size={18} /></button>
              </div>
            ))}
          </div>
          <button className="button button-secondary" type="button" onClick={() => patch({ steps: [...form.steps, blankStep(form.steps.length)] })}><Icon name="plus" size={17} /> Add step</button>
        </section>

        <section className="form-section panel compact-section">
          <div className="section-title"><span>4</span><div><h2>Finishing details</h2><p>Optional source and personal notes.</p></div></div>
          <div className="form-grid two-columns">
            <label className="field full"><span>Source URL</span><input value={form.sourceUrl} onChange={(event) => patch({ sourceUrl: event.target.value })} placeholder="https://…" /></label>
            <label className="field full"><span>Notes</span><textarea rows="3" value={form.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="Substitutions, serving ideas, or what to change next time." /></label>
          </div>
        </section>

        {form.plannedNutritionPerServing && !form.useIngredientNutrition ? <div className="planned-nutrition-editor panel"><Icon name="info" size={20} /><div><strong>Fixed weekly-plan nutrition is active</strong><p>The summary uses the research-plan estimate rather than recalculating from the ingredient snapshots.</p></div><button className="button button-secondary" type="button" onClick={() => patch({ useIngredientNutrition: true })}>Use ingredient calculation</button></div> : null}
        <div className="editor-summary panel">
          <div><span className="eyebrow">Estimated per portion</span><strong>{roundNutrition(nutrition.kcal)} kcal</strong><small>{roundNutrition(nutrition.protein, 1)} g protein · {roundNutrition(nutrition.carbs, 1)} g carbs · {roundNutrition(nutrition.fat, 1)} g fat</small></div>
          <div className="editor-actions"><button className="button button-secondary" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : recipe ? 'Save changes' : 'Create recipe'}</button></div>
        </div>
        {error ? <p className="form-error sticky-error">{error}</p> : null}
      </form>
    </div>
  );
}
