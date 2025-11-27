import { ReactNode } from 'react';

// project imports
import Customization from '../Customization';

interface Props {
  children: ReactNode;
}

// ==============================|| MINIMAL LAYOUT ||============================== //

export default function MinimalLayout({ children }: Props) {
  return (
    <>
      {children}
      <Customization />
    </>
  );
}
