import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const usePagePermission = (
  pageId: string | null,
  userId: string | null,
  isSuperAdmin?: boolean,
  isCompanyAdmin?: boolean
) => {
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[usePagePermission] Checking:", { pageId, userId, isSuperAdmin, isCompanyAdmin });

    if (isSuperAdmin || isCompanyAdmin) {
      console.log("[usePagePermission] Bypassing via Admin role");
      setCanEdit(true);
      setLoading(false);
      return;
    }

    if (!pageId || !userId) {
      console.log("[usePagePermission] Missing IDs, null perm");
      setCanEdit(null);
      setLoading(false);
      return;
    }

    const loadPermission = async () => {
      setLoading(true);
      try {
        const { data: pagePerms } = await supabase
          .from("permissions")
          .select("can_edit")
          .eq("page_id", pageId)
          .eq("user_id", userId)
          .maybeSingle();

        console.log("[usePagePermission] DB Result:", pagePerms);
        setCanEdit(pagePerms?.can_edit ?? false);
      } catch (error) {
        console.error("Error loading page permission:", error);
        setCanEdit(false);
      } finally {
        setLoading(false);
      }
    };

    loadPermission();
  }, [pageId, userId, isSuperAdmin, isCompanyAdmin]);

  return { canEdit, loading };
};

export default usePagePermission;
