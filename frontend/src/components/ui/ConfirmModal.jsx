import { Modal } from "./Modal.jsx";
import { Button } from "@/components/common/Button";
export function ConfirmModal({ open, onClose, title, description, onConfirm }) {
    return (
        <Modal open={open} onClose={onClose}>
            <div className="text-xl font-bold mb-2">{title}</div>
            <div className="mb-6">{description}</div>
            <div className="flex justify-end gap-4">
                <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                <Button variant="destructive" onClick={onConfirm}>Potwierdź</Button>
            </div>
        </Modal>
    );
}
