import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { useMasterdataStore } from "@/store/masterdataStore";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";

const LABEL_TYPE = "ISSUE_LABEL";

const DEFAULT_FORM = { value: "", code: "", type: LABEL_TYPE };

function normalizeType(type) {
    return String(type || "").trim().replace(/[\s-]+/g, "_").toUpperCase();
}

function isLabelItem(item) {
    const type = normalizeType(item.type ?? item.masterdataType ?? item.masterDataType ?? item.category ?? item.kind);
    return type === LABEL_TYPE || type.includes("LABEL") || (!type && Boolean(item.color));
}

function getLabelName(label) {
    return label.name ?? label.value ?? label.label ?? label.title ?? label.code ?? `Label #${label.id}`;
}

export default function LabelsManagement() {
    const { masterdata, loading, fetchAll, saveValue, deleteValue } = useMasterdataStore();
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const labels = masterdata
        .filter(isLabelItem)
        .filter(label => label.isActive !== false && label.delete !== true && label.deleted !== true);
    const editingLabel = labels.find(label => String(label.id) === String(editingId));

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.value.trim() || !form.code.trim()) {
            toast.error("Name and Code are required");
            return;
        }
        try {
            const payload = {
                order: editingLabel?.order ?? 0,
                value: form.value.trim(),
                code: (editingLabel?.code || form.code).trim().toUpperCase(),
                type: form.type || LABEL_TYPE,
                isActive: true,
                delete: false,
            };
            await saveValue(payload);
            toast.success(editingId ? "Label updated!" : "Label created!");
            setForm(DEFAULT_FORM);
            setEditingId(null);
            setShowForm(false);
        } catch (e) {
            toast.error(e.response?.data?.Message || e.message || "Failed to save label");
        }
    };

    const handleEdit = (label) => {
        setForm({ value: getLabelName(label), code: label.code || "", type: label.type || LABEL_TYPE });
        setEditingId(label.id);
        setShowForm(true);
    };

    const handleDelete = async (label) => {
        if (!window.confirm(`Delete label "${getLabelName(label)}"?`)) return;
        try {
            await deleteValue(label);
            toast.success("Label deleted");
        } catch (e) {
            toast.error(e.response?.data?.Message || e.message || "Failed to delete label");
        }
    };

    const handleCancel = () => {
        setForm(DEFAULT_FORM);
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Tag className="h-6 w-6 text-primary" />
                            Issue Labels
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage labels for categorizing issues
                        </p>
                    </div>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Label
                        </Button>
                    )}
                </div>

                {/* Form */}
                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {editingId ? "Edit Label" : "New Label"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">
                                            Value <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            placeholder="e.g. Bug"
                                            value={form.value}
                                            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">
                                            Code <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            placeholder="e.g. BUG"
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            disabled={Boolean(editingLabel)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Type</Label>
                                        <Input value={form.type} disabled className="font-mono text-sm" />
                                    </div>
                                </div>

                                {/* Preview */}
                                {form.value && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Preview:</span>
                                        <Badge
                                            className="text-xs"
                                        >
                                            {form.value}
                                        </Badge>
                                    </div>
                                )}

                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-1" />Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={loading}>
                                        <Check className="h-4 w-4 mr-1" />
                                        {editingId ? "Update" : "Create"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Labels list */}
                <Card>
                    <CardContent className="p-0">
                        {loading && labels.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">Loading...</div>
                        ) : labels.length === 0 ? (
                            <div className="py-12 text-center">
                                <Tag className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No labels yet. Create your first label!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {labels.map(label => (
                                    <div key={label.id ?? `${label.type}-${label.code}-${label.value}`} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Value</p>
                                                    <Badge
                                                        className="mt-1 max-w-full truncate text-xs"
                                                    >
                                                        {label.value ?? getLabelName(label)}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Code</p>
                                                    <p className="mt-1 truncate font-mono text-sm text-foreground">{label.code}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Type</p>
                                                    <p className="mt-1 truncate font-mono text-sm text-foreground">{label.type}</p>
                                                </div>
                                        </div>
                                        <div className="flex shrink-0 gap-1 self-end sm:self-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => handleEdit(label)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(label)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
