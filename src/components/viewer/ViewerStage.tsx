import { type ReactNode } from 'react';
import { Stage } from '@react-three/drei';

interface ViewerStageProps {
  children: ReactNode;
}

export function ViewerStage({ children }: ViewerStageProps) {
  return (
    <Stage
      intensity={0.5}
      environment="city"
      shadows={{ type: 'contact', opacity: 0.3, blur: 2 }}
      adjustCamera={1.2}
    >
      {children}
    </Stage>
  );
}
