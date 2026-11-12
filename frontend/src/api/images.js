import api from "./axios";

// POST /inspections/{insId}/images  multipart, field name must be "image"  ->  { img_id, ins_id }
// onProgress receives a number 0-100 so the UI can show a progress bar.
export async function uploadImage(insId, file, onProgress) {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await api.post(`/inspections/${insId}/images`, formData, {
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return data;
}

// GET /images/{imgId} returns raw bytes and needs the Bearer header, so <img src> cannot call it directly.
// We download it as a blob and make a temporary local URL. Call URL.revokeObjectURL() when finished.
export async function fetchImageUrl(imgId) {
  const { data } = await api.get(`/images/${imgId}`, { responseType: "blob" });
  return URL.createObjectURL(data);
}

// POST /images/{imgId}/analyze  ->  { img_id, extracted_data: {...} }   (calls Gemini, can be slow)
// WARNING: the backend overwrites images.details with the raw OCR result every time this runs.
export async function analyzeImage(imgId) {
  const { data } = await api.post(`/images/${imgId}/analyze`);
  return data;
}

// PUT /images/{imgId}/details  body = ProductExtraction  ->  { img_id, extracted_data }
// REQUIRES the new backend endpoint described in BACKEND_CHANGES.md.
// Saves the inspector-approved values, which /evaluate then uses.
export async function confirmImageDetails(imgId, details) {
  const { data } = await api.put(`/images/${imgId}/details`, details);
  return data;
}
