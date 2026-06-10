"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createPayment(phaseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("payments")
    .upsert(
      { user_id: user.id, phase_id: phaseId, status: "pending" },
      { onConflict: "user_id,phase_id", ignoreDuplicates: true }
    );

  if (error) return { error: "Erro ao criar registro de pagamento." };
  return { success: true };
}

export async function confirmPayment(
  paymentId: string,
  userId: string,
  phaseId: string
) {
  const supabase = await createClient();
  const {
    data: { user: admin },
  } = await supabase.auth.getUser();

  if (
    !admin?.email ||
    !process.env.ADMIN_EMAIL ||
    admin.email !== process.env.ADMIN_EMAIL
  ) {
    return { error: "Acesso negado." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("confirm_payment", {
    p_payment_id: paymentId,
    p_user_id: userId,
    p_phase_id: phaseId,
    p_admin_id: admin.id,
  });

  if (error) return { error: `Erro ao confirmar pagamento: ${error.message}` };

  revalidatePath("/admin/pagamentos");
  return { success: true };
}
