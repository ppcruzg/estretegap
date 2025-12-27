## database estructura
// [
  {
    "constraint_name": "activity_feed_page_id_fkey",
    "table_name": "activity_feed",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "activity_feed_item_id_fkey",
    "table_name": "activity_feed",
    "column_name": "item_id",
    "foreign_table_name": "items",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "SET NULL"
  },
  {
    "constraint_name": "change_history_page_id_fkey",
    "table_name": "change_history",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "column_status_categories_column_id_fkey",
    "table_name": "column_status_categories",
    "column_name": "column_id",
    "foreign_table_name": "columns",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "columns_page_id_fkey",
    "table_name": "columns",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "company_users_company_id_fkey",
    "table_name": "company_users",
    "column_name": "company_id",
    "foreign_table_name": "companies",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "company_users_user_id_fkey",
    "table_name": "company_users",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "documentation_links_page_id_fkey",
    "table_name": "documentation_links",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "footer_metrics_page_id_fkey",
    "table_name": "footer_metrics",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "items_column_id_fkey",
    "table_name": "items",
    "column_name": "column_id",
    "foreign_table_name": "columns",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "page_status_categories_page_id_fkey",
    "table_name": "page_status_categories",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "pages_company_id_fkey",
    "table_name": "pages",
    "column_name": "company_id",
    "foreign_table_name": "companies",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "constraint_name": "pages_created_by_fkey",
    "table_name": "pages",
    "column_name": "created_by",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "NO ACTION"
  },
  {
    "constraint_name": "permissions_page_id_fkey",
    "table_name": "permissions",
    "column_name": "page_id",
    "foreign_table_name": "pages",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  },
  {
    "constraint_name": "permissions_user_id_fkey",
    "table_name": "permissions",
    "column_name": "user_id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id",
    "update_rule": "NO ACTION",
    "delete_rule": "CASCADE"
  }
]

