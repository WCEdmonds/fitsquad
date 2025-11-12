# ExerciseDB API Integration Setup

This document explains how to configure the ExerciseDB API integration for the Plan Editor.

## Overview

The Plan Editor now integrates with ExerciseDB, providing access to a comprehensive database of exercises with images, instructions, and detailed information. Users can browse, search, and add exercises from the database directly into their workout plans.

## Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in the root directory of the project:

```bash
cp .env.local.example .env.local
```

### 2. Configure API Settings

Edit `.env.local` and add your ExerciseDB API configuration:

```env
# ExerciseDB API Configuration
NEXT_PUBLIC_EXERCISEDB_API_URL=https://exercisedb-leir1yxoj-wcedmonds-projects.vercel.app/api/v1
NEXT_PUBLIC_EXERCISEDB_API_KEY=your_api_key_here
```

**Important:** Replace `your_api_key_here` with your actual API key.

### 3. Authentication Configuration

The API client in `src/lib/exercisedb/api.ts` is configured to send the API key in the request headers.

**Current implementation:**
```typescript
headers['X-API-Key'] = API_KEY;
```

**If your API uses Bearer token authentication instead:**

Update the `getHeaders()` function in `src/lib/exercisedb/api.ts`:

```typescript
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  return headers;
}
```

**If your API uses query parameter authentication:**

Update the `fetchAPI()` function in `src/lib/exercisedb/api.ts`:

```typescript
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (API_KEY) {
    url.searchParams.append('api_key', API_KEY);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'force-cache',
  });

  // ... rest of the function
}
```

### 4. Restart Development Server

After configuring the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Available API Endpoints

The ExerciseDB integration supports the following endpoints:

- `GET /api/v1/exercises?limit=X&offset=Y` - Get all exercises (with pagination)
- `GET /api/v1/exercises/{id}` - Get specific exercise by ID
- `GET /api/v1/exercises/search?q=query` - Search exercises by name (requires `q` parameter)
- `GET /api/v1/exercises/filter` - Filter exercises by criteria
- `GET /api/v1/bodyparts/{bodyPart}/exercises` - Get exercises by body part
- `GET /api/v1/equipments/{equipment}/exercises` - Get exercises by equipment
- `GET /api/v1/muscles/{muscle}/exercises` - Get exercises by target muscle

## Features

### Exercise Browser
- **Search**: Find exercises by name or keyword
- **Filter by Body Part**: Filter exercises by specific body parts (chest, back, legs, etc.)
- **Filter by Equipment**: Filter by equipment type (barbell, dumbbell, body weight, etc.)
- **Visual Preview**: See exercise GIFs/images before adding
- **Detailed Instructions**: View step-by-step instructions for each exercise

### Data Structure

The API returns paginated responses with metadata and exercise data.

**Response Structure:**
```json
{
  "success": true,
  "metadata": {
    "totalPages": 300,
    "totalExercises": 1500,
    "currentPage": 1,
    "previousPage": null,
    "nextPage": "URL"
  },
  "data": [/* array of exercises */]
}
```

**Each exercise includes:**
- `exerciseId`: Unique identifier
- `name`: Exercise name
- `bodyParts`: Array of primary body parts targeted
- `targetMuscles`: Array of specific target muscles
- `equipments`: Array of required equipment
- `gifUrl`: Animated demonstration URL
- `instructions`: Array of step-by-step instructions
- `secondaryMuscles`: Array of additional muscles worked

## Usage in Plan Editor

1. **Navigate to Plan Editor**: Click "Plan Editor" in the dashboard navigation
2. **Click a day**: Select any day in the 8-week calendar
3. **Select "Exercise Database" tab**: Browse the comprehensive exercise library
4. **Search & Filter**: Use the left sidebar to narrow down exercises
5. **Select an exercise**: Click on any exercise to view full details
6. **Add to workout**: Click "Add to Workout" button
7. **Customize**: Switch to "Custom Workout" tab to adjust sets, reps, and rest
8. **Save**: Click "Save Plan" to persist changes

## Troubleshooting

### 401 Unauthorized Error
- Verify your API key is correct in `.env.local`
- Check that the authentication method matches your API (header vs query param)
- Ensure the `.env.local` file is in the project root
- Restart the development server after changing environment variables

### No Exercises Loading
- Check browser console for error messages
- Verify the API base URL is correct
- Test the API endpoint directly in Postman or browser
- Check network tab in browser DevTools

### Images Not Displaying
- Verify the `gifUrl` field is present in API responses
- Check that the image URLs are accessible
- Look for CORS errors in the browser console

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_EXERCISEDB_API_URL` | Base URL for the ExerciseDB API | Yes | `https://exercisedb-leir1yxoj-wcedmonds-projects.vercel.app/api/v1` |
| `NEXT_PUBLIC_EXERCISEDB_API_KEY` | Authentication key for the API | Yes (if auth required) | `your_api_key_here` |

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local.example` file is provided as a template
- API keys prefixed with `NEXT_PUBLIC_` are exposed to the browser
- For production, consider using server-side API routes to proxy requests and keep API keys secure

## Support

If you encounter issues with the ExerciseDB integration, check:
1. Environment variable configuration
2. API authentication method
3. Network connectivity
4. Browser console for error messages
