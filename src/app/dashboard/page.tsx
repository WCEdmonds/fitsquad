'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Target, Users, Activity, BarChart3, Swords, Shield, PersonStanding, Armchair, MoreHorizontal, Copy, UserPlus, Dumbbell, Weight, Bot, Zap, ShieldCheck } from 'lucide-react';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentActivity } from '@/components/recent-activity';
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase, getCollectionNonBlocking, getDocNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Soldier } from '@/lib/types';
import { SoldierDataForm } from '@/components/soldier-data-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [account, setAccount] = useState<any>(null);
  const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);
  const [avgMdl, setAvgMdl] = useState<number | string>('--');
  const [avgSdc, setAvgSdc] = useState<number | string>('--');
  const [avgPlk, setAvgPlk] = useState<number | string>('--');
  const [avgHrp, setAvgHrp] = useState<number | string>('--');
  const [avgRunTime, setAvgRunTime] = useState<string>('--');
  const [hasSoldierData, setHasSoldierData] = useState<boolean | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'accounts', user.uid);
  }, [firestore, user]);

  const { data: accountData } = useDoc(userDocRef);

  useEffect(() => {
    if(accountData) {
      setAccount(accountData);
      if (accountData.accountType !== 'Commander') {
        setSelectedTeamId(accountData.teamId);
      }
    }
  }, [accountData])

  const managedTeamsRef = useMemoFirebase(() => {
    if (!user || account?.accountType !== 'Commander') return null;
    return collection(firestore, 'accounts', user.uid, 'managedTeams');
  }, [firestore, user, account]);
  const { data: managedTeams } = useCollection(managedTeamsRef);
  
  const teamId = account?.accountType === 'Commander' ? selectedTeamId : account?.teamId;

  const teamDocRef = useMemoFirebase(() => {
    if (!teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: teamData } = useDoc(teamDocRef);

  const teamMembersRef = useMemoFirebase(() => {
    if (!teamId) return null;
    return collection(firestore, 'teams', teamId, 'members');
  }, [firestore, teamId]);

  const { data: teamMembers } = useCollection(teamMembersRef);
  
  const userSoldierDataRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'accounts', user.uid, 'soldierData');
  }, [firestore, user]);

  const { data: soldierData, isLoading: soldierDataLoading } = useCollection(userSoldierDataRef);

   useEffect(() => {
    if (!soldierDataLoading) {
      setHasSoldierData(soldierData && soldierData.length > 0);
    }
  }, [soldierData, soldierDataLoading]);


  useEffect(() => {
    if (teamMembers && firestore) {
        const fetchSoldierData = async () => {
            const soldierPromises = teamMembers.map(async (member) => {
                const soldierDataColRef = collection(firestore, 'accounts', member.id, 'soldierData');
                const soldierDataList = await getCollectionNonBlocking<any>(soldierDataColRef);
                const sData = soldierDataList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                
                const accountRef = doc(firestore, 'accounts', member.id);
                const accData = await getDocNonBlocking<any>(accountRef);

                 const defaultSoldier: Soldier = {
                    id: member.id,
                    name: accData?.email || 'Unknown',
                    firstName: accData?.firstName,
                    lastName: accData?.lastName,
                    rank: accData?.accountType || 'Soldier',
                    mdl: 0,
                    hrp: 0,
                    sdc: 0,
                    plk: 0,
                    twoMileRun: 0,
                    gender: accData?.gender || 'Other',
                    weight: accData?.weight || 0,
                    height: accData?.height || 0,
                    healthNotes: 'No data',
                };

                if (sData && accData) {
                     return {
                        ...defaultSoldier,
                        healthNotes: sData.healthInfo,
                        mdl: sData.mdl,
                        hrp: sData.hrp,
                        sdc: sData.sdc,
                        plk: sData.plk,
                        twoMileRun: sData.twoMileRun
                    };
                }
                if(accData){
                        return defaultSoldier;
                }
                return null;
            });

            const soldiers = (await Promise.all(soldierPromises)).filter(s => s !== null) as Soldier[];
            setAllSoldiers(soldiers);

            const soldiersWithData = soldiers.filter(s => s.mdl > 0 || s.hrp > 0 || s.sdc > 0 || s.plk > 0 || s.twoMileRun > 0);

            if (soldiersWithData.length > 0) {
              const totalMdl = soldiersWithData.reduce((acc, s) => acc + s.mdl, 0);
              setAvgMdl(Math.round(totalMdl / soldiersWithData.length));

              const totalHrp = soldiersWithData.reduce((acc, s) => acc + s.hrp, 0);
              setAvgHrp(Math.round(totalHrp / soldiersWithData.length));

              const totalSdc = soldiersWithData.reduce((acc, s) => acc + s.sdc, 0);
              setAvgSdc(Math.round(totalSdc / soldiersWithData.length));
              
              const totalPlk = soldiersWithData.reduce((acc, s) => acc + s.plk, 0);
              setAvgPlk(Math.round(totalPlk / soldiersWithData.length));
              
              const totalRunTime = soldiersWithData.reduce((acc, s) => acc + s.twoMileRun, 0);
              setAvgRunTime(`${Math.round(totalRunTime / soldiersWithData.length)}`);
            } else {
                setAvgMdl('--');
                setAvgHrp('--');
                setAvgSdc('--');
                setAvgPlk('--');
                setAvgRunTime('--');
            }
        };

        fetchSoldierData();
    } else {
        setAllSoldiers([]);
         setAvgMdl('--');
         setAvgHrp('--');
         setAvgSdc('--');
         setAvgPlk('--');
         setAvgRunTime('--');
    }
}, [teamMembers, firestore]);

  const handleCopyTeamCode = () => {
    if (teamData?.teamCode) {
      navigator.clipboard.writeText(teamData.teamCode);
      toast({
        title: "Team Code Copied!",
        description: "You can now share it with new members.",
      });
    }
  }

  
  if (account && !account.teamId && account.accountType !== 'Commander') {
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

   if (account && account.accountType === 'Commander' && (!managedTeams || managedTeams.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Welcome, Commander!</CardTitle>
            <CardDescription>
             You are not managing any teams yet. Go to the "Manage Teams" page to add subordinate units.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <Link href="/dashboard/manage-teams" passHref>
                <Button className="w-full">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Manage Teams
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (hasSoldierData === false && account?.accountType !== 'Commander') {
    return (
       <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-2xl">
           <CardHeader>
            <CardTitle>Log Your Benchmark</CardTitle>
            <CardDescription>
              To get started, please enter your initial fitness metrics. This will serve as your benchmark.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoldierDataForm 
              soldierId={user!.uid} 
              onSave={() => setHasSoldierData(true)} 
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
       <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">
            {teamData?.name ?? (account?.accountType === 'Commander' ? "Select a Team" : "Dashboard")}
          </h1>
          {teamData && (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Team Actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleCopyTeamCode}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Team Code
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/teams/join">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Join a Different Team
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          )}
       </div>
        {account?.accountType === 'Commander' && (
            <div className="w-full md:w-auto md:min-w-[250px]">
                 <Select onValueChange={setSelectedTeamId} value={selectedTeamId ?? ""}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a team to view..." />
                    </SelectTrigger>
                    <SelectContent>
                        {managedTeams?.map((team) => (
                            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>

       {!teamId && account?.accountType === 'Commander' && (
         <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p>Please select a team from the dropdown above to view their dashboard.</p>
        </div>
      )}


     {teamId && (
     <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Soldiers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">in this unit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. MDL Score</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMdl}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the unit' : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. HRP Score</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHrp}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the unit' : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. SDC Score</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSdc}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the unit' : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. PLK Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPlk}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the unit' : 'No data yet'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. 2MR Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRunTime}</div>
            <p className="text-xs text-muted-foreground">{allSoldiers.length > 0 ? 'Across the unit' : 'No data yet'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>
              Event breakdown across the unit.
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
      </>
      )}
    </div>
  );
}
