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

const formSchema = z.object({
  aftScore: z.coerce.number().min(0, 'Score must be positive.'),
  runTime: z.coerce.number().min(0, 'Run time must be positive.'),
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
      aftScore: 0,
      runTime: 0,
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
    const newSoldierDataRef = doc(soldierDataCollectionRef); // Creates a new doc with a unique ID

    const dataToSave = {
      id: newSoldierDataRef.id,
      accountId: soldierId,
      ...values,
      createdAt: new Date().toISOString(),
    };

    // Use setDoc with the new reference. This will create a new document each time.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="aftScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Army Fitness Test (AFT) Score</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 270" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="runTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Run Time (in minutes)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g., 13.5" {...field} />
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
