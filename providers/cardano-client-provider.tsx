"use client";

import { useCardanoStore } from "@/stores/cardano-store";
import { useState, useEffect } from "react";

const CardanoClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);  
  const { loadWallets } = useCardanoStore();
  
  useEffect(() => {    
    loadWallets();
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <div>{children}</div>;
};

export default CardanoClientProvider;
