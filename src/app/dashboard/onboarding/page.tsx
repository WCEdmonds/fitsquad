"use client";

import { useRouter } from 'next/navigation';
import { SoldierDataForm } from '@/components/soldier-data-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase';

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useUser();

    const handleOnboardingComplete = () => {
        router.push('/dashboard/plan');
    };

    if (!user) {
        return <div className="p-8">Loading user...</div>;
    }

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                    <CardDescription>
                        Please enter your initial AFT scores and vitals to get started. 
                        This data allows us to personalize your training plan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SoldierDataForm 
                        soldierId={user.uid} 
                        onSave={handleOnboardingComplete} 
                    />
                </CardContent>
            </Card>
        </div>
    );
}
