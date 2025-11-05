'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  // Vitals
  gender: z.enum(['Male', 'Female', 'Other']),
  weight: z.coerce.number().min(0, 'Weight must be positive.'),
  height: z.coerce.number().min(0, 'Height must be positive.'),
  // ACFT Events
  mdl: z.coerce.number().min(0, 'Score must be positive.'),
  hrp: z.coerce.number().min(0, 'Score must be positive.'),
  sdc: z.coerce.number().min(0, 'Time must be positive.'),
  plk: z.coerce.number().min(0, 'Time must be positive.'),
  twoMileRun: z.coerce.number().min(0, 'Time must be positive.'),
  healthInfo: z.string().optional(),
});

type SoldierDataFormValues = z.infer<typeof formSchema>;

interface SoldierDataFormProps {
  soldierId: string;
  onSave?: () => void;
  defaultValues?: Partial<SoldierDataFormValues>;
}

export function SoldierDataForm({ soldierId, onSave, defaultValues }: SoldierDataFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<SoldierDataFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      weight: 0,
      height: 0,
      mdl: 0,
      hrp: 0,
      sdc: 0,
      plk: 0,
      twoMileRun: 0,
      healthInfo: '',
    },
  });

  const handleSubmit = (values: SoldierDataFormValues) => {
    setIsLoading(true);
    if (!firestore || !soldierId) {
      toast({
        title: 'Error',
        description: 'Cannot save data. Missing user or database connection.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const soldierDataCollectionRef = collection(firestore, 'accounts', soldierId, 'soldierData');
    const newSoldierDataRef = doc(soldierDataCollectionRef);

    const dataToSave = {
      id: newSoldierDataRef.id,
      accountId: soldierId,
      ...values,
      createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(newSoldierDataRef, dataToSave, {});
    
    toast({
      title: 'Success',
      description: 'Your fitness data has been logged.',
    });

    setIsLoading(false);
    onSave?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (lbs)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 180" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (inches)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 70" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <h3 className="text-lg font-semibold border-b pb-2">ACFT Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="mdl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Deadlift (MDL)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 340" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hrp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hand-Release Pushups (HRP)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="sdc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sprint-Drag-Carry (SDC)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="in seconds" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="plk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plank (PLK)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="in seconds" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="twoMileRun"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2-Mile Run (2MR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="in seconds" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="healthInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Health Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any injuries, limitations, or health notes to consider."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
           {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Data'
          )}
        </Button>
      </form>
    </Form>
  );
}
