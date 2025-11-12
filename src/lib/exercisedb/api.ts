/**
 * ExerciseDB API Client
 * Handles all interactions with the ExerciseDB API hosted on Vercel
 */

import type { Exercise, ExerciseAPIResponse, ExerciseFilters, ExerciseSearchParams } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_EXERCISEDB_API_URL || 'https://exercisedb-leir1yxoj-wcedmonds-projects.vercel.app/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_EXERCISEDB_API_KEY;

/**
 * Create headers with authentication (if needed)
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key if configured
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
    // Alternative for other auth methods:
    // headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  return headers;
}

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI(endpoint: string): Promise<ExerciseAPIResponse> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('🔄 Fetching from ExerciseDB:', fullUrl);
  console.log('📡 API Base URL:', API_BASE_URL);
  console.log('🔑 API Key configured:', !!API_KEY);

  try {
    const response = await fetch(fullUrl, {
      headers: getHeaders(),
      cache: 'force-cache', // Cache exercise data since it doesn't change often
    });

    console.log('📡 API Response status:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response Body:', errorText);
      throw new Error(`ExerciseDB API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Data received:', {
      success: data.success,
      hasMetadata: !!data.metadata,
      totalExercises: data.metadata?.totalExercises,
      exercisesReturned: data.data?.length,
      firstExercise: data.data?.[0]?.name
    });

    return data;
  } catch (error) {
    console.error('❌ ExerciseDB API error:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Get all exercises with optional pagination
 */
export async function getAllExercises(limit: number = 100, offset: number = 0): Promise<Exercise[]> {
  const response = await fetchAPI(`/exercises?limit=${limit}&offset=${offset}`);
  return response.data;
}

/**
 * Get a specific exercise by ID
 */
export async function getExerciseById(exerciseId: string): Promise<Exercise> {
  const response = await fetchAPI(`/exercises/${exerciseId}`);
  return response.data[0]; // Assuming single exercise response
}

/**
 * Search exercises by query string
 */
export async function searchExercises(params: ExerciseSearchParams): Promise<Exercise[]> {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.append('q', params.q); // Use 'q' parameter
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const response = await fetchAPI(`/exercises/search?${queryParams.toString()}`);
  return response.data;
}

/**
 * Filter exercises
 */
export async function filterExercises(filters: ExerciseFilters): Promise<Exercise[]> {
  const queryParams = new URLSearchParams();

  if (filters.bodyPart) queryParams.append('bodyPart', filters.bodyPart);
  if (filters.equipment) queryParams.append('equipment', filters.equipment);
  if (filters.muscle) queryParams.append('muscle', filters.muscle);
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.offset) queryParams.append('offset', filters.offset.toString());

  const response = await fetchAPI(`/exercises/filter?${queryParams.toString()}`);
  return response.data;
}

/**
 * Get exercises by body part
 */
export async function getExercisesByBodyPart(bodyPartName: string): Promise<Exercise[]> {
  const response = await fetchAPI(`/bodyparts/${encodeURIComponent(bodyPartName)}/exercises`);
  return response.data;
}

/**
 * Get exercises by equipment
 */
export async function getExercisesByEquipment(equipmentName: string): Promise<Exercise[]> {
  const response = await fetchAPI(`/equipments/${encodeURIComponent(equipmentName)}/exercises`);
  return response.data;
}

/**
 * Get exercises by target muscle
 */
export async function getExercisesByMuscle(muscleName: string): Promise<Exercise[]> {
  const response = await fetchAPI(`/muscles/${encodeURIComponent(muscleName)}/exercises`);
  return response.data;
}

/**
 * Common body parts for quick filtering
 */
export const BODY_PARTS = [
  'back',
  'cardio',
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist',
] as const;

/**
 * Common equipment types
 */
export const EQUIPMENT_TYPES = [
  'assisted',
  'band',
  'barbell',
  'body weight',
  'bosu ball',
  'cable',
  'dumbbell',
  'elliptical machine',
  'ez barbell',
  'hammer',
  'kettlebell',
  'leverage machine',
  'medicine ball',
  'olympic barbell',
  'resistance band',
  'roller',
  'rope',
  'skierg machine',
  'sled machine',
  'smith machine',
  'stability ball',
  'stationary bike',
  'stepmill machine',
  'tire',
  'trap bar',
  'upper body ergometer',
  'weighted',
  'wheel roller',
] as const;
