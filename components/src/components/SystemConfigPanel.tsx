import React, { useState, useEffect } from "react";
import { X, Key, Save, CheckCircle, AlertCircle, Loader2, Hash, Trash2, Plus, FileText, RotateCcw, Bookmark, History } from "lucide-react";
import * as Repo from "../repository/estrategiaRepository";
import { DEFAULT_AI_PROMPT } from "../services/aiService";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import IconButton from "./ui/IconButton";
import { buttonClasses } from "./ui";

interface SystemConfigPanelProps {
    onClose: () => void;
}

const SystemConfigPanel: React.FC<SystemConfigPanelProps> = ({ onClose }) => {
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [model, setModel] = useState("gpt-4o");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_PROMPT);
    const [localPrompts, setLocalPrompts] = useState<string[]>([]);
    const [showLocalHistory, setShowLocalHistory] = useState(false);

    const SAVED_PROMPTS_KEY = "estrategia_saved_prompts";

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const config = await Repo.getAllSystemConfig();
            setModel(config.openai_model || "gpt-4o");
            setAiPrompt(config.ai_report_prompt || DEFAULT_AI_PROMPT);
        } catch (error) {
            console.error("Error loading config:", error);
        } finally {
            setLoading(false);
        }

        try {
            const projectTags = await Repo.getProjectTags();
            setTags([...projectTags].sort((a, b) => a.localeCompare(b)));
        } catch (error) {
            console.error("Error loading tags:", error);
        }

        const saved = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (saved) {
            try {
                setLocalPrompts(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading local prompts:", e);
            }
        }
    };

    const handleSave = async () => {
        if (!profile?.id) {
            setMessage({ type: "error", text: t('notAuthenticated') });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            await Repo.updateSystemConfig("openai_model", model, profile.id);
            await Repo.updateSystemConfig("ai_report_prompt", aiPrompt, profile.id);
            await Repo.saveProjectTags(tags, profile.id);
            setMessage({ type: "success", text: t('configSaved') });

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Error saving config:", error);
            setMessage({ type: "error", text: t('saveConfigError') });
        } finally {
            setSaving(false);
        }
    };

    const handleAddTag = () => {
        let tag = newTag.trim();
        if (!tag) return;
        if (!tag.startsWith("#")) tag = "#" + tag;

        if (tags.includes(tag)) {
            setMessage({ type: "error", text: t('tagAlreadyExists') });
            return;
        }

        const updatedTags = [...tags, tag].sort((a, b) => a.localeCompare(b));
        setTags(updatedTags);
        setNewTag("");
        setMessage(null);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSaveLocalPrompt = () => {
        if (!aiPrompt.trim()) return;

        const updated = [aiPrompt, ...localPrompts.filter(p => p !== aiPrompt)].slice(0, 4);
        setLocalPrompts(updated);
        localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(updated));
        setMessage({ type: "success", text: t('promptSaved') });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleResetPrompt = () => {
        setAiPrompt(DEFAULT_AI_PROMPT);
        setMessage({ type: "success", text: t('promptRestored') });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleLoadLocalPrompt = (p: string) => {
        setAiPrompt(p);
        setShowLocalHistory(false);
        setMessage({ type: "success", text: t('promptLoaded') });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
            <div role="dialog" aria-modal="true" aria-labelledby="system-config-title" className="bg-surface-raised text-fg border border-border rounded-card shadow-pop w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary text-primary-fg rounded-control flex items-center justify-center shadow-card">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 id="system-config-title" className="text-xl font-bold text-fg">{t('systemConfig')}</h2>
                            <p className="text-sm text-fg-muted">{t('aiPlatform')}</p>
                        </div>
                    </div>
                    <IconButton aria-label={t('close')} onClick={onClose}>
                        <X size={20} />
                    </IconButton>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* API Key */}
                            <div>
                                <label className="block text-sm font-semibold text-fg mb-2">
                                    {t('apiKey')}
                                </label>
                                <p className="text-xs text-fg-muted bg-surface-muted border border-border rounded-control px-4 py-3">
                                    {t('apiKeyServerManaged')}
                                </p>
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-fg mb-2">
                                    {t('aiModel')}
                                </label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full px-4 py-3 border border-border bg-surface text-fg rounded-control text-sm hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
                                >
                                    <option value="gpt-4o">GPT-4o (Recomendado)</option>
                                    <option value="gpt-4o-mini">GPT-4o Mini (Más económico)</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                </select>
                                <p className="text-xs text-fg-muted mt-2">
                                    {t('modelDesc')}
                                </p>
                            </div>

                            {/* AI Prompt Editor */}
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-fg">
                                        <FileText size={16} className="text-primary" />
                                        {t('aiPromptDesc')}
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowLocalHistory(!showLocalHistory)}
                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-muted rounded-control transition-colors"
                                            title={t('localCollectionTitle')}
                                        >
                                            <History size={14} />
                                            {t('localCollection', { count: localPrompts.length })}
                                        </button>
                                        <button
                                            onClick={handleResetPrompt}
                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-muted rounded-control transition-colors"
                                            title={t('restoreDefault')}
                                        >
                                            <RotateCcw size={14} />
                                            {t('restoreDefault')}
                                        </button>
                                    </div>
                                </div>

                                {showLocalHistory && (
                                    <div className="mb-3 p-3 bg-surface-muted border border-border rounded-control space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-[11px] uppercase tracking-wider font-bold text-fg-muted mb-1">{t('localCollectionTitle')}</p>
                                        {localPrompts.map((p, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleLoadLocalPrompt(p)}
                                                className="w-full text-left p-2 hover:bg-surface hover:shadow-card border border-transparent hover:border-border rounded-control text-xs text-fg-muted hover:text-fg line-clamp-1 transition-all"
                                            >
                                                {p.substring(0, 100)}...
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="relative group">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        className="w-full h-48 px-4 py-3 border border-border bg-surface-muted text-fg rounded-control text-xs font-mono hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors resize-none"
                                        placeholder={t('promptPlaceholder')}
                                    />
                                    <button
                                        onClick={handleSaveLocalPrompt}
                                        className="absolute bottom-3 right-3 p-2 bg-surface shadow-card border border-border rounded-control text-fg-subtle hover:text-primary hover:border-primary/40 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                        title={t('saveToLocal')}
                                        aria-label={t('saveToLocal')}
                                    >
                                        <Bookmark size={16} />
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-fg-muted rounded border border-border">{"{{pageTitle}}"}</span>
                                    <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-fg-muted rounded border border-border">{"{{itemsCount}}"}</span>
                                    <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-fg-muted rounded border border-border">{"{{itemsJson}}"}</span>
                                    <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-fg-muted rounded border border-border">{"{{historyJson}}"}</span>
                                    <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-fg-muted rounded border border-border">{"{{tagsList}}"}</span>
                                    <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-fg-muted rounded border border-border">{"{{currentDate}}"}</span>
                                </div>
                                <p className="text-[11px] text-fg-subtle mt-2 italic">
                                    {t('promptInjectHelp')}
                                </p>
                            </div>

                            {/* Tag Management */}
                            <div className="pt-4 border-t border-border">
                                <label className="block text-sm font-semibold text-fg mb-2">
                                    {t('tagManagement')}
                                </label>
                                <p className="text-xs text-fg-muted mb-4">
                                    {t('tagManagementDesc')}
                                </p>

                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
                                            <Hash size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder={t('newTagPlaceholder')}
                                            className="w-full pl-10 pr-4 py-3 border border-border bg-surface text-fg rounded-control text-sm hover:border-border-strong focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 outline-none transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddTag}
                                        disabled={!newTag.trim()}
                                        className="px-4 py-3 bg-primary-soft text-primary-soft-fg rounded-control text-sm font-semibold hover:bg-primary/15 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        {t('addTag')}
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                    {tags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-surface-muted text-fg rounded-full text-xs font-medium border border-border hover:border-border-strong transition-all group"
                                        >
                                            <Hash size={12} className="text-fg-subtle" />
                                            {tag.startsWith('#') ? tag.substring(1) : tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                aria-label={t('removeTag', { tag })}
                                                title={t('removeTag', { tag })}
                                                className="text-fg-subtle hover:text-danger transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {tags.length === 0 && (
                                        <p className="text-xs text-fg-subtle italic py-2">{t('noTags')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Message */}
                            {message && (
                                <div
                                    role={message.type === "error" ? "alert" : "status"}
                                    className={`flex items-center gap-2 p-4 rounded-control ${message.type === "success"
                                        ? "bg-success-soft text-success border border-success/30"
                                        : "bg-danger-soft text-danger border border-danger/30"
                                        }`}
                                >
                                    {message.type === "success" ? (
                                        <CheckCircle size={20} />
                                    ) : (
                                        <AlertCircle size={20} />
                                    )}
                                    <span className="text-sm font-medium">{message.text}</span>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-primary-soft border border-primary/25 rounded-control p-4">
                                <h3 className="text-sm font-semibold text-primary-soft-fg mb-2">
                                    ℹ️ {t('costInfoTitle')}
                                </h3>
                                <ul className="text-xs text-fg-muted space-y-1">
                                    <li>• {t('costInfo1')}</li>
                                    <li>• {t('costInfo2')}</li>
                                    <li>• {t('costInfo3')}</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-surface-muted rounded-b-card">
                    <button
                        onClick={onClose}
                        className={buttonClasses("ghost", "md")}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={buttonClasses("primary", "md")}
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        {t('saveConfig')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemConfigPanel;
