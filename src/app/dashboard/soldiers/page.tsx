import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { soldiers } from '@/lib/data';
import { SoldierTable } from '@/components/soldier-table';
import type { Soldier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

const RUN_TIME_THRESHOLD = 900; // 15:00
const STRENGTH_THRESHOLD = 50; // pushups

export default function SoldiersPage() {
  const allSoldiers: Soldier[] = soldiers;
  const runningFocusGroup: Soldier[] = soldiers.filter(s => s.runTime > RUN_TIME_THRESHOLD);
  const strengthFocusGroup: Soldier[] = soldiers.filter(s => s.pushups < STRENGTH_THRESHOLD || s.situps < STRENGTH_THRESHOLD);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Soldier Roster</CardTitle>
          <CardDescription>
            Manage and track individual soldier performance.
          </CardDescription>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Add Soldier
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Soldiers</TabsTrigger>
            <TabsTrigger value="running">Running Focus</TabsTrigger>
            <TabsTrigger value="strength">Strength Focus</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <SoldierTable soldiers={allSoldiers} />
          </TabsContent>
          <TabsContent value="running" className="mt-4">
            <SoldierTable soldiers={runningFocusGroup} />
          </TabsContent>
          <TabsContent value="strength" className="mt-4">
            <SoldierTable soldiers={strengthFocusGroup} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
