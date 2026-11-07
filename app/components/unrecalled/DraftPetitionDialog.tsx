import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { IconFileText, IconLoader2, IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { BrandMark, Typing } from "./premium";

const STORE_KEY = "unrecalled.petitioner";

function loadPetitioner(): { name: string; address: string } {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      return { name: String(v.name ?? ""), address: String(v.address ?? "") };
    }
  } catch {}
  return { name: "", address: "" };
}

export function DraftPetitionDialog({
  vehicleId,
  failureModeId,
  disabled,
}: {
  vehicleId: string;
  failureModeId: string;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const draft = useActionMutation<
    { id: string; title: string },
    {
      vehicleId: string;
      failureModeId: string;
      petitionerName: string;
      petitionerAddress: string;
    }
  >("draft-petition", {
    timeoutMs: 120_000,
    onSuccess: (res) => {
      setOpen(false);
      toast.success("Petition drafted");
      navigate(`/petitions/${encodeURIComponent(res.id)}`);
    },
    onError: (error) => {
      toast.error(actionErrorMessage(error) ?? "Could not draft the petition.");
    },
  });

  const valid = name.trim().length > 1 && address.trim().length > 5;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          const saved = loadPetitioner();
          setName((n) => n || saved.name);
          setAddress((a) => a || saved.address);
        }
        if (!draft.isPending) setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <IconFileText className="size-4" />
          Draft petition
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden rounded-[22px] p-0 sm:max-w-[30rem]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid || draft.isPending) return;
            try {
              localStorage.setItem(
                STORE_KEY,
                JSON.stringify({ name: name.trim(), address: address.trim() }),
              );
            } catch {}
            draft.mutate({
              vehicleId,
              failureModeId,
              petitionerName: name.trim(),
              petitionerAddress: address.trim(),
            });
          }}
        >
          <div className="bg-ur-sand px-6 pb-6 pt-7 sm:px-8">
            <DialogHeader className="text-left">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-card shadow-[var(--ur-shadow)]">
                <BrandMark className="size-7" />
              </div>
              <DialogTitle className="ur-title text-[1.75rem]">Draft a petition</DialogTitle>
              <DialogDescription className="mt-1 text-[14.5px] leading-relaxed">
                The agent writes a formal request asking NHTSA to investigate,
                using the owner complaints behind this problem. The law asks for
                the petitioner’s name and mailing address.
              </DialogDescription>
            </DialogHeader>
          </div>

          {draft.isPending ? (
            <div className="space-y-4 px-6 py-8 sm:px-8" aria-live="polite">
              <div className="flex items-center gap-3">
                <BrandMark className="size-8" />
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold">
                    Unrecalled <span className="ur-agent-badge">Agent</span>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-muted-foreground">
                    Drafting your petition <Typing />
                  </div>
                </div>
              </div>
              <ol className="space-y-2 ps-11 text-[13.5px] text-muted-foreground">
                <li>Gathering the owner complaints</li>
                <li>Checking recalls, investigations and settlements</li>
                <li>Writing it up for your review</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-5 px-6 py-6 sm:px-8">
              <div className="space-y-1.5">
                <Label htmlFor="pet-name" className="text-[13px]">Your name</Label>
                <Input
                  id="pet-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pet-address" className="text-[13px]">Mailing address</Label>
                <Textarea
                  id="pet-address"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  className="rounded-xl"
                />
              </div>
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                <IconLock className="mt-0.5 size-3.5 shrink-0" />
                It goes on your petition and is remembered on this device, so you
                don’t retype it. Nothing is sent to NHTSA; you send it yourself.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 border-t px-6 py-4 sm:px-8">
            <button
              type="button"
              className="ur-btn-soft h-10 px-4 text-sm"
              onClick={() => setOpen(false)}
              disabled={draft.isPending}
            >
              Cancel
            </button>
            <button type="submit" className="ur-btn h-10 px-5 text-sm" disabled={!valid || draft.isPending}>
              {draft.isPending ? (
                <IconLoader2 className="size-4 motion-safe:animate-spin" />
              ) : null}
              {draft.isPending ? "Drafting…" : "Draft petition"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
