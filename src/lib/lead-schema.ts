import { z } from "zod";

export const leadSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre"),
  email: z.string().trim().min(1, "Ingresá tu email").email("Email inválido"),
  whatsapp: z.string().trim().optional().or(z.literal("")),
});

export type LeadValues = z.infer<typeof leadSchema>;
