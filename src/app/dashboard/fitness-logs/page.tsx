'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Activity } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FitnessDataDialog } from '@/components/fitness-data-dialog';

interface FitnessLog {
  id: string;
  mdl: number;
  hrp: number;
  sdc: number;
  plk: number;
  twoMileRun: number;
  weight?: number;
  height?: number;
  healthInfo?: string;
  gender?: 'Male' | 'Female' | 'Other';
  restingHeartRate?: number;
  bodyFatPercentage?: number;
  createdAt: string;
}

export default function FitnessLogsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<FitnessLog | null>(null);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user, firestore]);

  const fetchLogs = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const logsRef = collection(firestore, 'accounts', user.uid, 'soldierData');
      const q = query(logsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const fetchedLogs: FitnessLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FitnessLog));

      setLogs(fetchedLogs);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fitness logs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (log: FitnessLog) => {
    setSelectedLog(log);
    setEditDialogOpen(true);
  };

  const handleDelete = (log: FitnessLog) => {
    setSelectedLog(log);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLog || !user) return;

    try {
      const logRef = doc(firestore, 'accounts', user.uid, 'soldierData', selectedLog.id);
      await deleteDoc(logRef);

      toast({
        title: 'Success',
        description: 'Fitness log deleted successfully.',
      });

      setLogs(logs.filter(log => log.id !== selectedLog.id));
      setDeleteDialogOpen(false);
      setSelectedLog(null);
    } catch (error: any) {
      console.error('Error deleting log:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete fitness log.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (updatedData: Partial<FitnessLog>) => {
    if (!selectedLog || !user) return;

    try {
      const logRef = doc(firestore, 'accounts', user.uid, 'soldierData', selectedLog.id);
      await updateDoc(logRef, updatedData);

      toast({
        title: 'Success',
        description: 'Fitness log updated successfully.',
      });

      // Refresh logs
      await fetchLogs();
      setEditDialogOpen(false);
      setSelectedLog(null);
    } catch (error: any) {
      console.error('Error updating log:', error);
      toast({
        title: 'Error',
        description: 'Failed to update fitness log.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="pb-24 md:pb-4">
    <>
      <FitnessDataDialog
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={(data) => handleUpdate(data as Partial<FitnessLog>)}
        initialData={selectedLog || undefined}
        isEditing={true}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this fitness log entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fitness Logs
          </CardTitle>
          <CardDescription>
            View, edit, and manage your fitness test results and health data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fitness logs yet. Log your first benchmark test!/</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>MDL</TableHead>
                    <TableHead>HRP</TableHead>
                    <TableHead>SDC</TableHead>
                    <TableHead>PLK</TableHead>
                    <TableHead>2MR</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>{log.mdl}</TableCell>
                      <TableCell>{log.hrp}</TableCell>
                      <TableCell>{log.sdc}</TableCell>
                      <TableCell>{log.plk}</TableCell>
                      <TableCell>{log.twoMileRun}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(log)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(log)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
    </div>
  );
}
