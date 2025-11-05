'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Target, Users, Activity, BarChart3, Swords, Shield } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentActivity } from '@/components/recent-activity';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, getCollectionNonBlocking, getDocNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Soldier } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [account, setAccount] = useState<any>(null);
  const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);
  const [avgAftScore, setAvgAftScore] = useState<number | string>('--');
  const [avgRunTime, setAvgRunTime] = useState<string>('--:--');


  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: accountData } = useDoc(userDocRef);

  useEffect(() => {
    if(accountData) {
      setAccount(accountData)
    }
  }, [accountData])
  

  const teamId = account?.teamId;

  const teamMembersRef = useMemoFirebase(() => {
    if (!teamId) return null;
    return collection(firestore, 'teams', teamId, 'members');
  }, [firestore, teamId]);

  const { data: teamMembers } = useCollection(teamMembersRef);

  useEffect(() => {
    if (teamMembers && firestore) {
        const fetchSoldierData = async () => {
            const soldierPromises = teamMembers.map(async (member) => {
                const soldierDataColRef = collection(firestore, 'accounts', member.uid, 'soldierData');
                const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                const sData = soldierDataList[0];
                
                const accountRef = doc(firestore, 'accounts', member.uid);
                const accData = await getDocNonBlocking<any>(accountRef);

                if (sData && accData) {
                    return {
                        id: member.uid,
                        name: accData.email,
                        rank: accData.accountType,
                        aftScore: sData.aftScore,
                        runTime: sData.runTime * 60,
                        pushups: 50, // Placeholder
                        situps: 50,  // Placeholder
                        healthNotes: sData.healthInfo,
                        avatar: `https://picsum.photos/seed/${member.uid}/100/100`,
                    } as Soldier;
                }
                return null;
            });

            const soldiers = (await Promise.all(soldierPromises)).filter(s => s !== null) as Soldier[];
            setAllSoldiers(soldiers);

            if (soldiers.length > 0) {
              const totalScore = soldiers.reduce((acc, s) => acc + s.aftScore, 0);
              setAvgAftScore(Math.round(totalScore / soldiers.length));

              const totalRunTime = soldiers.reduce((acc, s) => acc + s.runTime, 0);
              const avgSeconds = Math.round(totalRunTime / soldiers.length);
              const mins = Math.floor(avgSeconds / 60);
              const secs = avgSeconds % 60;
              setAvgRunTime(`${mins}:${secs.toString().padStart(2, '0')}`);
            }
        };

        fetchSoldierData();
    }
}, [teamMembers, firestore]);

  
  if (account && !account.teamId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Welcome to FitSquad!</CardTitle>
            <CardDescription>
              You're not part of a team yet. Create a new team or join an existing one to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <Link href="/teams/create" passHref>
                <Button className="w-full">
                    <Swords className="mr-2 h-4 w-4" /> Create a New Team
                </Button>
            </Link>
            <Link href="/teams/join" passHref>
                <Button variant="outline" className="w-full">
                    <Shield className="mr-2 h-4 w-4" /> Join an Existing Team
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Soldiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">in your team</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. AFT Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAftScore}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the team' : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Run Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRunTime}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the team' : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Status</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">No data yet</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>AFT Score Distribution</CardTitle>
            <CardDescription>
              Performance breakdown across the unit.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <PerformanceChart data={allSoldiers} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Updates on soldier performance and logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity data={allSoldiers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
