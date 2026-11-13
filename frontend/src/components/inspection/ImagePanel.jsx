import { useState } from "react";
import { Maximize2 } from "lucide-react";
import useImageUrl from "../../hooks/useImageUrl";
import Modal from "../common/Modal";
import Alert from "../common/Alert";
import LoadingBlock from "../common/LoadingBlock";

// Shows the uploaded package image. Click it to open a large view while comparing with the form.
export default function ImagePanel({ imgId }) {
  const { url, loading, error } = useImageUrl(imgId);
  const [enlarged, setEnlarged] = useState(false);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-navy-800">Uploaded package image</h2>
        {url && (
          <button onClick={() => setEnlarged(true)} className="btn-secondary px-2.5 py-1.5 text-xs">
            <Maximize2 className="h-3.5 w-3.5" /> Enlarge
          </button>
        )}
      </div>
      <div className="bg-navy-50 p-3">
        {loading && <LoadingBlock label="Loading image..." />}
        {error && <Alert variant="error">{error}</Alert>}
        {url && (
          <button onClick={() => setEnlarged(true)} className="block w-full cursor-zoom-in" aria-label="Enlarge image">
            <img src={url} alt="Uploaded package" className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain" />
          </button>
        )}
      </div>

      <Modal open={enlarged} onClose={() => setEnlarged(false)} title="Package image" wide>
        {url && <img src={url} alt="Uploaded package, enlarged" className="mx-auto max-h-[75vh] w-auto object-contain" />}
      </Modal>
    </div>
  );
}
