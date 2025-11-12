import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import { Account, SoldierData } from './types';

/**
 * Generates a unique 8-character claim code
 */
export function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar-looking chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique ID for unclaimed profiles
 */
export function generateUnclaimedProfileId(): string {
  return `unclaimed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates an unclaimed profile for a team member
 */
export async function createUnclaimedProfile(
  firestore: Firestore,
  profileData: {
    firstName: string;
    lastName: string;
    email?: string;
    gender: 'Male' | 'Female' | 'Other';
    teamId: string;
    accountType?: 'Soldier' | 'Supervisor';
  },
  createdByUid: string
): Promise<{ id: string; claimCode: string }> {
  const profileId = generateUnclaimedProfileId();
  const claimCode = generateClaimCode();

  const accountData: Account = {
    id: profileId,
    email: profileData.email || '',
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    gender: profileData.gender,
    accountType: profileData.accountType || 'Soldier',
    teamId: profileData.teamId,
    claimed: false,
    claimCode,
    createdBy: createdByUid,
    createdAt: new Date().toISOString(),
  };

  const accountRef = doc(firestore, 'accounts', profileId);
  await setDoc(accountRef, accountData);

  // Add to team members
  if (profileData.teamId) {
    const memberRef = doc(
      firestore,
      'teams',
      profileData.teamId,
      'members',
      profileId
    );
    await setDoc(memberRef, {
      uid: profileId,
      email: profileData.email || '',
      role: accountData.accountType,
    });
  }

  return { id: profileId, claimCode };
}

/**
 * Finds an unclaimed profile by claim code
 */
export async function findUnclaimedProfile(
  firestore: Firestore,
  claimCode: string
): Promise<Account | null> {
  const accountsRef = collection(firestore, 'accounts');
  const q = query(
    accountsRef,
    where('claimCode', '==', claimCode),
    where('claimed', '==', false)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Account;
}

/**
 * Claims an unclaimed profile and migrates data to a new Firebase user
 */
export async function claimProfile(
  firestore: Firestore,
  claimCode: string,
  newUserId: string,
  email: string
): Promise<boolean> {
  const unclaimedProfile = await findUnclaimedProfile(firestore, claimCode);

  if (!unclaimedProfile) {
    return false;
  }

  const batch = writeBatch(firestore);

  // Get all soldier data from unclaimed profile
  const soldierDataRef = collection(
    firestore,
    'accounts',
    unclaimedProfile.id,
    'soldierData'
  );
  const soldierDataSnapshot = await getDocs(soldierDataRef);

  // Create new account document with claimed user ID
  const newAccountRef = doc(firestore, 'accounts', newUserId);
  const newAccountData: Account = {
    ...unclaimedProfile,
    id: newUserId,
    email,
    claimed: true,
    claimCode: undefined, // Remove claim code
  };
  batch.set(newAccountRef, newAccountData);

  // Migrate soldier data to new account
  soldierDataSnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data() as SoldierData;
    const newDataRef = doc(
      firestore,
      'accounts',
      newUserId,
      'soldierData',
      docSnapshot.id
    );
    batch.set(newDataRef, {
      ...data,
      accountId: newUserId,
    });
  });

  // Update team membership if exists
  if (unclaimedProfile.teamId) {
    // Remove old member entry
    const oldMemberRef = doc(
      firestore,
      'teams',
      unclaimedProfile.teamId,
      'members',
      unclaimedProfile.id
    );
    batch.delete(oldMemberRef);

    // Add new member entry
    const newMemberRef = doc(
      firestore,
      'teams',
      unclaimedProfile.teamId,
      'members',
      newUserId
    );
    batch.set(newMemberRef, {
      uid: newUserId,
      email,
      role: newAccountData.accountType,
    });

    // Update user's teamId
    batch.update(newAccountRef, { teamId: unclaimedProfile.teamId });
  }

  // Delete old unclaimed profile (after migrating data)
  const oldAccountRef = doc(firestore, 'accounts', unclaimedProfile.id);
  batch.delete(oldAccountRef);

  // Delete old soldier data entries
  soldierDataSnapshot.forEach((docSnapshot) => {
    const oldDataRef = doc(
      firestore,
      'accounts',
      unclaimedProfile.id,
      'soldierData',
      docSnapshot.id
    );
    batch.delete(oldDataRef);
  });

  await batch.commit();
  return true;
}

/**
 * Checks if an account is unclaimed
 */
export function isUnclaimedProfile(account: Account): boolean {
  return account.claimed === false && !!account.claimCode;
}

/**
 * Gets all unclaimed profiles for a team
 */
export async function getUnclaimedProfilesForTeam(
  firestore: Firestore,
  teamId: string
): Promise<Account[]> {
  const accountsRef = collection(firestore, 'accounts');
  const q = query(
    accountsRef,
    where('teamId', '==', teamId),
    where('claimed', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Account);
}
