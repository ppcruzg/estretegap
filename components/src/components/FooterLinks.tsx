import React, { useState } from "react";
import { ExternalLink, Trash2, FileText, Plus, Edit3, BookOpen } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { buttonClasses } from "./ui";

interface FooterLink {
  id: string;
  title: string;
  description?: string;
  url: string;
}

interface FooterLinksProps {
  links: FooterLink[];
  onCreate: (fields: Partial<FooterLink>) => Promise<void>;
  onUpdate: (id: string, fields: Partial<FooterLink>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FooterLinks: React.FC<FooterLinksProps> = ({
  links,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<FooterLink>>({});
  const { t } = useTranslation();

  const startEdit = (link: FooterLink) => {
    setEditingId(link.id);
    setDraft({
      title: link.title,
      url: link.url,
      description: link.description,
    });
  };

  const startCreate = () => {
    setEditingId("NEW");
    setDraft({ title: "", url: "", description: "" });
  };

  const resetEdit = () => {
    setEditingId(null);
    setDraft({});
  };

  const save = async () => {
    const id = editingId;
    const payload = { ...draft };

    // 🔑 CERRAR EDICIÓN ANTES DEL RERENDER GLOBAL
    resetEdit();

    if (id === "NEW") {
      await onCreate(payload);
    } else if (id) {
      await onUpdate(id, payload);
    }
  };

  return (
    <div className="border-t-2 border-border-strong pt-6 mt-8 bg-gradient-to-b from-surface-muted/60 to-transparent rounded-t-card transition-colors">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-fg">
              {t('docAndLinks')}
            </h3>
            <p className="text-xs text-fg-muted">
              {t('docSub')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className={buttonClasses("primary", "md")}
        >
          <Plus size={16} />
          {t('addLink')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* NUEVO LINK */}
        {editingId === "NEW" && (
          <div className="group rounded-card border-2 border-primary/40 bg-surface p-5 flex flex-col gap-3 shadow-pop transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary-soft rounded-control flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-soft-fg" />
              </div>
              <span className="text-sm font-semibold text-fg">{t('newLink')}</span>
            </div>

            <input
              className="text-sm font-medium border border-border bg-surface text-fg rounded-control px-3 py-2 hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
              placeholder={t('titlePlaceholder')}
              value={draft.title || ""}
              onChange={(e) =>
                setDraft({ ...draft, title: e.target.value })
              }
            />

            <input
              className="text-sm border border-border bg-surface text-fg rounded-control px-3 py-2 hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
              placeholder="https://..."
              value={draft.url || ""}
              onChange={(e) =>
                setDraft({ ...draft, url: e.target.value })
              }
            />

            <textarea
              className="text-sm border border-border bg-surface text-fg rounded-control px-3 py-2 resize-none hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
              rows={3}
              placeholder={t('addDescription')}
              value={draft.description || ""}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                className={buttonClasses("ghost", "md")}
                onClick={resetEdit}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className={buttonClasses("primary", "md")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  save();
                }}
              >
                {t('save')}
              </button>
            </div>
          </div>
        )}

        {/* LINKS EXISTENTES */}
        {links.map((link) => {
          const isEditing = editingId === link.id;

          return (
            <div
              key={link.id}
              className={`group rounded-card border bg-surface p-5 flex flex-col gap-3 transition-all duration-300 ${isEditing
                ? "border-primary/50 shadow-pop scale-105"
                : "border-border hover:border-primary/40 shadow-card hover:shadow-pop hover:scale-102"
                }`}
            >
              {isEditing ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary-soft rounded-control flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-primary-soft-fg" />
                    </div>
                    <span className="text-sm font-semibold text-fg">{t('editing')}</span>
                  </div>

                  <input
                    className="text-sm font-medium border border-border bg-surface text-fg rounded-control px-3 py-2 hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
                    value={draft.title || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                  />

                  <input
                    className="text-sm border border-border bg-surface text-fg rounded-control px-3 py-2 hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
                    value={draft.url || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, url: e.target.value })
                    }
                  />

                  <textarea
                    className="text-sm border border-border bg-surface text-fg rounded-control px-3 py-2 resize-none hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
                    rows={3}
                    value={draft.description || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />

                  <div className="flex justify-between items-center mt-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm font-medium text-danger hover:bg-danger-soft px-3 py-1.5 rounded-control transition-colors duration-200"
                      onClick={async () => {
                        await onDelete(link.id);
                        resetEdit();
                      }}
                    >
                      <Trash2 size={14} /> {t('delete')}
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={buttonClasses("ghost", "md")}
                        onClick={resetEdit}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        className={buttonClasses("primary", "md")}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          save();
                        }}
                      >
                        {t('save')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-3 flex-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-9 h-9 bg-primary-soft rounded-control flex items-center justify-center flex-shrink-0 transition-all duration-200">
                          <FileText className="w-4 h-4 text-primary-soft-fg" />
                        </div>
                        <span className="text-sm font-semibold text-fg group-hover:text-primary transition-colors line-clamp-2">
                          {link.title}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-fg-subtle group-hover:text-primary transition-all duration-200 flex-shrink-0 mt-1" />
                    </div>

                    {link.description && (
                      <p className="text-xs text-fg-muted leading-relaxed line-clamp-3 pl-11">
                        {link.description}
                      </p>
                    )}
                  </a>

                  <div className="flex justify-end pt-2 border-t border-border mt-auto">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-primary-soft-fg hover:bg-primary-soft px-3 py-1.5 rounded-control transition-colors duration-200"
                      onClick={() => startEdit(link)}
                    >
                      <Edit3 size={12} />
                      {t('edit')}
                    </button>
                  </div>
                </>
              )
              }
            </div>
          );
        })}
      </div>
    </div >
  );
};

export default FooterLinks;
