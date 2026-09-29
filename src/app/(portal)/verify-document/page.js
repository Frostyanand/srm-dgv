import React from 'react';
import VerifyDocument from '@/components/verify/VerifyDocument';

export default function InternalVerifyPage() {
  return (
    <div className="py-6 max-w-5xl mx-auto">
      <VerifyDocument isPublic={false} />
    </div>
  );
}
