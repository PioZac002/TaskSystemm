export const LABEL_TYPE = "ISSUE_LABEL";

export function normalizeLabelToken(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim().toUpperCase();
}

function uniqueTokens(values) {
    return Array.from(new Set(values.map(normalizeLabelToken).filter(Boolean)));
}

export function getLabelName(label) {
    if (label === null || label === undefined) return "";
    if (typeof label !== "object") return String(label);
    return label.name ?? label.value ?? label.label ?? label.title ?? label.code ?? `Label #${label.id}`;
}

export function getLabelCode(label) {
    if (label === null || label === undefined) return "";
    if (typeof label !== "object") return String(label);
    return label.code ?? label.value ?? label.name ?? label.label ?? label.title ?? "";
}

export function getLabelOptionValue(label) {
    if (label && typeof label === "object") {
        return String(label.id ?? getLabelCode(label) ?? getLabelName(label));
    }
    return String(label ?? "");
}

export function getLabelTokens(label) {
    if (label === null || label === undefined) return [];
    if (typeof label !== "object") return uniqueTokens([label]);

    return uniqueTokens([
        label.id,
        label.code,
        label.value,
        label.name,
        label.label,
        label.title,
    ]);
}

export function labelIsSelected(label, selectedIds = []) {
    const rawSelected = new Set(selectedIds.map(String));
    const normalizedSelected = new Set(selectedIds.map(normalizeLabelToken).filter(Boolean));

    return rawSelected.has(getLabelOptionValue(label)) ||
        getLabelTokens(label).some(token => normalizedSelected.has(token));
}

export function getSelectedLabels(labels = [], selectedIds = []) {
    return labels.filter(label => labelIsSelected(label, selectedIds));
}

export function removeLabelSelection(selectedIds = [], label) {
    const rawToRemove = new Set([getLabelOptionValue(label), String(label?.id ?? "")].filter(Boolean));
    const tokensToRemove = new Set(getLabelTokens(label));

    return selectedIds.filter(value =>
        !rawToRemove.has(String(value)) &&
        !tokensToRemove.has(normalizeLabelToken(value))
    );
}

export function issueHasLabel(issue, label) {
    const issueTokens = new Set((issue?.labels || []).flatMap(getLabelTokens));
    return getLabelTokens(label).some(token => issueTokens.has(token));
}

export function toMasterdataValueRequest(label) {
    const order = Number(label?.order);
    const value = getLabelName(label);
    const code = getLabelCode(label) || value;

    return {
        order: Number.isFinite(order) ? order : 0,
        value,
        code,
        type: (label && typeof label === "object" && label.type) || LABEL_TYPE,
        isActive: label?.isActive ?? true,
        delete: false,
    };
}

export function labelIdsToMasterdataValues(availableLabels = [], selectedIds = []) {
    const selectedLabels = getSelectedLabels(availableLabels, selectedIds);
    if (selectedLabels.length > 0 || availableLabels.length > 0) {
        return selectedLabels.map(toMasterdataValueRequest);
    }

    return selectedIds
        .filter(value => normalizeLabelToken(value))
        .map(value => toMasterdataValueRequest(value));
}
