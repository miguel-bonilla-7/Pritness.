
export interface MealSuggestion {
  label: string
  description: string
  protein: number
  calories: number
  carbs: number
  fat: number
  image: string
  ingredients: string[]
  recipe: string[]
}

const ALL_MEALS: Record<string, MealSuggestion> = {
  eggs: {
    label: 'Huevos revueltos con aguacate',
    description: 'Desayuno alto en proteína con grasas saludables',
    protein: 25,
    calories: 380,
    carbs: 22,
    fat: 20,
    image: 'eggs',
    ingredients: [
      '3 huevos grandes',
      '½ aguacate en rodajas',
      '2 rebanadas de pan integral',
      '1 cdta de aceite de oliva',
      'Sal, pimienta y cebollín al gusto',
    ],
    recipe: [
      'Bate los huevos con sal y pimienta.',
      'Calienta el aceite en sartén a fuego medio.',
      'Vierte los huevos y revuelve suavemente hasta que cuajen.',
      'Tuesta el pan y coloca los huevos encima.',
      'Añade el aguacate en rodajas y el cebollín.',
    ],
  },
  oatmeal: {
    label: 'Batido de avena y plátano',
    description: 'Energía rápida y saciante para empezar el día',
    protein: 12,
    calories: 320,
    carbs: 55,
    fat: 6,
    image: 'smoothie',
    ingredients: [
      '½ taza de avena en hojuelas',
      '1 plátano maduro',
      '1 taza de leche (o vegetal)',
      '1 cdta de miel',
      '1 pizca de canela',
    ],
    recipe: [
      'Agrega todos los ingredientes a la licuadora.',
      'Licúa durante 60 segundos hasta obtener una mezcla suave.',
      'Ajusta la consistencia con más leche si es necesario.',
      'Sirve frío o a temperatura ambiente.',
    ],
  },
  chicken: {
    label: 'Pechuga de pollo con arroz integral',
    description: 'Almuerzo completo rico en proteína magra',
    protein: 35,
    calories: 450,
    carbs: 42,
    fat: 9,
    image: 'chicken',
    ingredients: [
      '180 g de pechuga de pollo',
      '¾ taza de arroz integral cocido',
      '1 taza de ensalada mixta',
      '1 cdta de aceite de oliva',
      'Limón, ajo y especias al gusto',
    ],
    recipe: [
      'Sazona la pechuga con ajo, limón, sal y pimienta.',
      'Cocina en sartén antiadherente 6-7 min por cada lado.',
      'Deja reposar 2 minutos y corta en láminas.',
      'Sirve sobre el arroz integral y acompaña con ensalada.',
    ],
  },
  quinoa: {
    label: 'Bowl de quinoa y garbanzos',
    description: 'Proteína vegetal completa con fibra y antioxidantes',
    protein: 18,
    calories: 420,
    carbs: 58,
    fat: 12,
    image: 'quinoa',
    ingredients: [
      '½ taza de quinoa cocida',
      '½ lata de garbanzos escurridos',
      '1 taza de espinacas y tomates cherry',
      '¼ pepino en cubos',
      '1 cda de aceite de oliva + limón',
    ],
    recipe: [
      'Cocina la quinoa según instrucciones del empaque.',
      'Mezcla garbanzos, espinacas, tomates y pepino.',
      'Añade la quinoa al bowl y mezcla bien.',
      'Aliña con aceite de oliva, limón, sal y pimienta.',
    ],
  },
  shake: {
    label: 'Batido de proteína con plátano',
    description: 'Recuperación muscular rápida post-entreno',
    protein: 28,
    calories: 280,
    carbs: 30,
    fat: 5,
    image: 'smoothie',
    ingredients: [
      '1 scoop (30 g) de whey protein',
      '1 plátano mediano',
      '1 taza de leche descremada',
      '4-5 cubos de hielo',
      'Opcional: 1 cdta de mantequilla de maní',
    ],
    recipe: [
      'Agrega todos los ingredientes a la licuadora.',
      'Licúa a velocidad alta 45 segundos.',
      'Sirve de inmediato para aprovechar la proteína.',
    ],
  },
  yogurt: {
    label: 'Yogur griego con nueces y miel',
    description: 'Snack rico en calcio y grasas saludables',
    protein: 15,
    calories: 250,
    carbs: 24,
    fat: 10,
    image: 'yogurt',
    ingredients: [
      '200 g de yogur griego natural',
      '1 cda de miel de abeja',
      '20 g de nueces troceadas',
      'Opcional: frutas del bosque o granola',
    ],
    recipe: [
      'Sirve el yogur griego en un bowl.',
      'Agrega las nueces encima.',
      'Drizzlea la miel por toda la superficie.',
      'Añade frutas o granola si lo deseas.',
    ],
  },
  fish: {
    label: 'Pescado al horno con verduras',
    description: 'Cena ligera, rica en omega-3 y minerales',
    protein: 30,
    calories: 350,
    carbs: 18,
    fat: 14,
    image: 'fish',
    ingredients: [
      '200 g de filete de salmón o tilapia',
      '1 zucchini en rodajas',
      '1 pimiento rojo en tiras',
      '½ limón en rodajas',
      '1 cda de aceite de oliva + hierbas finas',
    ],
    recipe: [
      'Precalienta el horno a 200 °C.',
      'Coloca el pescado y las verduras en charola.',
      'Aliña con aceite, limón, sal, pimienta y hierbas.',
      'Hornea 18-22 minutos hasta que el pescado esté opaco.',
    ],
  },
  salad: {
    label: 'Ensalada de pollo a la plancha',
    description: 'Cena fresca, baja en calorías y alta en proteína',
    protein: 22,
    calories: 280,
    carbs: 12,
    fat: 11,
    image: 'salad',
    ingredients: [
      '150 g de pechuga a la plancha en tiras',
      '2 tazas de lechuga mixta',
      '½ tomate en gajos',
      '¼ pepino en rodajas',
      '1 cda de vinagreta ligera',
    ],
    recipe: [
      'Cocina la pechuga sazonada en sartén a fuego medio-alto.',
      'Lava y seca las hojas de lechuga.',
      'Mezcla todos los vegetales en un bowl grande.',
      'Agrega el pollo en tiras y aliña con vinagreta.',
    ],
  },
}

