export const researchSources = [
  {
    id: 'sports-position',
    label: 'Academy of Nutrition and Dietetics, Dietitians of Canada & ACSM (2016)',
    shortLabel: 'Sports nutrition position paper',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26920240/',
    note: 'Protein ranges for active people, spreading protein across the day, and recovery nutrition.',
  },
  {
    id: 'nnr-2023',
    label: 'Nordic Nutrition Recommendations 2023',
    shortLabel: 'NNR 2023',
    url: 'https://www.norden.org/en/publication/nordic-nutrition-recommendations-2023',
    note: 'Nordic reference values and the overall emphasis on plants, whole grains, fish, nuts and minimally processed foods.',
  },
  {
    id: 'finland-adults',
    label: 'Finnish Food Authority: Adults',
    shortLabel: 'Finnish adult guidance',
    url: 'https://www.ruokavirasto.fi/en/foodstuffs/healthy-diet/nutrition-and-food-recommendations/adults/',
    note: 'Current Finnish food-group targets for produce, whole grains, legumes, fish, dairy, oils, nuts and fluids.',
  },
  {
    id: 'finland-salt-iodine',
    label: 'Finnish Food Authority: Special instructions and restrictions',
    shortLabel: 'Salt and iodised salt',
    url: 'https://www.ruokavirasto.fi/en/foodstuffs/healthy-diet/nutrition-and-food-recommendations/special-instructions-and-restrictions/',
    note: 'Adult salt limit and iodine guidance.',
  },
  {
    id: 'vitamin-d',
    label: 'Finnish Food Authority: Vitamin D',
    shortLabel: 'Vitamin D in Finland',
    url: 'https://www.ruokavirasto.fi/en/foodstuffs/healthy-diet/nutrients/vitamin-d/',
    note: 'Food sources, fortified products and situations where supplementation is recommended.',
  },
  {
    id: 'iodine',
    label: 'Finnish Food Authority: Iodine',
    shortLabel: 'Iodine in Finland',
    url: 'https://www.ruokavirasto.fi/en/foodstuffs/healthy-diet/nutrients/iodine/',
    note: 'Milk products and iodised salt as important iodine sources in Finland.',
  },
  {
    id: 'fineli',
    label: 'THL Fineli open data',
    shortLabel: 'Fineli food-composition data',
    url: 'https://fineli.fi/fineli/fi/avoin-data',
    note: 'Finnish food-composition reference used by the ingredient-search integration (CC BY 4.0).',
  },
];

export const quickMeals = {
  'skyr-berry-almond-cup': {
    id: 'skyr-berry-almond-cup',
    title: 'Skyr Berry Almond Cup',
    kind: 'quick',
    nutrition: { kcal: 330, protein: 31, carbs: 29, fat: 10, fibre: 7 },
    ingredients: [
      { name: 'Skyr', quantity: 250, unit: 'g', shoppingCategory: 'Dairy & chilled' },
      { name: 'Frozen berries', quantity: 150, unit: 'g', shoppingCategory: 'Frozen' },
      { name: 'Almonds', quantity: 20, unit: 'g', shoppingCategory: 'Nuts & seeds' },
    ],
    note: 'Stir together or keep the almonds separate until eating.',
  },
  'whey-banana': {
    id: 'whey-banana',
    title: 'Whey + Banana',
    kind: 'quick',
    nutrition: { kcal: 225, protein: 25, carbs: 30, fat: 2, fibre: 3 },
    ingredients: [
      { name: 'Whey protein', quantity: 30, unit: 'g', shoppingCategory: 'Pantry' },
      { name: 'Banana', quantity: 1, unit: 'pc', shoppingCategory: 'Produce' },
    ],
    note: 'Place before or after lifting. On a non-training day, this is the first item to remove when appetite is low.',
  },
};

