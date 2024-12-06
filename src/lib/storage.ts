import { LocationData, StorageData } from './types';

const STORAGE_KEY = 'locationAnalysis';
const MAX_RECENT_SEARCHES = 10;
const MAX_FAVORITES = 20;

export class StorageManager {
  private static instance: StorageManager;
  private data: StorageData;

  private constructor() {
    this.data = this.loadFromStorage();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private loadFromStorage(): StorageData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { recentSearches: [], favorites: [] };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load from storage:', error);
      return { recentSearches: [], favorites: [] };
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
      // If storage is full, remove oldest items
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.data.recentSearches = this.data.recentSearches.slice(-5);
        this.data.favorites = this.data.favorites.slice(-10);
        this.saveToStorage();
      }
    }
  }

  public addSearch(location: Omit<LocationData, 'timestamp' | 'isFavorite'>): void {
    const newLocation: LocationData = {
      ...location,
      timestamp: Date.now(),
      isFavorite: false,
    };

    // Remove duplicate if exists
    this.data.recentSearches = this.data.recentSearches.filter(
      (item) => item.address !== location.address
    );

    // Add new search to beginning
    this.data.recentSearches.unshift(newLocation);

    // Limit recent searches
    if (this.data.recentSearches.length > MAX_RECENT_SEARCHES) {
      this.data.recentSearches = this.data.recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }

    this.saveToStorage();
  }

  public toggleFavorite(address: string): boolean {
    const searchItem = this.data.recentSearches.find(
      (item) => item.address === address
    );

    if (!searchItem) return false;

    const isFavorite = !searchItem.isFavorite;
    searchItem.isFavorite = isFavorite;

    if (isFavorite) {
      if (this.data.favorites.length >= MAX_FAVORITES) {
        this.data.favorites.pop(); // Remove oldest favorite
      }
      this.data.favorites.unshift({ ...searchItem });
    } else {
      this.data.favorites = this.data.favorites.filter(
        (item) => item.address !== address
      );
    }

    this.saveToStorage();
    return isFavorite;
  }

  public getRecentSearches(): LocationData[] {
    return this.data.recentSearches;
  }

  public getFavorites(): LocationData[] {
    return this.data.favorites;
  }

  public clearHistory(): void {
    this.data.recentSearches = [];
    this.saveToStorage();
  }

  public clearFavorites(): void {
    this.data.favorites = [];
    this.data.recentSearches.forEach((item) => {
      item.isFavorite = false;
    });
    this.saveToStorage();
  }
}