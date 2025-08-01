
import React from 'react';

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">Important Notice</h1>
      <p className="text-lg mb-8 max-w-2xl">
        This is an early access, beta version of soulspect. It&apos;s currently under active development, and you might encounter bugs or incomplete features.
        We&apos;re continuously working to improve all aspects of the application, and there&apos;s lots of room for growth!
      </p>
      <p className="text-md text-muted-foreground">
        Thank you for being an early adopter and helping us shape the future of soulspect.
      </p>
    </div>
  );
}
