'use client';

import { useForm, useWatch } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  accountType: z.enum(['Soldier', 'Supervisor', 'Commander', 'Admin']),
  gender: z.enum(['Male', 'Female', 'Other']),
  passcode: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  userId: string;
  onSave?: () => void;
  defaultValues?: Partial<ProfileFormValues>;
}

export function ProfileForm({ userId, onSave, defaultValues }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {},
  });

  const watchedAccountType = useWatch({
    control: form.control,
    name: 'accountType',
  });

  const handleSubmit = (values: ProfileFormValues) => {
    // Passcode validation
    if (values.accountType === 'Commander' && values.passcode !== 'thunder') {
      form.setError('passcode', { type: 'manual', message: 'Invalid Commander passcode.' });
      return;
    }
    if (values.accountType === 'Admin' && values.passcode !== 'scientiaestpotestas') {
      form.setError('passcode', { type: 'manual', message: 'Invalid Admin passcode.' });
      return;
    }

    setIsLoading(true);
    if (!firestore || !userId) {
      toast({
        title: 'Error',
        description: 'Cannot save data. Missing user or database connection.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const accountRef = doc(firestore, 'accounts', userId);

    const { passcode, ...dataToSave } = values;

    updateDocumentNonBlocking(accountRef, dataToSave);
    
    toast({
      title: 'Success',
      description: 'Your profile has been updated.',
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Soldier">Soldier</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Commander">Commander</SelectItem>
                     <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         {(watchedAccountType === 'Commander' || watchedAccountType === 'Admin') &&
            defaultValues?.accountType !== watchedAccountType && (
            <FormField
                control={form.control}
                name="passcode"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Passcode</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="Enter passcode for new role" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}


        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
           {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </form>
    </Form>
  );
}
