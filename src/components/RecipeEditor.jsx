import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { recipeNutrition, roundNutrition } from '../utils/nutrition';
import { formatBytes, prepareRecipeImage } from '../utils/imageCompression';
import Icon from './Icon';
import NutritionSearch from './NutritionSearch';

function blankIngredient() {
  return {
    id: `local-${Date.now()}-${Math.random()}`,
    name: '', quantity: 0, unit: 'g', grams: 0, note: '', shoppingCategory: 'Muut',
    fineliQuery: '', fineliPreferredTerms: [], fineliFoodId: null, fineliFoodName: '', fineliMeasures: [],
    nutritionSource: null, retail: { sKaupatUrl: '', kRuokaUrl: '', selectedPrice: null },
    nutritionPer100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
  };
}

function blankStep(index = 0) {
  return { id: `local-${Date.now()}-${Math.random()}`, title: `Step ${index + 1}`, text: '', timerMinutes: 0 };
}

function initialRecipe(recipe) {
  return recipe ? JSON.parse(JSON.stringify(recipe)) : {
    title: '', description: '', category: 'Arki', cuisine: 'Kotiruoka', difficulty: 'Helppo',
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
  const [uploadSummary, setUploadSummary] = useState('');
  const [error, setError] = useState('');
  const [ingredientCatalog, setIngredientCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const nutrition = useMemo(() => recipeNutrition(form).perServing, [form]);

  useEffect(() => {
    let active = true;
    api.listIngredients()
      .then((items) => { if (active) setIngredientCatalog(items); })
      .catch((requestError) => { if (active) setError(`Could not open the shared ingredient library: ${requestError.message}`); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  function patch(fields) {
    setForm((current) => ({ ...current, ...fields }));
  }

  function patchIngredient(index, fields) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) => itemIndex === index ? { ...ingredient, ...fields } : ingredient),
    }));
  }


  function patchRetail(index, fields) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) => itemIndex === index ? {
        ...ingredient,
        retail: { ...(ingredient.retail || {}), ...fields },
      } : ingredient),
    }));
  }

  function patchSelectedPrice(index, fields) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) => itemIndex === index ? {
        ...ingredient,
        retail: {
          ...(ingredient.retail || {}),
          selectedPrice: { ...(ingredient.retail?.selectedPrice || {}), ...fields },
        },
      } : ingredient),
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


  function chooseCatalogIngredient(index, catalogId) {
    const selected = ingredientCatalog.find((item) => item.id === catalogId);
    if (!selected) {
      patchIngredient(index, { catalogId: '' });
      return;
    }
    const current = form.ingredients[index];
    patchIngredient(index, {
      ...selected,
      id: current.id,
      catalogId: selected.id,
      quantity: current.quantity,
      unit: current.unit,
      unitEn: current.unitEn,
      grams: current.grams,
      note: current.note,
      noteEn: current.noteEn,
    });
  }

  function ingredientDefinitionPayload(ingredient) {
    return {
      name: ingredient.name,
      nameEn: ingredient.nameEn,
      shoppingCategory: ingredient.shoppingCategory,
      shoppingCategoryEn: ingredient.shoppingCategoryEn,
      fineliQuery: ingredient.fineliQuery || ingredient.name,
      fineliPreferredTerms: ingredient.fineliPreferredTerms || [],
      fineliFoodId: ingredient.fineliFoodId,
      fineliFoodName: ingredient.fineliFoodName,
      fineliMeasures: ingredient.fineliMeasures || [],
      nutritionSource: ingredient.nutritionSource,
      retail: ingredient.retail,
      nutritionPer100g: ingredient.nutritionPer100g,
    };
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
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setUploadSummary('');
    try {
      const prepared = await prepareRecipeImage(file);
      const result = await api.uploadImage(prepared.file);
      patch({ image: result.url });
      if (prepared.converted) {
        const reduction = prepared.originalBytes > 0
          ? Math.max(0, Math.round((1 - prepared.outputBytes / prepared.originalBytes) * 100))
          : 0;
        setUploadSummary(`Uploaded as WebP: ${formatBytes(prepared.originalBytes)} → ${formatBytes(prepared.outputBytes)}${reduction ? ` (${reduction}% smaller)` : ''}.`);
      } else {
        setUploadSummary(`Uploaded without browser compression. ${prepared.warning || ''}`.trim());
      }
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      input.value = '';
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
      const linkedIngredients = [];
      for (const ingredient of form.ingredients) {
        const definition = ingredient.catalogId
          ? await api.updateIngredient(ingredient.catalogId, ingredientDefinitionPayload(ingredient))
          : await api.createIngredient(ingredientDefinitionPayload(ingredient));
        linkedIngredients.push({ ...ingredient, catalogId: definition.id, ...definition, id: ingredient.id });
      }
      await onSave({
        ...form,
        ingredients: linkedIngredients,
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
            <label className="field"><span>Difficulty</span><select value={form.difficulty} onChange={(event) => patch({ difficulty: event.target.value })}><option>Helppo</option><option>Keskitaso</option><option>Vaativa</option></select></label>
            <label className="field"><span>Servings</span><input type="number" min="1" value={form.servings} onChange={(event) => patch({ servings: Number(event.target.value) })} /></label>
            <label className="field"><span>Preparation minutes</span><input type="number" min="0" value={form.prepMinutes} onChange={(event) => patch({ prepMinutes: Number(event.target.value) })} /></label>
            <label className="field"><span>Cooking minutes</span><input type="number" min="0" value={form.cookMinutes} onChange={(event) => patch({ cookMinutes: Number(event.target.value) })} /></label>
            <label className="field full"><span>Tags, separated by commas</span><input value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="Finnish, comfort food, weekday" /></label>
          </div>
          <div className="cover-upload">
            <div className="cover-preview">{form.image ? <img src={form.image} alt="Recipe cover preview" /> : <Icon name="image" size={38} />}</div>
            <div><strong>Cover image</strong><p>JPEG, PNG or WebP, up to 8 MB. Large images are resized to 1600 px and converted to compressed WebP before upload.</p><label className="button button-secondary file-button"><Icon name="image" size={17} /> {uploading ? 'Compressing and uploading…' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} /></label>{uploadSummary ? <p className="upload-summary" role="status">{uploadSummary}</p> : null}</div>
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
                <label className="shared-ingredient-picker field"><span>Shared ingredient record</span><select value={ingredient.catalogId || ''} onChange={(event) => chooseCatalogIngredient(index, event.target.value)} disabled={catalogLoading}><option value="">{catalogLoading ? 'Opening ingredient library…' : 'Create a new shared ingredient from this row'}</option>{ingredientCatalog.map((item) => <option key={item.id} value={item.id}>{item.name}{item.nameEn ? ` · ${item.nameEn}` : ''}</option>)}</select></label>
                <div className="ingredient-fields">
                  <label className="field ingredient-name"><span>Name (shared globally)</span><input value={ingredient.name} onChange={(event) => patchIngredient(index, { name: event.target.value })} placeholder="Potato" /></label>
                  <label className="field small"><span>Amount</span><input type="number" step="0.01" value={ingredient.quantity} onChange={(event) => patchIngredient(index, { quantity: Number(event.target.value) })} /></label>
                  <label className="field small"><span>Unit</span><input value={ingredient.unit} onChange={(event) => patchIngredient(index, { unit: event.target.value })} placeholder="g" /></label>
                  <label className="field small"><span>Weight (g)</span><input type="number" step="0.1" value={ingredient.grams} onChange={(event) => patchIngredient(index, { grams: Number(event.target.value) })} /></label>
                  <button className="button button-soft nutrition-button" type="button" onClick={() => setNutritionIndex(nutritionIndex === index ? null : index)}><Icon name="search" size={17} /> Fineli</button>
                </div>
                <div className="ingredient-extra-fields">
                  <label className="field"><span>Preparation note</span><input value={ingredient.note} onChange={(event) => patchIngredient(index, { note: event.target.value })} placeholder="peeled and cubed" /></label>
                  <label className="field shopping-category-field"><span>Grocery category</span><select value={ingredient.shoppingCategory || 'Muut'} onChange={(event) => patchIngredient(index, { shoppingCategory: event.target.value })}><option>Hedelmät ja vihannekset</option><option>Liha ja kala</option><option>Kasviproteiinit</option><option>Maitotuotteet ja kylmätuotteet</option><option>Pakasteet</option><option>Leivät</option><option>Viljat ja kuiva-aineet</option><option>Pähkinät ja siemenet</option><option>Kuivakaappi</option><option>Muut</option></select></label>
                </div>
                <details className="retail-editor">
                  <summary>Store links and price estimate</summary>
                  <div className="retail-link-fields">
                    <label className="field"><span>S-kaupat URL</span><input type="url" value={ingredient.retail?.sKaupatUrl || ''} onChange={(event) => patchRetail(index, { sKaupatUrl: event.target.value })} placeholder="https://www.s-kaupat.fi/…" /></label>
                    <label className="field"><span>K-Ruoka URL</span><input type="url" value={ingredient.retail?.kRuokaUrl || ''} onChange={(event) => patchRetail(index, { kRuokaUrl: event.target.value })} placeholder="https://www.k-ruoka.fi/…" /></label>
                  </div>
                  <div className="retail-price-fields">
                    <label className="field"><span>Retailer</span><input value={ingredient.retail?.selectedPrice?.retailer || ''} onChange={(event) => patchSelectedPrice(index, { retailer: event.target.value })} placeholder="K-Ruoka" /></label>
                    <label className="field"><span>Product name</span><input value={ingredient.retail?.selectedPrice?.productName || ''} onChange={(event) => patchSelectedPrice(index, { productName: event.target.value })} /></label>
                    <label className="field price-small"><span>Unit price €</span><input type="number" min="0" step="0.01" value={ingredient.retail?.selectedPrice?.unitPriceEur || ''} onChange={(event) => patchSelectedPrice(index, { unitPriceEur: Number(event.target.value) })} /></label>
                    <label className="field price-small"><span>Per</span><select value={ingredient.retail?.selectedPrice?.priceUnit || 'kg'} onChange={(event) => patchSelectedPrice(index, { priceUnit: event.target.value })}><option value="kg">kg</option><option value="l">l</option><option value="pcs">piece</option></select></label>
                    <label className="field price-small"><span>Package €</span><input type="number" min="0" step="0.01" value={ingredient.retail?.selectedPrice?.packagePriceEur || ''} onChange={(event) => patchSelectedPrice(index, { packagePriceEur: Number(event.target.value) })} /></label>
                    <label className="field price-small"><span>Package size</span><input type="number" min="0" step="0.1" value={ingredient.retail?.selectedPrice?.packageSize || ''} onChange={(event) => patchSelectedPrice(index, { packageSize: Number(event.target.value) })} /></label>
                    <label className="field price-small"><span>Unit</span><select value={ingredient.retail?.selectedPrice?.packageUnit || 'g'} onChange={(event) => patchSelectedPrice(index, { packageUnit: event.target.value })}><option>g</option><option>kg</option><option>ml</option><option>l</option><option value="pcs">pcs</option></select></label>
                    <label className="field"><span>Store</span><input value={ingredient.retail?.selectedPrice?.store || ''} onChange={(event) => patchSelectedPrice(index, { store: event.target.value })} placeholder="K-Citymarket Iso Omena" /></label>
                    <label className="field"><span>Checked date</span><input type="date" value={ingredient.retail?.selectedPrice?.observedAt || ''} onChange={(event) => patchSelectedPrice(index, { observedAt: event.target.value })} /></label>
                  </div>
                  <p className="retail-help">This is shared ingredient data. Saving the recipe updates the same store links and price in every recipe using this ingredient.</p>
                </details>
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
