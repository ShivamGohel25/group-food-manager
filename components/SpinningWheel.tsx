'use client';
import { useState, useRef } from 'react';

type Candidate = {
  userId: string;
  name: string;
  hasVehicle: boolean;
  count: number;
};

export default function SpinningWheel({
  candidates,
  onComplete
}: {
  candidates: Candidate[];
  onComplete: (purchaserId: string, coPurchaserId: string) => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [phase, setPhase] = useState<'IDLE' | 'SPINNING_1' | 'RESULT_1' | 'SPINNING_2' | 'RESULT_2'>('IDLE');
  const [purchaser, setPurchaser] = useState<Candidate | null>(null);
  const [coPurchaser, setCoPurchaser] = useState<Candidate | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);

  // Filter candidates for the current phase
  // For Phase 1 (Purchaser), we prefer those with a vehicle. 
  // If none have a vehicle, we use all candidates.
  // For Phase 2 (CoPurchaser), we use everyone except the already selected purchaser.
  // In both phases, we only take the candidates with the MINIMUM purchase count among the eligible pool.
  
  const getEligibleCandidates = (currentPhase: typeof phase) => {
    if (currentPhase === 'IDLE' || currentPhase === 'SPINNING_1') {
      const withVehicle = candidates.filter(c => c.hasVehicle);
      const pool = withVehicle.length > 0 ? withVehicle : candidates;
      if (pool.length === 0) return [];
      const minCount = Math.min(...pool.map(c => c.count));
      return pool.filter(c => c.count === minCount);
    } else {
      // Phase 2
      const pool = candidates.filter(c => c.userId !== purchaser?.userId);
      if (pool.length === 0) return [];
      const minCount = Math.min(...pool.map(c => c.count));
      return pool.filter(c => c.count === minCount);
    }
  };

  const eligibleCandidates = getEligibleCandidates(phase === 'RESULT_1' ? 'SPINNING_2' : phase);

  const spin = () => {
    if (eligibleCandidates.length === 0) return;
    setSpinning(true);
    setPhase(phase === 'IDLE' ? 'SPINNING_1' : 'SPINNING_2');

    // Random winner among eligible candidates
    const winnerIndex = Math.floor(Math.random() * eligibleCandidates.length);
    const winner = eligibleCandidates[winnerIndex];

    // Calculate rotation
    const sliceAngle = 360 / Math.max(eligibleCandidates.length, 1);
    const targetRotation = rotation + 360 * 5 + (360 - (winnerIndex * sliceAngle)) - (sliceAngle / 2);

    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      if (phase === 'IDLE' || phase === 'SPINNING_1') {
        setPurchaser(winner);
        setPhase('RESULT_1');
      } else {
        setCoPurchaser(winner);
        setPhase('RESULT_2');
        onComplete(purchaser!.userId, winner.userId);
      }
    }, 4000); // 4 seconds animation
  };

  if (candidates.length === 0) return <div className="text-muted">Loading candidates...</div>;

  const currentPool = eligibleCandidates.length > 0 ? eligibleCandidates : candidates;
  const sliceAngle = 360 / Math.max(currentPool.length, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <h3 className="heading-md">
        {phase === 'IDLE' && 'Spin for the Driver!'}
        {phase === 'RESULT_1' && `Driver is ${purchaser?.name}. Spin for Passenger!`}
        {phase === 'RESULT_2' && `Selected: ${purchaser?.name} & ${coPurchaser?.name}`}
        {phase === 'SPINNING_1' && 'Selecting Driver...'}
        {phase === 'SPINNING_2' && 'Selecting Passenger...'}
      </h3>

      <div style={{ position: 'relative', width: '300px', height: '300px', overflow: 'hidden', borderRadius: '50%', border: '4px solid var(--accent)' }}>
        {/* The pointer */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '0', height: '0', borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent', borderTop: '25px solid var(--text-main)',
          zIndex: 10
        }} />
        
        {/* The Wheel */}
        <div 
          ref={wheelRef}
          style={{ 
            width: '100%', height: '100%', position: 'relative',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          {currentPool.map((c, i) => {
            const angle = i * sliceAngle;
            return (
              <div key={i} style={{
                position: 'absolute', top: 0, left: '50%',
                width: '50%', height: '50%',
                transformOrigin: '0% 100%',
                transform: `rotate(${angle}deg) skewY(${90 - sliceAngle}deg)`,
                background: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
            );
          })}
          {/* Text labels */}
          {currentPool.map((c, i) => {
            const angle = (i * sliceAngle) + (sliceAngle / 2);
            return (
              <div key={`text-${i}`} style={{
                position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
                transform: `rotate(${angle}deg)`, pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
                  color: '#fff', fontWeight: 'bold', textShadow: '0px 1px 3px rgba(0,0,0,0.8)',
                  fontSize: '14px', whiteSpace: 'nowrap'
                }}>
                  {c.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {phase !== 'RESULT_2' && (
        <button 
          className="btn-primary" 
          onClick={spin} 
          disabled={spinning || currentPool.length === 0}
          style={{ padding: '12px 24px', fontSize: '18px', borderRadius: '30px' }}
        >
          {spinning ? 'Spinning...' : phase === 'IDLE' ? 'Spin Wheel' : 'Spin Again'}
        </button>
      )}
    </div>
  );
}
