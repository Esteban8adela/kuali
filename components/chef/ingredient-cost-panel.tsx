"use client";

export interface CostEstimate {
  ingredient: string;
  amountCents: number;
  source: string;
}

export interface CostEstimatorProvider {
  estimate(ingredients: string[]): Promise<CostEstimate[] | null>;
}

/** Mock provider — replace with Spoonacular API integration */
export const mockCostEstimator: CostEstimatorProvider = {
  async estimate() {
    return null;
  },
};

interface IngredientCostPanelProps {
  provider?: CostEstimatorProvider;
}

export function IngredientCostPanel({ provider = mockCostEstimator }: IngredientCostPanelProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#C4A052]/40 p-6 text-center text-sm text-neutral-500">
      <p className="font-medium text-[#1B3A4B]">Ingredient costing</p>
      <p className="mt-2">
        Structure ready for Spoonacular API. Provider:{" "}
        {provider === mockCostEstimator ? "mock (no estimates)" : "custom"}
      </p>
    </div>
  );
}
