"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUserProfile } from "@/app/[locale]/(auth)/profile/actions";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
}

export function EditProfileDialog({ open, onOpenChange, initialName }: EditProfileDialogProps) {
  const t = useTranslations("auth.profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(initialName);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateUserProfile(name);
      if (!result.ok) {
        if (result.error === "name_required") {
          setError(t("nameRequired"));
        } else {
          setError(t("updateFailed"));
        }
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="profile-full-name">{t("fullName")}</Label>
            <Input
              id="profile-full-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              className="mt-2"
              autoComplete="name"
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {tc("back")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? tc("saving") : tc("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
