import type { Recipe } from './openai-analyzer'

export class FavoritesStorage {
  private static readonly STORAGE_KEY = 'feed-me-favorites'

  static saveFavorite(recipe: Recipe): void {
    try {
      const favorites = this.getAllFavorites()
      const recipeWithFavorite = { ...recipe, isFavorite: true }
      
      // Remove existing recipe if it exists and add the new one
      const filteredFavorites = favorites.filter(f => f.id !== recipe.id)
      const updatedFavorites = [...filteredFavorites, recipeWithFavorite]
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFavorites))
    } catch (error) {
      console.error('Failed to save favorite:', error)
    }
  }

  static removeFavorite(recipeId: string): void {
    try {
      const favorites = this.getAllFavorites()
      const updatedFavorites = favorites.filter(recipe => recipe.id !== recipeId)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedFavorites))
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }

  static getAllFavorites(): Recipe[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const favorites = JSON.parse(stored)
      return Array.isArray(favorites) ? favorites : []
    } catch (error) {
      console.error('Failed to load favorites:', error)
      return []
    }
  }

  static isFavorite(recipeId: string): boolean {
    const favorites = this.getAllFavorites()
    return favorites.some(recipe => recipe.id === recipeId)
  }

  static getFavoriteById(recipeId: string): Recipe | undefined {
    const favorites = this.getAllFavorites()
    return favorites.find(recipe => recipe.id === recipeId)
  }

  static clearAllFavorites(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear favorites:', error)
    }
  }

  static getFavoritesCount(): number {
    return this.getAllFavorites().length
  }

  static getFavoritesByDate(): Recipe[] {
    const favorites = this.getAllFavorites()
    return favorites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
}