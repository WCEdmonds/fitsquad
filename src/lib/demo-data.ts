/**
 * Demo data for App Store review account (appstorereview@qndary.com)
 * This data is isolated and only accessible to the review account
 */

import { Soldier, Account } from './types';

export const DEMO_ACCOUNT_EMAIL = 'appstorereview@qndary.com';

/**
 * Sample soldiers with realistic ACFT scores and fitness data
 */
export const DEMO_SOLDIERS: Omit<Soldier, 'id' | 'teamId' | 'teamName'>[] = [
  {
    email: 'sgt.johnson@demo.com',
    firstName: 'James',
    lastName: 'Johnson',
    rank: 'Sergeant',
    mdl: 285,      // Excellent deadlift
    hrp: 68,       // Very good push-ups
    sdc: 2210,     // Good sprint-drag-carry (seconds)
    plk: 240,      // Good plank (seconds)
    twoMileRun: 1080, // Good run time
    gender: 'Male',
    weight: 185,
    height: 70,
    healthNotes: 'No restrictions, peak fitness condition',
  },
  {
    email: 'cpl.martinez@demo.com',
    firstName: 'Maria',
    lastName: 'Martinez',
    rank: 'Corporal',
    mdl: 245,
    hrp: 72,
    sdc: 2340,
    plk: 200,
    twoMileRun: 1140,
    gender: 'Female',
    weight: 155,
    height: 66,
    healthNotes: 'Excellent cardiovascular fitness',
  },
  {
    email: 'pfc.thompson@demo.com',
    firstName: 'Robert',
    lastName: 'Thompson',
    rank: 'Private First Class',
    mdl: 210,
    hrp: 45,
    sdc: 2550,
    plk: 180,
    twoMileRun: 1380,
    gender: 'Male',
    weight: 165,
    height: 68,
    healthNotes: 'Working on upper body strength',
  },
  {
    email: 'spc.williams@demo.com',
    firstName: 'Sarah',
    lastName: 'Williams',
    rank: 'Specialist',
    mdl: 265,
    hrp: 80,
    sdc: 2100,
    plk: 280,
    twoMileRun: 1020,
    gender: 'Female',
    weight: 160,
    height: 67,
    healthNotes: 'Outstanding performer, excellent form',
  },
  {
    email: 'pvt.davis@demo.com',
    firstName: 'Michael',
    lastName: 'Davis',
    rank: 'Private',
    mdl: 190,
    hrp: 38,
    sdc: 2720,
    plk: 150,
    twoMileRun: 1560,
    gender: 'Male',
    weight: 170,
    height: 69,
    healthNotes: 'New soldier, improving rapidly',
  },
  {
    email: 'sgt.garcia@demo.com',
    firstName: 'Carlos',
    lastName: 'Garcia',
    rank: 'Sergeant',
    mdl: 310,
    hrp: 75,
    sdc: 2050,
    plk: 300,
    twoMileRun: 960,
    gender: 'Male',
    weight: 195,
    height: 72,
    healthNotes: 'Unit leader, excellent physical condition',
  },
  {
    email: 'cpl.lee@demo.com',
    firstName: 'Jennifer',
    lastName: 'Lee',
    rank: 'Corporal',
    mdl: 235,
    hrp: 65,
    sdc: 2420,
    plk: 210,
    twoMileRun: 1200,
    gender: 'Female',
    weight: 145,
    height: 64,
    healthNotes: 'Consistent performer',
  },
  {
    email: 'pfc.clark@demo.com',
    firstName: 'David',
    lastName: 'Clark',
    rank: 'Private First Class',
    mdl: 220,
    hrp: 52,
    sdc: 2480,
    plk: 165,
    twoMileRun: 1420,
    gender: 'Male',
    weight: 175,
    height: 71,
    healthNotes: 'Good potential, needs conditioning focus',
  },
];

/**
 * Sample team data
 */
export const DEMO_TEAM_DATA = {
  name: 'Demo Unit - 2nd Platoon',
  teamCode: 'DEMO2024',
  description: 'Sample unit for testing FitSquad features',
};

/**
 * Sample workout plan with exercises
 */
