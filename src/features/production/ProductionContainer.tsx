"use client";

import { ProductionReview } from "@/components/organisms/ProductionReview";
import { useProductionController } from "./useProductionController";

export function ProductionContainer() {
  const productionProps = useProductionController();

  return <ProductionReview {...productionProps} />;
}
