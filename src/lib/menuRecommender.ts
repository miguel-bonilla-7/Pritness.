/**
 * Returns 1-2 meal suggestions based on current time and remaining macros.
 */
export function getMenuSuggestions(
  remainingCal: number,
  remainingProtein: number,
  _remainingCarbs: number,
  _remainingFat: number,
  hour: number
): { label: string; description: string; protein: number; calories: number }[] {
  const suggestions: { label: string; description: string; protein: number; calories: number }[] = []

  if (hour >= 6 && hour < 11) {
    if (remainingProtein >= 25) {
      suggestions.push({
        label: 'Desayuno alto en proteína',
        description: 'Huevos revueltos con pan integral y aguacate',
        protein: 25,
        calories: 380,
      })
    }
    if (remainingCal >= 300 && suggestions.length < 2) {
      suggestions.push({
        label: 'Batido de avena y plátano',
        description: 'Avena, plátano, leche y miel',
        protein: 12,
        calories: 320,
      })
    }
  } else if (hour >= 11 && hour < 15) {
    if (remainingProtein >= 30) {
      suggestions.push({
        label: 'Pechuga de pavo o pollo',
        description: 'Con ensalada y arroz integral',
        protein: 35,
        calories: 450,
      })
    }
    if (remainingCal >= 400 && suggestions.length < 2) {
      suggestions.push({
        label: 'Bowl de quinoa y garbanzos',
        description: 'Quinoa, garbanzos, verduras y aceite de oliva',
        protein: 18,
        calories: 420,
      })
    }
  } else if (hour >= 15 && hour < 20) {
    if (remainingProtein >= 20) {
      suggestions.push({
        label: 'Batido de whey',
        description: 'Whey protein con leche y plátano',
        protein: 28,
        calories: 280,
      })
    }
    if (remainingProtein >= 25 && suggestions.length < 2) {
      suggestions.push({
        label: 'Yogur griego con nueces',
        description: 'Yogur, nueces y miel',
        protein: 15,
        calories: 250,
      })
    }
  } else {
    if (remainingProtein >= 25) {
      suggestions.push({
        label: 'Cena ligera con pescado',
        description: 'Pescado al horno con verduras',
        protein: 30,
        calories: 350,
      })
    }
    if (remainingCal >= 200 && suggestions.length < 2) {
      suggestions.push({
        label: 'Ensalada con pollo',
        description: 'Lechuga, pollo a la plancha y vinagreta',
        protein: 22,
        calories: 280,
      })
    }
  }

  return suggestions.slice(0, 2)
}