export function getMenuSuggestions(
  remainingCal: number,
  remainingProtein: number,
  _remainingCarbs: number,
  _remainingFat: number,
  hour: number
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = []

  if (hour >= 6 && hour < 11) {
    if (remainingProtein >= 25) suggestions.push(ALL_MEALS.eggs)
    if (remainingCal >= 300 && suggestions.length < 3) suggestions.push(ALL_MEALS.oatmeal)
    if (suggestions.length < 3) suggestions.push(ALL_MEALS.yogurt)
  } else if (hour >= 11 && hour < 15) {
    if (remainingProtein >= 30) suggestions.push(ALL_MEALS.chicken)
    if (remainingCal >= 400 && suggestions.length < 3) suggestions.push(ALL_MEALS.quinoa)
    if (suggestions.length < 3) suggestions.push(ALL_MEALS.salad)
  } else if (hour >= 15 && hour < 20) {
    if (remainingProtein >= 20) suggestions.push(ALL_MEALS.shake)
    if (remainingProtein >= 15 && suggestions.length < 3) suggestions.push(ALL_MEALS.yogurt)
    if (suggestions.length < 3) suggestions.push(ALL_MEALS.eggs)
  } else {
    if (remainingProtein >= 25) suggestions.push(ALL_MEALS.fish)
    if (remainingCal >= 200 && suggestions.length < 3) suggestions.push(ALL_MEALS.salad)
    if (suggestions.length < 3) suggestions.push(ALL_MEALS.quinoa)
  }

  return suggestions.slice(0, 3)
}
