"use client";

import { estimatedSalary, fromMillions, POSITIONS, type Position } from "@engine";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePlanStore } from "@/lib/plan-store";
import { cn } from "@/lib/utils";
import { t } from "@/messages";

type Origin = "youth" | "created";

export function CreatePlayerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        {open ? <Body onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function Body({ onClose }: { onClose: () => void }) {
  const add = usePlanStore((s) => s.addCustomPlayer);
  const [origin, setOrigin] = useState<Origin>("youth");
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Position>("ST");
  const [valueText, setValueText] = useState("0");
  const value = Number(valueText.replace(",", "."));
  const valueOk = valueText.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= 500;
  const nameOk = name.trim().length > 0;

  function confirm() {
    const marketValue = fromMillions(value);
    add({
      id: `custom:${Date.now().toString(36)}${Math.floor(performance.now()).toString(36)}`,
      name: name.trim(),
      position,
      marketValue,
      salary: estimatedSalary(marketValue),
      origin,
    });
    onClose();
  }

  return (
    <>
      <SheetHeader className="pr-14">
        <SheetTitle className="text-xl">{t.market.createTitle}</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col gap-4 px-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(["youth", "created"] as Origin[]).map((o) => (
            <Button key={o} role="radio" aria-checked={origin === o} variant={origin === o ? "default" : "outline"} onClick={() => setOrigin(o)}>
              {t.market.createOrigin[o]}
            </Button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.market.createName}</span>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-md border bg-card px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="pb-1.5 text-sm font-medium">{t.market.createPosition}</legend>
          <div className="grid grid-cols-5 gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                aria-pressed={position === pos}
                onClick={() => setPosition(pos)}
                className={cn(
                  "h-11 rounded-md border text-sm font-medium",
                  position === pos ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                {t.squad.positions[pos]}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.market.createValue}</span>
          <input
            inputMode="decimal"
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            aria-invalid={!valueOk}
            className="h-11 max-w-48 rounded-md border bg-card px-3 text-base tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
          />
        </label>
        {!nameOk && name !== "" ? <p className="text-sm text-destructive">{t.market.createNameInvalid}</p> : null}
        <Button className="self-start" disabled={!nameOk || !valueOk} onClick={confirm}>
          {t.market.createConfirm}
        </Button>
      </div>
    </>
  );
}