export const DEMO_WORKOUT_PLAN = {
  title: 'ACFT Strength & Conditioning (2-Week)',
  unitType: 'Platoon',
  trainingGoals: 'Build ACFT preparedness with focus on max deadlift and upper body strength',
  planContent: `
## Week 1: Strength Focus
- Monday: Lower Body & Core (Deadlifts, Planks, Leg Circuits)
- Tuesday: Upper Body (Push-ups, Pull-ups, Bench Press)
- Wednesday: Rest or Light Cardio
- Thursday: Full Body Circuit (Mimics ACFT events)
- Friday: Upper Body & Conditioning
- Saturday: Long Run + Core Work
- Sunday: Rest

## Week 2: Power & Endurance
- Monday: Olympic Lift Progression (Power Cleans, Snatches)
- Tuesday: ACFT-Specific Drills (Sprint-Drag-Carry practice)
- Wednesday: Conditioning Circuits
- Thursday: Speed & Agility Work
- Friday: Functional Strength
- Saturday: 2-Mile Run Time Trial
- Sunday: Recovery/Mobility

### Key Exercises:
1. **Max Deadlift** - 6x2 at 85-90% 1RM
2. **Hand Release Push-ups** - 3x max reps
3. **Sprint-Drag-Carry** - 4x50m intervals
4. **Planks & Core** - 3x max hold
5. **Cardiovascular** - Varied distances & paces
  `,
};

/**
 * Sample AI-generated workout plan content
 */
export const DEMO_AI_PLAN_TITLE = 'Smart-Generated: Balanced ACFT Prep';
export const DEMO_AI_PLAN_CONTENT = `
## AI-Generated Balanced Training Plan

### Unit Profile Analysis
- Average Age: 28 years
- Fitness Level: Intermediate to Advanced
- Team Strength: Excellent deadlift (avg 262 lbs), good cardio (avg 1200 sec 2-mile)
- Areas for Improvement: Hand-release push-up form and consistency

### Recommended Focus Areas
1. **Upper Body Endurance** - Increase hand-release push-up reps (primary weakness)
2. **Explosive Power** - Olympic lifts for functional strength
3. **Aerobic Capacity** - Progressive running protocols

### Training Block (4 weeks)
**Weeks 1-2: Foundation**
- Mon: Deadlift variations (5x5 @ 75%)
- Tue: Push-up progressions (5 sets, RPE 8)
- Wed: Active recovery
- Thu: Lower body speed work
- Fri: Upper body endurance
- Sat: Long steady-state run (8-10 miles)

**Weeks 3-4: Intensification**
- Mon: Heavy deadlifts (3x3 @ 90%)
- Tue: Max effort push-ups (3-5 sets)
- Wed: ACFT-specific circuit
- Thu: Agility & acceleration
- Fri: Strength endurance
- Sat: Tempo run (6 miles @ 7:30/mi pace)

### Expected Outcomes
- Hand-release push-up increase: +15-20%
- Deadlift improvement: +10-15 lbs avg
- 2-Mile run: -30-60 seconds avg
- Overall ACFT score improvement: +5-8 points
`;

/**
 * Initialize demo data structure
 */
export interface DemoDataStructure {
  account: Partial<Account>;
  team: {
    id: string;
    name: string;
    teamCode: string;
  };
  soldiers: Array<{
    accountId: string;
    email: string;
    firstName: string;
    lastName: string;
    rank: string;
  }>;
  workoutPlans: Array<{
    id: string;
    title: string;
    exercises: number;
  }>;
}

/**
 * Helper to check if an email is the demo account
 */
export function isDemoAccount(email: string | undefined): boolean {
  return email?.toLowerCase() === DEMO_ACCOUNT_EMAIL.toLowerCase();
}

/**
 * Generate realistic ACFT score variations for different fitness levels
 */
export function generateVariedSoldierData(baseSoldier: Soldier, variation: number): Soldier {
  const factor = (100 + (Math.random() - 0.5) * variation * 2) / 100;
  return {
    ...baseSoldier,
    mdl: Math.round(baseSoldier.mdl * factor),
    hrp: Math.round(baseSoldier.hrp * factor),
    sdc: Math.round(baseSoldier.sdc * factor),
    plk: Math.round(baseSoldier.plk * factor),
    twoMileRun: Math.round(baseSoldier.twoMileRun * factor),
  };
}
