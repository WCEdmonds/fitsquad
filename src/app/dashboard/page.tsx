'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Copy, Dumbbell, MoreHorizontal, UserPlus, Users, Calendar, Activity } from 'lucide-react';
import { Barbell, SneakerMove, PersonSimpleRun, Shield, ShieldCheck, Sword, Timer } from '@phosphor-icons/react';
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
  const [refetchTrigger, setRefetchTrigger] = useState(0);

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
  }, [firestore, user, refetchTrigger]);

  const { data: soldierData, isLoading: soldierDataLoading } = useCollection(userSoldierDataRef);

   useEffect(() => {
    if (!soldierDataLoading) {
      setHasSoldierData(soldierData && soldierData.length > 0);
    }
  }, [soldierData, soldierDataLoading]);


  useEffect(() => {
    // Fetch team statistics for all team members
    // Security rules allow team members to read each other's data
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
                    email: accData?.email || 'Unknown',
                    firstName: accData?.firstName || 'Unknown',
                    lastName: accData?.lastName || 'Soldier',
                    rank: accData?.accountType || 'Soldier',
                    mdl: 0,
                    hrp: 0,
                    sdc: 0,
                    plk: 0,
                    twoMileRun: 0,
                    gender: accData?.gender || 'Other',
                    weight: 0,
                    height: 0,
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
                        twoMileRun: sData.twoMileRun,
                        weight: sData.weight,
                        height: sData.height,
                    };
                }
                if(accData){
                        return {
                            ...defaultSoldier,
                            gender: accData.gender,
                        };
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

  const handleDataSaved = () => {
    setHasSoldierData(true);
    setRefetchTrigger(prev => prev + 1);
  };
  
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
                    <Sword className="mr-2 h-4 w-4" /> Create a New Team
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
             You are not managing any teams yet. Add a subordinate unit or create a new team to begin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <Link href="/dashboard/manage-teams" passHref>
                <Button className="w-full">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Manage Teams
                </Button>
            </Link>
             <Link href="/teams/create" passHref>
                <Button variant="outline" className="w-full">
                    <Sword className="mr-2 h-4 w-4" /> Create a New Team
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
              onSave={handleDataSaved}
              defaultValues={{
                  gender: account.gender
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 pb-24 md:pb-4">
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
      <div className="flex justify-center mb-4">
        <Button asChild size="lg" className="w-full md:w-auto">
          <Link href="/dashboard/planner">
            <Calendar className="mr-2 h-5 w-5" />
            Generate Workout Plan
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="aspect-square flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Total</CardTitle>
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{teamMembers?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">soldiers</p>
          </CardContent>
        </Card>
        <Card className="aspect-square flex flex-col bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">MDL</CardTitle>
            <Barbell weight="bold" className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4">
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{avgMdl}</div>
            <p className="text-xs text-muted-foreground mt-1">avg score</p>
          </CardContent>
        </Card>
        <Card className="aspect-square flex flex-col bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">HRP</CardTitle>
            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4">
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{avgHrp}</div>
            <p className="text-xs text-muted-foreground mt-1">avg score</p>
          </CardContent>
        </Card>
        <Card className="aspect-square flex flex-col bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">SDC</CardTitle>
            <PersonSimpleRun weight="bold" className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4">
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{avgSdc}</div>
            <p className="text-xs text-muted-foreground mt-1">avg score</p>
          </CardContent>
        </Card>
        <Card className="aspect-square flex flex-col bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800 hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">PLK</CardTitle>
            <Timer weight="bold" className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4">
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{avgPlk}</div>
            <p className="text-xs text-muted-foreground mt-1">avg score</p>
          </CardContent>
        </Card>
        <Card className="aspect-square flex flex-col bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">2MR</CardTitle>
            <SneakerMove weight="bold" className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center px-4 pb-4">
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{avgRunTime}</div>
            <p className="text-xs text-muted-foreground mt-1">avg score</p>
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
