import { useEffect, useState } from "react";
import { fetchImageUrl } from "../api/images";
import { getErrorMessage } from "../utils/errors";

// Loads an uploaded image (which needs the auth header) and returns a temporary URL for <img src>.
export default function useImageUrl(imgId) {
  const [state, setState] = useState({ url: null, loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    fetchImageUrl(imgId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setState({ url, loading: false, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setState({ url: null, loading: false, error: getErrorMessage(error) });
      });

    // Free the memory when the page is left
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imgId]);

  return state;
}
