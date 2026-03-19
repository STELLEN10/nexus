// src/components/dm/StickerPickerModal.js
import { createPortal } from "react-dom";
import StickerPicker from "./StickerPicker";

export default function StickerPickerModal({ onSelect, onClose }) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.75)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 480, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <StickerPicker onSelect={onSelect} onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}
