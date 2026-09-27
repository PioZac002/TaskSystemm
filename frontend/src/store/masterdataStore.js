import { create } from "zustand";
import apiClient from "@/services/apiClient";

const ARRAY_KEYS = ["items", "value", "values", "data", "result", "results", "masterdata", "masterData"];
const REQUEST_KEYS = ["order", "value", "code", "type", "isActive", "delete"];

function extractMasterdataArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];

    for (const key of ARRAY_KEYS) {
        if (Array.isArray(payload[key])) return payload[key];
        if (payload[key] && typeof payload[key] === "object") {
            const nested = extractMasterdataArray(payload[key]);
            if (nested.length > 0) return nested;
        }
    }

    const directArrays = Object.values(payload)
        .filter(Array.isArray)
        .flat();

    if (directArrays.length > 0) return directArrays;

    return Object.values(payload)
        .filter(value => value && typeof value === "object")
        .flatMap(extractMasterdataArray);
}

function extractMasterdataValues(payload) {
    if (!payload || typeof payload !== "object") return extractMasterdataArray(payload);

    const groups = payload.masterdata ?? payload.masterData ?? payload.items ?? payload.value ?? payload.data;
    if (Array.isArray(groups) && groups.some(group => Array.isArray(group?.values))) {
        return groups.flatMap(group =>
            group.values.map(value => normalizeMasterdataItem({ ...value, type: value.type ?? group.type }))
        );
    }

    if (Array.isArray(payload.values)) {
        return payload.values.map(value => normalizeMasterdataItem({ ...value, type: value.type ?? payload.type }));
    }

    return extractMasterdataArray(payload).map(normalizeMasterdataItem);
}

function readType(item) {
    const raw = item.type
        ?? item.masterdataType
        ?? item.masterDataType
        ?? item.category
        ?? item.kind
        ?? item.typeName;

    if (raw && typeof raw === "object") {
        return raw.code ?? raw.value ?? raw.name ?? raw.type ?? "";
    }

    return raw ?? "";
}

function normalizeMasterdataItem(item) {
    if (!item || typeof item !== "object") return item;

    const name = item.name ?? item.value ?? item.label ?? item.title ?? item.code ?? "";
    const value = item.value ?? item.name ?? item.label ?? item.title ?? item.code ?? "";
    const type = readType(item);

    return {
        ...item,
        name,
        value,
        type,
        code: item.code ?? item.key ?? String(value || name).toUpperCase().replace(/\s+/g, "_"),
        color: item.color ?? item.colour ?? item.hexColor ?? item.backgroundColor,
        isActive: item.isActive ?? item.active ?? true,
    };
}

function normalizeMasterdata(payload) {
    return extractMasterdataValues(payload);
}

function toMasterdataRequest(item) {
    const normalized = normalizeMasterdataItem(item);
    return REQUEST_KEYS.reduce((payload, key) => {
        if (normalized[key] !== undefined) payload[key] = normalized[key];
        return payload;
    }, {});
}

export const useMasterdataStore = create((set, get) => ({
    masterdata: [],
    loading: false,
    error: null,

    fetchAll: async () => {
        set({ loading: true, error: null });
        try {
            const res = await apiClient.get('/api/v1/masterdata');
            set({ masterdata: normalizeMasterdata(res.data), loading: false });
        } catch (e) {
            set({ error: e.message, loading: false });
        }
    },

    fetchByType: async (type) => {
        try {
            const res = await apiClient.get('/api/v1/masterdata/type', { params: { type } });
            return normalizeMasterdata(res.data);
        } catch (e) {
            console.error('Error fetching masterdata by type:', e);
            return [];
        }
    },

    saveValue: async (data) => {
        set({ loading: true, error: null });
        try {
            const res = await apiClient.post('/api/v1/masterdata', toMasterdataRequest(data));
            await get().fetchAll();
            set({ loading: false });
            return res.data;
        } catch (e) {
            set({ error: e.message, loading: false });
            throw e;
        }
    },

    deleteValue: async (item) => {
        set({ loading: true, error: null });
        try {
            const source = typeof item === "object"
                ? item
                : get().masterdata.find(value => String(value.id) === String(item));
            if (!source) throw new Error("Masterdata value not found");
            const payload = toMasterdataRequest({ ...source, delete: true, isActive: false });
            await apiClient.post('/api/v1/masterdata', payload);
            await get().fetchAll();
            set({ loading: false });
        } catch (e) {
            set({ error: e.message, loading: false });
            throw e;
        }
    },
}));
