import { useParams, Link } from "react-router-dom";

// Temporary stand-in for pages we have not built yet. Shows which route params were picked up.
export default function Placeholder({ title }) {
  const params = useParams();
  return (
    <div className="mx-auto max-w-xl p-8">
      <div className="card p-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-navy-500">Coming in a later phase.</p>
        {Object.keys(params).length > 0 && (
          <pre className="mt-3 rounded-lg bg-navy-50 p-3 text-xs">{JSON.stringify(params)}</pre>
        )}
        <Link to="/setup-check" className="btn-secondary mt-4">
          Back to setup check
        </Link>
      </div>
    </div>
  );
}
