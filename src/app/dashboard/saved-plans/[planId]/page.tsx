import SavedPlanDetailClientPage from '@/components/saved-plan-detail-client-page';

// This function is required for static export of dynamic routes.
// It tells Next.js that there are no plan pages to generate at build time.
// The pages will be rendered on the client side.
export async function generateStaticParams() {
  return [];
}

export default function SavedPlanPage({ params }: { params: { planId: string } }) {
  return <SavedPlanDetailClientPage planId={params.planId} />;
}
