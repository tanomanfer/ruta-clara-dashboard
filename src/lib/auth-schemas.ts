import { z } from "zod";

export const emailSchema = z.string().trim().min(1, "Ingresá tu email").email("Email inválido");
export const passwordSchema = z.string().min(6, "Mínimo 6 caracteres");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
