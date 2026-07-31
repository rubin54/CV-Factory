"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/app/Toast";
import { Button, Card, Field, TextArea } from "@/components/ui";
import { postJson } from "@/lib/client-api";
import type { Application } from "@/lib/cv-schema";

export function NewApplicationForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [pending, setPending] = useState(false);

  const ready = company.trim() && role.trim() && jobPosting.trim();

  const submit = async () => {
    setPending(true);
    try {
      const { application } = await postJson<{ application: Application }>("/api/tailor", {
        company: company.trim(),
        role: role.trim(),
        jobPosting,
      });
      router.push(`/applications/${application.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  };

  return (
    <Card
      title="Neue Bewerbung"
      actions={
        <Button
          variant="primary"
          onClick={submit}
          pending={pending}
          disabled={disabled || !ready}
          title={disabled ? "Erst den Master-CV anlegen" : undefined}
        >
          Zuschneiden
        </Button>
      }
    >
      {disabled && (
        <p className="mb-3 rounded-md border border-warn/25 bg-warn-soft px-3 py-2 text-[13px] text-warn">
          Der Master-CV ist noch leer.{" "}
          <Link href="/cv" className="underline underline-offset-2">
            Lege ihn zuerst an
          </Link>{" "}
          — er ist die einzige Quelle, aus der zugeschnitten wird.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Firma" value={company} onChange={setCompany} />
        <Field label="Rolle" value={role} onChange={setRole} />
      </div>
      <div className="mt-3">
        <TextArea
          label="Stellenanzeige"
          rows={12}
          value={jobPosting}
          onChange={setJobPosting}
          placeholder="Kompletten Text der Anzeige hier einfügen."
        />
      </div>
      {pending && (
        <p className="mt-2 text-xs text-muted">
          Claude arbeitet mit hohem Effort — das dauert typischerweise ein bis zwei Minuten.
        </p>
      )}
    </Card>
  );
}
