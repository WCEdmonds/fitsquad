"use client";

import { useState } from 'react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, LogOut, Settings, Award, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { signOut, getAuth } from 'firebase/auth';
import { FitnessDataDialog } from '@/components/fitness-data-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAftDialogOpen, setIsAftDialogOpen] = useState(false);

    const userAccountRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'accounts', user.uid);
    }, [firestore, user]);
    const { data: userAccount, isLoading: isAccountLoading } = useDoc(userAccountRef);

    // Fetch latest soldier data
    const soldierDataRef = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'accounts', user.uid, 'soldierData'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );
    }, [firestore, user]);
    const { data: soldierDataList, isLoading: isSoldierDataLoading } = useCollection(soldierDataRef);
    const latestData = soldierDataList?.[0];

    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            window.location.href = '/login';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleSaveAft = async (data: any) => {
        if (!user) return;
        try {
            await addDoc(collection(firestore, 'accounts', user.uid, 'soldierData'), {
                ...data,
                createdAt: new Date().toISOString(),
                userId: user.uid
            });
            
            toast({
                title: "AFT Logged",
                description: "Your fitness test results have been saved.",
            });
            setIsAftDialogOpen(false);
        } catch (error) {
            console.error('Error saving AFT:', error);
             toast({
                title: "Error",
                description: "Failed to save AFT results.",
                variant: 'destructive'
            });
        }
    };

    if (isAccountLoading || isSoldierDataLoading) {
        return (
            <div className="p-6 space-y-6 pt-[calc(env(safe-area-inset-top)+2rem)]">
                <div className="flex items-center gap-4">
                     <Skeleton className="h-20 w-20 rounded-full" />
                     <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-24" />
                     </div>
                </div>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    const initials = (userAccount?.firstName?.charAt(0) || '') + (userAccount?.lastName?.charAt(0) || '');

    return (
        <div className="flex flex-col h-full bg-background">
          {/* Fixed Header */}
          <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-3 bg-card/80 border-b border-border/50 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] px-6 pt-4 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                
                {/* Header / Profile Info */}
                <div className="flex items-center gap-4 mb-8">
                     <Avatar className="h-20 w-20 border-2 border-border">
                        <AvatarImage src={userAccount?.photoUrl} />
                        <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{userAccount?.firstName} {userAccount?.lastName}</h1>
                        <p className="text-muted-foreground">{userAccount?.rank || 'Soldier'} • {userAccount?.accountType}</p>
                        {userAccount?.teamId && <p className="text-xs text-muted-foreground mt-1">Team ID: {userAccount.teamId}</p>}
                    </div>
                </div>

                {/* Vitals & Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Height</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{latestData?.height || '--'} <span className="text-sm font-normal text-muted-foreground">in</span></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Weight</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{latestData?.weight || '--'} <span className="text-sm font-normal text-muted-foreground">lbs</span></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Latest AFT Scores */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Latest AFT Scores</CardTitle>
                            {latestData?.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                    {new Date(latestData.createdAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-5 gap-2 text-center">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">MDL</span>
                                <div className="text-lg font-semibold">{latestData?.mdl || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">HRP</span>
                                <div className="text-lg font-semibold">{latestData?.hrp || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">SDC</span>
                                <div className="text-lg font-semibold">{latestData?.sdc || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">PLK</span>
                                <div className="text-lg font-semibold">{latestData?.plk || '-'}</div>
                            </div>
                             <div className="space-y-1">
                                <span className="text-xs text-muted-foreground font-medium">2MR</span>
                                <div className="text-lg font-semibold">{latestData?.twoMileRun || '-'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Actions */}
                <div className="grid gap-3">
                    <Card onClick={() => setIsAftDialogOpen(true)} className="cursor-pointer hover:bg-muted/50 transition-colors border-primary/20 bg-primary/5">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-full text-primary">
                                     <Award className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold">Log New AFT</h3>
                                    <p className="text-xs text-muted-foreground">Record standardized fitness test scores</p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                    </Card>

                    <Link href="/dashboard/history">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary rounded-full">
                                        <History className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Workout History</h3>
                                        <p className="text-xs text-muted-foreground">View past completed workouts</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>

                     <Link href="/dashboard/settings">
                        <Card className="hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary rounded-full">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold">Settings</h3>
                                        <p className="text-xs text-muted-foreground">App preferences and account</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Logout */}
                <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 mt-8"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                </Button>

                {/* AFT Dialog */}
                <FitnessDataDialog 
                    isOpen={isAftDialogOpen}
                    onOpenChange={setIsAftDialogOpen}
                    onSave={handleSaveAft}
                    initialData={latestData} // Pass latest data as default? Optional, maybe nice.
                />

            </div>
        </div>
    );
}
