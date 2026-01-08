import { supabase } from "../lib/supabaseClient";
import { Profile, Company, CompanyUser } from "../../../types";

/**
 * Repository for Administration logic (Profiles, Companies, Roles).
 * Following PRD v1.1: repositories DO NOT validate permissions (handled by RLS).
 */

/* ============================================================
   PROFILES
   ============================================================ */

export async function getProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("email");

    if (error) throw error;
    return data || [];
}

export async function updateProfile(profileId: string, fields: Partial<Profile>) {
    const { data, error } = await supabase
        .from("profiles")
        .update(fields)
        .eq("id", profileId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function toggleSuperAdmin(profileId: string, isAdmin: boolean) {
    return updateProfile(profileId, { is_admin: isAdmin });
}

export async function signUpAdminUser(email: string, name: string, companyId?: string, role?: 'company-admin' | 'company-user', isSuperAdmin: boolean = false) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password: "Invitado2025!", // Temporary password for testing
        options: {
            data: {
                full_name: name,
            },
            emailRedirectTo: import.meta.env.VITE_SITE_URL || window.location.origin,
        }
    });

    if (error) throw error;

    // Auto-confirm email for development (bypass email confirmation)
    if (data.user) {
        // Confirm email using admin API
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
            data.user.id,
            { email_confirm: true }
        );

        if (confirmError) {
            console.warn("Could not auto-confirm email:", confirmError);
            // Don't throw, continue with profile creation
        }
    }

    // Create profile row immediately so the admin can see and assign companies
    if (data.user) {
        const { data: profileData, error: profileError } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            email: email,
            name: name,
            is_admin: isSuperAdmin
        }).select('id').single();

        if (profileError) {
            console.error("Error creating initial profile:", profileError);
            throw new Error(`No se pudo crear el perfil del usuario: ${profileError.message}. Verifica que las políticas RLS permitan la creación de perfiles.`);
        }

        // Optional: Assign to company immediately
        if (companyId && role && profileData) {
            const { error: assignError } = await supabase
                .from("company_users")
                .insert({
                    company_id: companyId,
                    user_id: profileData.id, // Use the internal profile ID, not Auth UID
                    role: role
                });

            if (assignError) {
                console.error("Error assigning user to company during signup:", assignError);
                throw new Error(`El usuario fue creado pero no se pudo asignar a la empresa: ${assignError.message}`);
            }
        }
    }

    return data;
}

/* ============================================================
   COMPANIES
   ============================================================ */

export async function getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

    if (error) throw error;
    return data || [];
}

export async function createCompany(name: string) {
    const { data, error } = await supabase
        .from("companies")
        .insert({ name, is_enabled: true })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCompany(companyId: string, fields: Partial<Company>) {
    const { data, error } = await supabase
        .from("companies")
        .update(fields)
        .eq("id", companyId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function toggleCompanyStatus(companyId: string, isEnabled: boolean) {
    return updateCompany(companyId, { is_enabled: isEnabled });
}

/* ============================================================
   COMPANY_USERS (Relationships & Roles)
   ============================================================ */

export async function getCompanyUsers(): Promise<CompanyUser[]> {
    const { data, error } = await supabase
        .from("company_users")
        .select("*");

    if (error) throw error;
    return data || [];
}

export async function assignUserToCompany(userId: string, companyId: string, role: CompanyUser['role']) {
    const { data, error } = await supabase
        .from("company_users")
        .insert({ user_id: userId, company_id: companyId, role })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeUserFromCompany(relationId: string) {
    const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("id", relationId);

    if (error) throw error;
}

export async function updateCompanyUserRole(relationId: string, role: CompanyUser['role']) {
    const { data, error } = await supabase
        .from("company_users")
        .update({ role })
        .eq("id", relationId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