export const weeklyRoutine = [
  {
    day: 1,
    weekday: 'Monday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'protein-overnight-oats' },
      { slot: 'Lunch', recipeSlug: 'chicken-rice-broccoli-box' },
      { slot: 'Dinner', recipeSlug: 'oven-salmon-potatoes-peas' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2410, protein: 199, carbs: 227, fat: 68, fibre: 37 },
  },
  {
    day: 2,
    weekday: 'Tuesday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'savory-egg-rye-plate' },
      { slot: 'Lunch', recipeSlug: 'turkey-tomato-pasta' },
      { slot: 'Dinner', recipeSlug: 'red-lentil-chicken-soup' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2300, protein: 194, carbs: 210, fat: 63, fibre: 39 },
  },
  {
    day: 3,
    weekday: 'Wednesday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'quark-oat-pancakes' },
      { slot: 'Lunch', recipeSlug: 'chicken-rice-broccoli-box' },
      { slot: 'Dinner', recipeSlug: 'tofu-quinoa-vegetable-wok' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2330, protein: 187, carbs: 224, fat: 65, fibre: 35 },
  },
  {
    day: 4,
    weekday: 'Thursday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'protein-overnight-oats' },
      { slot: 'Lunch', recipeSlug: 'tuna-potato-cottage-cheese-bake' },
      { slot: 'Dinner', recipeSlug: 'sheet-pan-chicken-root-veg' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2310, protein: 209, carbs: 200, fat: 64, fibre: 35 },
  },
  {
    day: 5,
    weekday: 'Friday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'savory-egg-rye-plate' },
      { slot: 'Lunch', recipeSlug: 'oven-salmon-potatoes-peas' },
      { slot: 'Dinner', recipeSlug: 'turkey-tortilla-wraps' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2290, protein: 177, carbs: 195, fat: 77, fibre: 36 },
  },
  {
    day: 6,
    weekday: 'Saturday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'skyr-muesli-fruit-bowl' },
      { slot: 'Lunch', recipeSlug: 'beef-bean-chili-rice' },
      { slot: 'Dinner', recipeSlug: 'tofu-quinoa-vegetable-wok' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2310, protein: 175, carbs: 224, fat: 68, fibre: 40 },
  },
  {
    day: 7,
    weekday: 'Sunday',
    meals: [
      { slot: 'Breakfast', recipeSlug: 'quark-oat-pancakes' },
      { slot: 'Lunch', recipeSlug: 'red-lentil-chicken-soup' },
      { slot: 'Dinner', recipeSlug: 'salmon-spinach-pasta-skillet' },
      { slot: 'Protein snack', quickMealId: 'skyr-berry-almond-cup' },
      { slot: 'Training snack', quickMealId: 'whey-banana' },
    ],
    totals: { kcal: 2310, protein: 191, carbs: 216, fat: 61, fibre: 34 },
  },
];

export const shoppingWindows = {
  sunday: {
    id: 'sunday',
    title: 'Sunday shop',
    subtitle: 'Monday through Wednesday, plus Thursday breakfast, lunch and daytime snacks.',
    selections: [
      { day: 1, slots: ['Breakfast', 'Lunch', 'Dinner', 'Protein snack', 'Training snack'] },
      { day: 2, slots: ['Breakfast', 'Lunch', 'Dinner', 'Protein snack', 'Training snack'] },
      { day: 3, slots: ['Breakfast', 'Lunch', 'Dinner', 'Protein snack', 'Training snack'] },
      { day: 4, slots: ['Breakfast', 'Lunch', 'Protein snack', 'Training snack'] },
    ],
  },
  wednesday: {
    id: 'wednesday',
    title: 'Wednesday shop',
    subtitle: 'Thursday dinner through Sunday. This keeps the later-week fish and vegetables fresher.',
    selections: [
      { day: 4, slots: ['Dinner'] },
      { day: 5, slots: ['Breakfast', 'Lunch', 'Dinner', 'Protein snack', 'Training snack'] },
      { day: 6, slots: ['Breakfast', 'Lunch', 'Dinner', 'Protein snack', 'Training snack'] },
      { day: 7, slots: ['Breakfast', 'Lunch', 'Dinner', 'Protein snack', 'Training snack'] },
    ],
  },
};