### database rls
[
  {
    "schemaname": "public",
    "tablename": "column_status_categories",
    "policyname": "column_status_categories_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((column_id IN ( SELECT c.id\n   FROM columns c\n  WHERE (c.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT c.id\n   FROM (columns c\n     JOIN pages p ON ((p.id = c.page_id)))\n  WHERE (p.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "column_status_categories",
    "policyname": "column_status_categories_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT c.id\n   FROM (columns c\n     JOIN pages p ON ((p.id = c.page_id)))\n  WHERE (p.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "column_status_categories",
    "policyname": "column_status_categories_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT pages.id\n           FROM pages\n          WHERE (pages.company_id IN ( SELECT company_users.company_id\n                   FROM company_users\n                  WHERE (company_users.user_id = auth.uid())))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "column_status_categories",
    "policyname": "column_status_categories_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((column_id IN ( SELECT c.id\n   FROM columns c\n  WHERE (c.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT c.id\n   FROM (columns c\n     JOIN pages p ON ((p.id = c.page_id)))\n  WHERE (p.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": "((column_id IN ( SELECT c.id\n   FROM columns c\n  WHERE (c.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT c.id\n   FROM (columns c\n     JOIN pages p ON ((p.id = c.page_id)))\n  WHERE (p.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "column_status_categories",
    "policyname": "superadmin_all_column_status_categories",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "columns",
    "policyname": "columns_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "columns",
    "policyname": "columns_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "columns",
    "policyname": "columns_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE (company_users.user_id = get_my_profile_id())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "columns",
    "policyname": "columns_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "columns",
    "policyname": "superadmin_all_columns",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "companies",
    "policyname": "Usuarios pueden ver sus empresas",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((EXISTS ( SELECT 1\n   FROM company_users cu\n  WHERE ((cu.company_id = companies.id) AND (cu.user_id = get_my_profile_id())))) OR check_is_admin())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "companies",
    "policyname": "companies_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(id IN ( SELECT company_users.company_id\n   FROM company_users\n  WHERE (company_users.user_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "companies",
    "policyname": "superadmin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "companies",
    "policyname": "superadmin_all_companies",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "company_users",
    "policyname": "Gestión de relaciones (Propios o Admin)",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((user_id = get_my_profile_id()) OR check_is_admin())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "company_users",
    "policyname": "Users can read their company roles",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = get_my_profile_id())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "company_users",
    "policyname": "company_users_delete_superadmin",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "company_users",
    "policyname": "company_users_insert_superadmin",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "company_users",
    "policyname": "company_users_select_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(user_id = get_my_profile_id())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "company_users",
    "policyname": "company_users_update_superadmin",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "documentation_links",
    "policyname": "documentation_links_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "documentation_links",
    "policyname": "documentation_links_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "documentation_links",
    "policyname": "documentation_links_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE (company_users.user_id = get_my_profile_id())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "documentation_links",
    "policyname": "documentation_links_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "documentation_links",
    "policyname": "superadmin_all_documentation_links",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "footer_metrics",
    "policyname": "footer_metrics_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "footer_metrics",
    "policyname": "footer_metrics_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "footer_metrics",
    "policyname": "footer_metrics_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE (company_users.user_id = get_my_profile_id())))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "footer_metrics",
    "policyname": "footer_metrics_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": "((page_id IN ( SELECT permissions.page_id\n   FROM permissions\n  WHERE ((permissions.user_id = auth.uid()) AND (permissions.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))"
  },
  {
    "schemaname": "public",
    "tablename": "footer_metrics",
    "policyname": "superadmin_all_footer_metrics",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "items",
    "policyname": "items_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT pages.id\n           FROM pages\n          WHERE (pages.company_id IN ( SELECT company_users.company_id\n                   FROM company_users\n                  WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "items",
    "policyname": "items_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT pages.id\n           FROM pages\n          WHERE (pages.company_id IN ( SELECT company_users.company_id\n                   FROM company_users\n                  WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))))"
  },
  {
    "schemaname": "public",
    "tablename": "items",
    "policyname": "items_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT pages.id\n           FROM pages\n          WHERE (pages.company_id IN ( SELECT company_users.company_id\n                   FROM company_users\n                  WHERE (company_users.user_id = get_my_profile_id())))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "items",
    "policyname": "items_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT permissions.page_id\n           FROM permissions\n          WHERE ((permissions.user_id = get_my_profile_id()) AND (permissions.can_edit = true)))))) OR (column_id IN ( SELECT columns.id\n   FROM columns\n  WHERE (columns.page_id IN ( SELECT pages.id\n           FROM pages\n          WHERE (pages.company_id IN ( SELECT company_users.company_id\n                   FROM company_users\n                  WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "items",
    "policyname": "superadmin_all_items",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "pages",
    "policyname": "Admins full access pages",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "check_is_admin()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pages",
    "policyname": "Company Admins can manage pages",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM company_users cu\n  WHERE ((cu.company_id = pages.company_id) AND (cu.user_id = get_my_profile_id()) AND (cu.role = 'company-admin'::text))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "pages",
    "policyname": "Users can create pages for their company",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM company_users cu\n  WHERE ((cu.user_id = get_my_profile_id()) AND (cu.company_id = pages.company_id) AND (cu.role = ANY (ARRAY['company-admin'::text, 'owner'::text])))))"
  },
  {
    "schemaname": "public",
    "tablename": "pages",
    "policyname": "allow all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "permissions",
    "policyname": "permissions_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((page_id IN ( SELECT permissions_1.page_id\n   FROM permissions permissions_1\n  WHERE ((permissions_1.user_id = auth.uid()) AND (permissions_1.role = 'owner'::text)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = auth.uid()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "permissions",
    "policyname": "permissions_insert_self",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = get_my_profile_id())"
  },
  {
    "schemaname": "public",
    "tablename": "permissions",
    "policyname": "permissions_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE (company_users.user_id = get_my_profile_id()))))) OR (user_id = get_my_profile_id()))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "permissions",
    "policyname": "permissions_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((page_id IN ( SELECT permissions_1.page_id\n   FROM permissions permissions_1\n  WHERE ((permissions_1.user_id = get_my_profile_id()) AND (permissions_1.can_edit = true)))) OR (page_id IN ( SELECT pages.id\n   FROM pages\n  WHERE (pages.company_id IN ( SELECT company_users.company_id\n           FROM company_users\n          WHERE ((company_users.user_id = get_my_profile_id()) AND (company_users.role = 'company-admin'::text)))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "permissions",
    "policyname": "superadmin_all_permissions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.user_id = auth.uid()) AND (p.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Acceso a perfiles (Propios o Admin)",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((auth.uid() = user_id) OR check_is_admin())",
    "with_check": "((auth.uid() = user_id) OR check_is_admin())"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Superadmins pueden crear perfiles de otros",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM profiles profiles_1\n  WHERE ((profiles_1.user_id = auth.uid()) AND (profiles_1.is_admin = true))))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "superadmin_full_access_profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(is_admin = true)",
    "with_check": "(is_admin = true)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "user_can_select_own_profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "user_can_update_own_profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": "(user_id = auth.uid())"
  }
]