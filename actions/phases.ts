"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (
    !user?.email ||
    !process.env.ADMIN_EMAIL ||
    user.email !== process.env.ADMIN_EMAIL
  ) {
    throw new Error("Acesso negado.");
  }
  return user;
}

export async function createPhase(formData: FormData) {
  try {
    await assertAdmin();
  } catch {
    return { error: "Acesso negado." };
  }

  const name = (formData.get("name") as string).trim();
  const pixAmount = Number(formData.get("pix_amount"));

  if (!name) return { error: "Nome da fase é obrigatório." };
  if (isNaN(pixAmount) || pixAmount <= 0) return { error: "Valor do PIX inválido." };

  const admin = createAdminClient();

  // Get active championship
  const { data: championship } = await admin
    .from("championships")
    .select("id")
    .eq("status", "active")
    .maybeSingle();

  if (!championship) return { error: "Nenhum campeonato ativo encontrado." };

  const { error } = await admin.from("phases").insert({
    championship_id: championship.id,
    name,
    pix_amount: pixAmount,
    status: "closed",
  });

  if (error) return { error: `Erro ao criar fase: ${error.message}` };

  revalidatePath("/admin/fases");
  return { success: true };
}

const VALID_TRANSITIONS: Record<string, string> = {
  closed: "open",
  open: "betting_locked",
  betting_locked: "finished",
};

export async function updatePhaseStatus(phaseId: string, newStatus: string) {
  try {
    await assertAdmin();
  } catch {
    return { error: "Acesso negado." };
  }

  const admin = createAdminClient();

  const { data: phase } = await admin
    .from("phases")
    .select("status")
    .eq("id", phaseId)
    .single();

  if (!phase) return { error: "Fase não encontrada." };

  const expectedNext = VALID_TRANSITIONS[phase.status];
  if (expectedNext !== newStatus) {
    return { error: `Transição inválida: ${phase.status} → ${newStatus}` };
  }

  // Only one phase open at a time
  if (newStatus === "open") {
    const { data: alreadyOpen } = await admin
      .from("phases")
      .select("id")
      .eq("status", "open")
      .neq("id", phaseId)
      .maybeSingle();

    if (alreadyOpen) return { error: "Já existe uma fase aberta. Feche-a primeiro." };
  }

  const { error } = await admin
    .from("phases")
    .update({ status: newStatus as "closed" | "open" | "betting_locked" | "finished" })
    .eq("id", phaseId);

  if (error) return { error: `Erro ao atualizar fase: ${error.message}` };

  revalidatePath("/admin/fases");
  revalidatePath("/");
  return { success: true };
}
