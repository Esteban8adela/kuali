"use client";

import { Button } from "@/components/ui/button";

interface GenerateShoppingListButtonProps {
  label: string;
  tripId: string;
}

export function GenerateShoppingListButton({ label, tripId }: GenerateShoppingListButtonProps) {
  return (
    <Button
      type="button"
      size="lg"
      className="h-12 w-full bg-[#1B3A4B] px-8 text-base font-semibold text-white hover:bg-[#1B3A4B]/90 sm:w-auto"
      onClick={() => {
        console.log("[chef] Generate shopping list & costing", { tripId });
      }}
    >
      {label}
    </Button>
  );
}
