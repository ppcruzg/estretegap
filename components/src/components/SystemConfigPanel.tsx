import React, { useState, useEffect } from "react";
import { X, Key, Save, CheckCircle, AlertCircle, Loader2, Hash, Trash2, Plus, FileText, RotateCcw, Bookmark, History } from "lucide-react";
import * as Repo from "../repository/estrategiaRepository";
import { validateOpenAIKey, DEFAULT_AI_PROMPT } from "../services/aiService";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";

interface SystemConfigPanelProps {
    onClose: () => void;
}

const SystemConfigPanel: React.FC<SystemConfigPanelProps> = ({ onClose }) => {
    const { profile } = useAuth();
    const { t } = useTranslation();
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState("gpt-4o");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [validating, setValidating] = useState(false);
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

    const loadConfig = async () => {
        setLoading(true);
        try {
            const config = await Repo.getAllSystemConfig();
            setApiKey(config.openai_api_key || "");
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

    const handleValidateKey = async () => {
        if (!apiKey.trim()) {
            setMessage({ type: "error", text: t('enterApiKey') });
            return;
        }

        setValidating(true);
        setMessage(null);

        try {
            const isValid = await validateOpenAIKey(apiKey);
            if (isValid) {
                setMessage({ type: "success", text: `✓ ${t('validKey')}` });
            } else {
                setMessage({ type: "error", text: t('invalidKey') });
            }
        } catch (error) {
            setMessage({ type: "error", text: t('validationError') });
        } finally {
            setValidating(false);
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
            await Repo.updateSystemConfig("openai_api_key", apiKey, profile.id);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <Key className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{t('systemConfig')}</h2>
                            <p className="text-sm text-slate-500">{t('aiPlatform')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* API Key */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('apiKey')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleValidateKey}
                                        disabled={validating || !apiKey.trim()}
                                        className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {validating ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle size={16} />
                                        )}
                                        {t('validate')}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('getApiKey')}{" "}
                                    <a
                                        href="https://platform.openai.com/api-keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:underline"
                                    >
                                        platform.openai.com/api-keys
                                    </a>
                                </p>
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('aiModel')}
                                </label>
                                <select
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                >
                                    <option value="gpt-4o">GPT-4o (Recomendado)</option>
                                    <option value="gpt-4o-mini">GPT-4o Mini (Más económico)</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('modelDesc')}
                                </p>
                            </div>

                            {/* AI Prompt Editor */}
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <FileText size={16} className="text-purple-600" />
                                        {t('aiPromptDesc')}
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowLocalHistory(!showLocalHistory)}
                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title={t('localCollectionTitle')}
                                        >
                                            <History size={14} />
                                            {t('localCollection', { count: localPrompts.length })}
                                        </button>
                                        <button
                                            onClick={handleResetPrompt}
                                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title={t('restoreDefault')}
                                        >
                                            <RotateCcw size={14} />
                                            {t('restoreDefault')}
                                        </button>
                                    </div>
                                </div>

                                {showLocalHistory && (
                                    <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{t('localCollectionTitle')}</p>
                                        {localPrompts.map((p, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleLoadLocalPrompt(p)}
                                                className="w-full text-left p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg text-xs text-slate-600 line-clamp-1 transition-all"
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
                                        className="w-full h-48 px-4 py-3 border-2 border-slate-200 rounded-xl text-xs font-mono focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none bg-slate-50/50"
                                        placeholder={t('promptPlaceholder')}
                                    />
                                    <button
                                        onClick={handleSaveLocalPrompt}
                                        className="absolute bottom-3 right-3 p-2 bg-white shadow-md border border-slate-200 rounded-lg text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all opacity-0 group-hover:opacity-100"
                                        title={t('saveToLocal')}
                                    >
                                        <Bookmark size={16} />
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{"{{pageTitle}}"}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{"{{itemsCount}}"}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{"{{itemsJson}}"}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{"{{historyJson}}"}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{"{{tagsList}}"}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{"{{currentDate}}"}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 italic">
                                    {t('promptInjectHelp')}
                                </p>
                            </div>

                            {/* Tag Management */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {t('tagManagement')}
                                </label>
                                <p className="text-xs text-slate-500 mb-4">
                                    {t('tagManagementDesc')}
                                </p>

                                <div className="flex gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Hash size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder={t('newTagPlaceholder')}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddTag}
                                        disabled={!newTag.trim()}
                                        className="px-4 py-3 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        {t('addTag')}
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                                    {tags.map((tag) => (
                                        <div
                                            key={tag}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200 hover:border-slate-300 transition-all group"
                                        >
                                            <Hash size={12} className="text-slate-400" />
                                            {tag.startsWith('#') ? tag.substring(1) : tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-red-600 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {tags.length === 0 && (
                                        <p className="text-xs text-slate-400 italic py-2">{t('noTags')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Message */}
                            {message && (
                                <div
                                    className={`flex items-center gap-2 p-4 rounded-xl ${message.type === "success"
                                        ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-2 border-red-200"
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
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                    ℹ️ {t('costInfoTitle')}
                                </h3>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li>• {t('costInfo1')}</li>
                                    <li>• {t('costInfo2')}</li>
                                    <li>• {t('costInfo3')}</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-all font-medium"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !apiKey.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
