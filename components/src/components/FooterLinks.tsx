import React, { useState } from "react";
import { ExternalLink, Trash2, FileText, Plus, Edit3, BookOpen } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

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
    <div className="border-t-2 border-slate-300 dark:border-slate-800 pt-6 mt-8 bg-gradient-to-b from-slate-100/50 to-transparent dark:from-slate-900/50 dark:to-transparent rounded-t-2xl transition-colors">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            < BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('docAndLinks')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('docSub')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:scale-105"
        >
          <Plus size={16} />
          {t('addLink')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* NUEVO LINK */}
        {editingId === "NEW" && (
          <div className="group rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 p-5 flex flex-col gap-3 shadow-lg hover:shadow-xl dark:shadow-none transition-all duration-300 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('newLink')}</span>
            </div>

            <input
              className="text-sm font-medium border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
              placeholder={t('titlePlaceholder')}
              value={draft.title || ""}
              onChange={(e) =>
                setDraft({ ...draft, title: e.target.value })
              }
            />

            <input
              className="text-sm border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
              placeholder="https://..."
              value={draft.url || ""}
              onChange={(e) =>
                setDraft({ ...draft, url: e.target.value })
              }
            />

            <textarea
              className="text-sm border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 resize-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
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
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                onClick={resetEdit}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
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
              className={`group rounded-xl border-2 bg-white dark:bg-slate-900 p-5 flex flex-col gap-3 transition-all duration-300 ${isEditing
                ? "border-indigo-300 dark:border-indigo-500 shadow-xl dark:shadow-none scale-105"
                : "border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-md hover:shadow-lg dark:hover:shadow-none hover:scale-102"
                }`}
            >
              {isEditing ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-lg flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('editing')}</span>
                  </div>

                  <input
                    className="text-sm font-medium border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                    value={draft.title || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                  />

                  <input
                    className="text-sm border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                    value={draft.url || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, url: e.target.value })
                    }
                  />

                  <textarea
                    className="text-sm border-2 border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 rounded-lg px-3 py-2 resize-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                    rows={3}
                    value={draft.description || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />

                  <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-all duration-200"
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
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                        onClick={resetEdit}
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
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
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-indigo-100 group-hover:to-indigo-200 dark:group-hover:from-indigo-800 dark:group-hover:to-indigo-700 transition-all duration-200">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {link.title}
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-200 flex-shrink-0 mt-1" />
                    </div>

                    {link.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 pl-11">
                        {link.description}
                      </p>
                    )}
                  </a>

                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-all duration-200"
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
