import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProfilePage from './profile';

function ProfileFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfilePage />
    </Suspense>
  );
}
