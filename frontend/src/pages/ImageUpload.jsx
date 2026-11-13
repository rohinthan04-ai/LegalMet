import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Image as ImageIcon, Loader2, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import { analyzeImage, uploadImage } from "../api/images";
import { listInspections } from "../api/inspections";
import { getErrorMessage } from "../utils/errors";
import Alert from "../components/common/Alert";
import WorkflowStepper from "../components/inspection/WorkflowStepper";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10; // the backend has no limit, so we set a sensible one here
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatSize(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function ImageUpload() {
  const { insId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [stage, setStage] = useState("idle"); // idle | uploading | analyzing
  const [progress, setProgress] = useState(0);
  const [uploadedImgId, setUploadedImgId] = useState(null); // set once the upload succeeded
  const [requestError, setRequestError] = useState("");
  const [existingImgId, setExistingImgId] = useState(null); // this inspection already has an image

  // The PDF report always uses the FIRST image of an inspection, so an inspection must only ever have one.
  // If this one already has an image (we can see that in the list), don't allow a second upload.
  useEffect(() => {
    listInspections()
      .then((list) => {
        const current = list.find((item) => String(item.ins_id) === insId);
        if (current?.img_id) setExistingImgId(current.img_id);
      })
      .catch(() => {
        /* the check is optional; ignore failures */
      });
  }, [insId]);

  // Free the memory of the local preview whenever it is replaced or the page is left
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(candidate) {
    setRequestError("");
    if (!candidate) return;
    if (!ALLOWED_TYPES.includes(candidate.type)) {
      setValidationError("Unsupported file type. Please choose a JPEG, PNG or WebP image.");
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setValidationError(`That file is ${formatSize(candidate.size)}. The maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    if (candidate.size === 0) {
      setValidationError("That file is empty.");
      return;
    }
    setValidationError("");
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate)); // local preview of the chosen file
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (stage !== "idle") return;
    chooseFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    setFile(null);
    setPreviewUrl(null);
    setValidationError("");
    setRequestError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Step 1: upload the file. Step 2: ask the backend to run AI extraction on it.
  // If step 2 fails we keep the uploaded image id, so a retry does not upload a second image.
  async function handleSubmit() {
    setRequestError("");
    let imgId = uploadedImgId;

    try {
      if (!imgId) {
        setStage("uploading");
        setProgress(0);
        const uploaded = await uploadImage(insId, file, setProgress);
        imgId = uploaded.img_id;
        setUploadedImgId(imgId);
      }

      setStage("analyzing");
      const result = await analyzeImage(imgId);

      // Pass the fresh AI result to the review page through the router state
      navigate(`/inspections/${insId}/images/${imgId}/review`, { state: { extracted: result.extracted_data } });
    } catch (err) {
      setRequestError(getErrorMessage(err));
      setStage("idle");
    }
  }

  const busy = stage !== "idle";

  if (existingImgId) {
    return (
      <div className="mx-auto max-w-2xl">
        <WorkflowStepper current={0} />
        <Alert variant="info" title="This inspection already has an image">
          Each inspection uses a single image. To inspect another package, start a new inspection.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/inspections/${insId}/images/${existingImgId}/review`} className="btn-primary">
              Continue this inspection
            </Link>
            <Link to="/inspections/new" className="btn-secondary">
              New inspection
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <WorkflowStepper current={0} />

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-navy-800">Upload package image</h2>
        <p className="mt-1 text-sm text-navy-500">
          Inspection #{insId}. Use a sharp, well-lit photo where the declarations are readable. One image per inspection.
        </p>

        {!file ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`mt-5 flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging ? "border-brand-500 bg-brand-50" : "border-navy-200 bg-navy-50/50"
            }`}
          >
            <UploadCloud className="h-10 w-10 text-brand-600" />
            <p className="mt-3 text-sm font-medium text-navy-800">Drag and drop an image here</p>
            <p className="text-xs text-navy-500">JPEG, PNG or WebP, up to {MAX_SIZE_MB} MB</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary mt-4">
              Browse files
            </button>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-navy-100">
            <div className="bg-navy-50 p-3">
              <img src={previewUrl} alt="Selected package preview" className="mx-auto max-h-80 w-auto rounded-lg object-contain" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-navy-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4 shrink-0 text-navy-500" />
                <span className="truncate font-medium text-navy-800">{file.name}</span>
                <span className="shrink-0 text-navy-500">{formatSize(file.size)}</span>
              </div>
              {/* After a successful upload the image cannot be replaced (one image per inspection) */}
              {!uploadedImgId && (
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={busy} className="btn-secondary px-2.5 py-1.5 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" /> Replace
                  </button>
                  <button onClick={removeFile} disabled={busy} className="btn-secondary px-2.5 py-1.5 text-xs text-fail-600">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(event) => {
            chooseFile(event.target.files?.[0]);
            event.target.value = ""; // lets the same file be picked again
          }}
        />

        {validationError && <Alert variant="error" className="mt-4">{validationError}</Alert>}
        {requestError && (
          <Alert variant="error" className="mt-4" title={uploadedImgId ? "Image uploaded, but AI extraction failed" : "Upload failed"}>
            {requestError}
            {uploadedImgId && " The image is saved. Press the button to try the extraction again."}
          </Alert>
        )}

        {stage === "uploading" && (
          <div className="mt-4" aria-live="polite">
            <div className="mb-1 flex justify-between text-xs text-navy-500">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-navy-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {stage === "analyzing" && (
          <p className="mt-4 flex items-center gap-2 text-sm text-navy-700" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> Reading the package with AI. This can take several seconds...
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={handleSubmit} disabled={!file || busy} className="btn-primary">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> {stage === "uploading" ? "Uploading..." : "Extracting..."}
              </>
            ) : uploadedImgId ? (
              <>
                Retry extraction <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Upload and extract details <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
