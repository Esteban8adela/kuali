import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GenerateShoppingListButtonProps {
  label: string;
  tripId: string;
  locale: string;
}

export function GenerateShoppingListButton({
  label,
  tripId,
  locale,
}: GenerateShoppingListButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      className="h-12 w-full bg-[#1B3A4B] px-8 text-base font-semibold text-white hover:bg-[#1B3A4B]/90 sm:w-auto"
    >
      <Link href={`/${locale}/chef/trip/${tripId}/shopping-list`}>{label}</Link>
    </Button>
  );
}
