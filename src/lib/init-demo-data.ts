/**
 * Initialize demo data for the App Store review account
 * This function creates sample teams, soldiers, and workout plans
 * exclusively for appstorereview@qndary.com
 */

import {
  Firestore,
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import {
  DEMO_ACCOUNT_EMAIL,
  DEMO_SOLDIERS,
  DEMO_TEAM_DATA,
  DEMO_WORKOUT_PLAN,
  DEMO_AI_PLAN_TITLE,
  DEMO_AI_PLAN_CONTENT,
} from './demo-data';
import { Account, Soldier } from './types';

interface DemoInitResult {
  success: boolean;
  message: string;
  data?: {
    teamId: string;
    teamCode: string;
    soldierCount: number;
    plansCreated: number;
  };
  error?: string;
}

/**
 * Check if demo data already exists for an account
 */
export async function checkDemoDataExists(
  firestore: Firestore,
  accountId: string
): Promise<boolean> {
  try {
    const teamRef = collection(firestore, 'accounts', accountId, 'managedTeams');
    const q = query(teamRef, where('name', '==', DEMO_TEAM_DATA.name));
    const snapshot = await getDocs(q);
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking demo data:', error);
    return false;
  }
}

/**
 * Initialize demo data for the review account
 * Creates:
 * - 1 demo team
 * - 8 sample soldiers with realistic ACFT scores
 * - 2 workout plans (manual + AI-generated)
 */
export async function initializeDemoData(
  firestore: Firestore,
  accountId: string,
  accountEmail: string
): Promise<DemoInitResult> {
  try {
    // Verify this is the demo account
    if (accountEmail.toLowerCase() !== DEMO_ACCOUNT_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: 'Demo data can only be initialized for the review account',
        error: 'Unauthorized account',
      };
    }

    // Check if demo data already exists
    const exists = await checkDemoDataExists(firestore, accountId);
    if (exists) {
      return {
        success: true,
        message: 'Demo data already initialized for this account',
      };
    }

    console.log('Initializing demo data for review account...');

    // 1. Create the demo team
    const teamsCollection = collection(firestore, 'teams');
    const teamDocRef = doc(teamsCollection);
    const teamId = teamDocRef.id;

    const teamData = {
      id: teamId,
      ...DEMO_TEAM_DATA,
      createdAt: new Date().toISOString(),
      createdBy: accountId,
    };

    await setDoc(teamDocRef, teamData);
    console.log('✅ Created demo team:', teamId);

    // 2. Add demo team to account's managed teams
    const managedTeamsRef = collection(firestore, 'accounts', accountId, 'managedTeams');
    await setDoc(doc(managedTeamsRef, teamId), {
      id: teamId,
      name: DEMO_TEAM_DATA.name,
      teamCode: DEMO_TEAM_DATA.teamCode,
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Added team to managed teams');

    // 3. Create demo soldiers and add to team
    const soldierPromises = DEMO_SOLDIERS.map(async (soldierData, index) => {
      // Create unclaimed account for each soldier
      const accountsCollection = collection(firestore, 'accounts');
      const soldierAccountRef = doc(accountsCollection);
      const soldierId = soldierAccountRef.id;

      const soldierAccount: Partial<Account> = {
        id: soldierId,
        email: soldierData.email,
        firstName: soldierData.firstName,
        lastName: soldierData.lastName,
        gender: soldierData.gender,
        accountType: 'Soldier',
        teamId: teamId,
        claimed: false,
        createdBy: accountId,
        createdAt: new Date().toISOString(),
      };

      await setDoc(soldierAccountRef, soldierAccount);

      // Add soldier to team members
      const membersRef = collection(firestore, 'teams', teamId, 'members');
      await setDoc(doc(membersRef, soldierId), {
        uid: soldierId,
        email: soldierData.email,
        role: 'Soldier',
      });

      // Create initial soldier data
      const soldierDataCol = collection(firestore, 'accounts', soldierId, 'soldierData');
      await addDoc(soldierDataCol, {
        accountId: soldierId,
        createdAt: new Date().toISOString(),
        gender: soldierData.gender,
        weight: soldierData.weight,
        height: soldierData.height,
        mdl: soldierData.mdl,
        hrp: soldierData.hrp,
        sdc: soldierData.sdc,
        plk: soldierData.plk,
        twoMileRun: soldierData.twoMileRun,
        healthInfo: soldierData.healthNotes,
      });

      console.log(`✅ Created soldier ${index + 1}: ${soldierData.firstName} ${soldierData.lastName}`);

      return { soldierId, ...soldierData };
    });

    const createdSoldiers = await Promise.all(soldierPromises);
    console.log(`✅ Created ${createdSoldiers.length} demo soldiers`);

    // 4. Create manual workout plan
    const workoutPlansRef = collection(firestore, 'teams', teamId, 'workoutPlans');
    const manualPlanRef = doc(workoutPlansRef);

    await setDoc(manualPlanRef, {
      id: manualPlanRef.id,
      title: DEMO_WORKOUT_PLAN.title,
      unitType: DEMO_WORKOUT_PLAN.unitType,
      trainingGoals: DEMO_WORKOUT_PLAN.trainingGoals,
      planContent: DEMO_WORKOUT_PLAN.planContent,
      createdAt: new Date().toISOString(),
      createdBy: accountId,
    });
    console.log('✅ Created manual workout plan');

    // 5. Create AI-generated workout plan
    const aiPlanRef = doc(workoutPlansRef);
    await setDoc(aiPlanRef, {
      id: aiPlanRef.id,
      title: DEMO_AI_PLAN_TITLE,
      unitType: 'Platoon',
      trainingGoals: 'AI-optimized training based on unit performance data',
      planContent: DEMO_AI_PLAN_CONTENT,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      createdBy: accountId,
      isAIGenerated: true,
    });
    console.log('✅ Created AI-generated workout plan');

    // 6. Add main plan (the active team plan)
    const mainPlanRef = collection(firestore, 'teams', teamId, 'mainPlan');
    await setDoc(doc(mainPlanRef, 'active'), {
      planId: manualPlanRef.id,
      planTitle: DEMO_WORKOUT_PLAN.title,
      activatedAt: new Date().toISOString(),
      activatedBy: accountId,
      planContent: DEMO_WORKOUT_PLAN.planContent,
    });
    console.log('✅ Set main active plan');

    return {
      success: true,
      message: 'Demo data successfully initialized',
      data: {
        teamId,
        teamCode: DEMO_TEAM_DATA.teamCode,
        soldierCount: createdSoldiers.length,
        plansCreated: 2,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error initializing demo data:', error);
    return {
      success: false,
      message: 'Failed to initialize demo data',
      error: errorMessage,
    };
  }
}

/**
 * Clear demo data (for testing purposes)
 * Only works for the demo account
 */
export async function clearDemoData(
  firestore: Firestore,
  accountId: string,
  accountEmail: string
): Promise<DemoInitResult> {
  try {
    if (accountEmail.toLowerCase() !== DEMO_ACCOUNT_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: 'Can only clear demo data for the review account',
        error: 'Unauthorized',
      };
    }

    // This is a safety mechanism - in production you'd want
    // more careful handling of cascading deletes
    return {
      success: true,
      message: 'Demo data clear function ready (implement with caution)',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: 'Failed to clear demo data',
      error: errorMessage,
    };
  }
}
