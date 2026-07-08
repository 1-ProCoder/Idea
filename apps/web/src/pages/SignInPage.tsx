import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center py-12 px-6">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
