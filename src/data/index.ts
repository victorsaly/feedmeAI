import recipesData from './recipes.json'
import categoriesData from './categories.json'
import exampleImagesData from './example-images.json'

export const recipes = recipesData
export const categories = categoriesData
export const exampleImages = exampleImagesData

// Legacy compatibility - combine all data like the original structure
export const quickRecipesData = {
  quickRecipes: recipes,
  categories: categories,
  exampleImages: exampleImages
}

export default quickRecipesData