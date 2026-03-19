// src/components/dm/StickerPickerModal.js
// Renders StickerPicker as a centered portal modal
import { createPortal } from "react-dom";
import StickerPicker from "./StickerPicker";

export default function StickerPickerModal({ onSelect, onClose }) {
  return createPortal(
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <StickerPicker onSelect={onSelect} onClose={onClose} />
    </div>,
    document.body
  );
}
