/**
 * Categories & Skills Service
 */

import { apiClient } from './api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  module: 'local-services' | 'jobs' | 'projects';
  parentId?: string;
  // Backend includes `children` not `subcategories`
  children?: Category[];
}

export interface Skill {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
}

class CategoriesService {
  async getCategories(module?: string): Promise<Category[]> {
    const url = module ? `/categories?module=${module}` : '/categories';
    // success(res, array) — api-client returns array directly
    const response = await apiClient.get<Category[]>(url, false);
    return Array.isArray(response) ? response : [];
  }

  async getCategoriesByModule(module: 'local-services' | 'jobs' | 'projects'): Promise<Category[]> {
    // Route: GET /categories/:module
    const response = await apiClient.get<Category[]>(`/categories/${module}`, false);
    return Array.isArray(response) ? response : [];
  }

  async getSkills(categoryId?: string): Promise<Skill[]> {
    const url = categoryId ? `/skills?categoryId=${categoryId}` : '/skills';
    // success(res, array) — api-client returns array directly
    const response = await apiClient.get<Skill[]>(url, false);
    return Array.isArray(response) ? response : [];
  }
}

export const categoriesService = new CategoriesService();
