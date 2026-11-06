import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { IconFileText, IconLoader2 } from "@tabler/icons-react";
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
          Draft 552 petition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
          className="space-y-4"
        >
          <DialogHeader>
            <DialogTitle>Draft a defect petition</DialogTitle>
            <DialogDescription>
              49 CFR 552.4 requires the petitioner’s name and mailing address.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pet-name">Petitioner name</Label>
            <Input
              id="pet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pet-address">Mailing address</Label>
            <Textarea
              id="pet-address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={draft.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || draft.isPending}>
              {draft.isPending ? (
                <IconLoader2 className="size-4 motion-safe:animate-spin" />
              ) : null}
              {draft.isPending ? "Drafting…" : "Draft petition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
