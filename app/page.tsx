'use client';

import dynamic from 'next/dynamic';

// Use dynamic import for client components
const Lightbulb = dynamic(() => import('./components/Lightbulb'), { ssr: false });
const AuthButton = dynamic(() => import('./components/AuthButton'), { ssr: false });
const Footer = dynamic(() => import('./components/Footer'), { ssr: false });

export default function Home() {
  return (
    <main>
      <Lightbulb />
      <AuthButton />
      <Footer />
    </main>
  );
}
