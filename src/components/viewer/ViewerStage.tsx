import { type ReactNode } from 'react';
import { Stage } from '@react-three/drei';

interface ViewerStageProps {
  children: ReactNode;
}

export function ViewerStage({ children }: ViewerStageProps) {
  return (
    <Stage
      intensity={0.3}
      environment="studio"
      shadows={{ type: 'contact', opacity: 0.3, blur: 2 }}
      adjustCamera={1.2}
    >
      {children}
    </Stage>
  );
}
