// src/components/dm/StickerPickerModal.js
import StickerPicker from "./StickerPicker";

export default function StickerPickerModal({ onSelect, onClose }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <StickerPicker onSelect={onSelect} onClose={onClose} />
    </div>
  );
}