export const nutritionGuide = [
  {
    id: 'energy',
    title: 'Use the week as a starting point',
    target: 'About 2,290–2,410 kcal/day',
    body: 'This is a structured starting template, not a personalised maintenance-calorie calculation. Your height, age, sex, daily steps and training volume are not stored in the app. Follow the plan consistently, track the weekly trend in body weight and gym performance, and make small changes rather than repeatedly changing the whole diet.',
    actions: ['Keep protein meals unchanged first.', 'On rest days, remove whey + banana first if you are not hungry.', 'If recovery or training performance deteriorates, restore food around training before cutting more.'],
    sourceIds: ['sports-position'],
  },
  {
    id: 'protein',
    title: 'Protein is the anchor',
    target: '180–190 g/day · 4–5 feedings',
    body: 'At 93 kg, 180–190 g is about 1.9–2.0 g/kg/day, near the upper end of the 1.2–2.0 g/kg/day range in the sports-nutrition position paper. The plan spreads this across the day rather than relying on one very large dinner.',
    actions: ['Aim for roughly 25–45 g at each main eating moment.', 'A practical early-recovery amount is about 0.25–0.3 g/kg: roughly 23–28 g for 93 kg.', 'Skyr, rahka, cottage cheese, eggs, chicken, fish, tofu and whey make this easy.'],
    sourceIds: ['sports-position'],
  },
  {
    id: 'carbohydrate',
    title: 'Keep enough carbohydrate to train',
    target: 'Usually 190–230 g/day in this plan',
    body: 'Carbohydrate supports lifting and replenishes glycogen. This plan uses a moderate practical allocation rather than treating carbohydrate as unlimited or eliminating it. Most comes from oats, rye, potatoes, rice, whole-wheat pasta, fruit, berries and legumes.',
    actions: ['Place the banana, oats, rice, pasta or potatoes near training when convenient.', 'Prefer whole-food carbohydrate over sugary drinks.', 'Increase the training-day portion slightly if performance consistently drops.'],
    sourceIds: ['sports-position', 'nnr-2023'],
  },
  {
    id: 'fat',
    title: 'Favour soft fats',
    target: 'Usually 60–80 g/day',
    body: 'Do not chase an extremely low-fat diet. The Nordic guidance favours mono- and polyunsaturated fats and recommends limiting saturated fat. The Finnish pattern is simple: rapeseed oil as the default cooking oil, modest nuts and seeds, plus fish, eggs and dairy.',
    actions: ['Use rapeseed oil rather than butter as the default.', 'Keep nuts to a measured portion because they are energy dense.', 'Choose low-fat dairy most of the time while keeping fatty fish in the week.'],
    sourceIds: ['nnr-2023', 'finland-adults'],
  },
  {
    id: 'fibre-plants',
    title: 'Fibre and plants make the deficit easier',
    target: '34–40 g fibre/day in the routine',
    body: 'High-volume vegetables, berries, whole grains and legumes improve food quality and make meals more filling. Finnish guidance recommends 500–800 g vegetables, fruit, berries and mushrooms, 90 g whole grains, and 50–100 g cooked legumes per day.',
    actions: ['Use frozen berries and frozen vegetables to reduce cost and waste.', 'Keep vegetables in the meal even when you swap the protein or carbohydrate.', 'Increase fibre gradually and drink enough fluid.'],
    sourceIds: ['finland-adults', 'nnr-2023'],
  },
  {
    id: 'micronutrients',
    title: 'Cover the Finnish essentials',
    target: 'Fish 2–3×/week · low-fat dairy 350–500 g/day',
    body: 'The routine repeats fish, fortified dairy or soy products, eggs, whole grains, berries and vegetables to support vitamin D, iodine, calcium, iron and other micronutrients. Use iodised salt, but keep total salt modest.',
    actions: ['Aim for 300–450 g fish per week, including at least 200 g fatty fish.', 'Check that plant drinks are fortified; soy is closest to milk for protein.', 'Vitamin D supplementation is recommended for people who do not regularly use fortified foods or fish.'],
    sourceIds: ['finland-adults', 'vitamin-d', 'iodine', 'finland-salt-iodine'],
  },
  {
    id: 'limit',
    title: 'Avoid the patterns that undo the plan',
    target: 'Water first · salt no more than 5 g/day',
    body: 'No individual food needs to be treated as forbidden. The recurring problems are liquid calories, frequent takeaway, processed meat, alcohol, salty convenience foods, and snack foods that are easy to overeat without being filling.',
    actions: ['Use water as the default drink.', 'Keep processed meat and alcohol minimal.', 'Compare labels for salt, saturated fat and added sugar.', 'Use spices, herbs, lemon, garlic and pepper before adding more salt.'],
    sourceIds: ['nnr-2023', 'finland-adults', 'finland-salt-iodine'],
  },
];

