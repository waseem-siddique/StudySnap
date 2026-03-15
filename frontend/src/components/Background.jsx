import React from 'react';
import ClickSpark from './ClickSpark';
import DarkVeil from './DarkVeil';

export default function Background({ children }) {
  return (
    <ClickSpark sparkColor="#fff">
      {/* DarkVeil background */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0.05}
          scanlineIntensity={0.1}
          speed={0.3}
          scanlineFrequency={500}
          warpAmount={0.02}
        />
      </div>
      {/* Page content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </ClickSpark>
  );
}