export const substitutionGroups = [
  {
    title: 'Lean animal protein',
    principle: 'Keep the cooked portion and protein density similar.',
    swaps: [
      { from: '200 g chicken breast', to: '180–200 g turkey or chicken mince', note: 'Choose a lean product; cooking method stays almost identical.' },
      { from: '200 g chicken breast', to: '150–180 g lean beef + extra beans', note: 'Use less often; the weekly plan intentionally contains only one beef meal.' },
      { from: '150 g tuna', to: '160–200 g cooked chicken or canned salmon', note: 'Drain canned products and compare salt.' },
    ],
    sourceIds: ['nnr-2023', 'finland-adults'],
  },
  {
    title: 'Fish',
    principle: 'Keep oily fish in the week for vitamin D and omega-3 fats.',
    swaps: [
      { from: 'Salmon', to: 'Rainbow trout or Arctic char', note: 'Near-direct swap by gram weight.' },
      { from: '150–180 g oily fish', to: '180–200 g white fish + 5–10 g rapeseed oil', note: 'Protein remains strong, but white fish contains less fat and omega-3.' },
      { from: 'Fresh fish', to: 'Frozen fillets or canned salmon', note: 'Useful budget option; compare salt in canned products.' },
    ],
    sourceIds: ['finland-adults'],
  },
  {
    title: 'Vegetarian protein',
    principle: 'Use a larger plant-protein portion and keep legumes in the meal.',
    swaps: [
      { from: '200 g chicken or turkey', to: '200–250 g firm tofu or tempeh', note: 'Protein may be lower; add peas, beans or a high-protein dairy/soy side.' },
      { from: '150 g beef mince', to: '150 g beans + 100–150 g soy mince', note: 'Keeps chili filling while reducing red meat.' },
      { from: 'Cottage cheese or skyr', to: 'Fortified soy alternative', note: 'Check the label: many plant yogurts contain much less protein than dairy or soy skyr-style products.' },
    ],
    sourceIds: ['finland-adults', 'nnr-2023'],
  },
  {
    title: 'Carbohydrate base',
    principle: 'Swap the base, not the vegetables and protein.',
    swaps: [
      { from: '90 g dry rice', to: '85–90 g dry whole-wheat pasta or barley', note: 'A direct meal-prep replacement.' },
      { from: '80 g dry quinoa', to: '75–90 g dry brown rice or barley', note: 'Quinoa is not required for a healthy meal.' },
      { from: '80–90 g dry grain', to: '350–450 g potatoes', note: 'Potatoes are easy to find in Finland and often more filling per calorie.' },
      { from: 'Whole-wheat tortilla', to: 'Whole-grain rye bread or a rice bowl', note: 'Useful when wraps are expensive or unavailable.' },
    ],
    sourceIds: ['finland-adults'],
  },
  {
    title: 'Vegetables and fruit',
    principle: 'Frozen and pre-cut products are fully acceptable convenience tools.',
    swaps: [
      { from: 'Broccoli, carrot or spinach', to: 'Equal grams of frozen mixed vegetables', note: 'The easiest low-effort substitution.' },
      { from: 'Fresh berries', to: 'Frozen Finnish berries', note: 'Long storage life and easy portioning.' },
      { from: 'Banana', to: 'Apple, pear or two slices of rye bread near training', note: 'Choose based on what is available and what digests comfortably.' },
    ],
    sourceIds: ['finland-adults'],
  },
  {
    title: 'Dairy, lactose-free and plant options',
    principle: 'Match protein and fortification, not only texture.',
    swaps: [
      { from: 'Skyr or rahka', to: 'Lactose-free skyr/rahka', note: 'Usually a direct nutrition swap.' },
      { from: 'Milk', to: 'Fortified soy drink', note: 'Soy is the closest common plant drink for protein; check calcium, vitamin D, iodine, B12 and riboflavin fortification.' },
      { from: 'Greek yogurt sauce', to: 'Skyr, lactose-free yogurt or fortified soy yogurt', note: 'Add lemon, dill, garlic or pepper for flavour.' },
    ],
    sourceIds: ['finland-adults', 'vitamin-d', 'iodine'],
  },
];
