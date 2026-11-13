import useAuth from "../hooks/useAuth";

// Read-only: the backend has no endpoint for editing a profile.
export default function Profile() {
  const { inspector } = useAuth();

  const rows = [
    ["Name", inspector?.name],
    ["Email", inspector?.email],
    ["Inspector ID", inspector?.id],
  ];

  return (
    <div className="card max-w-xl p-6">
      <h2 className="text-lg font-semibold text-navy-800">Account details</h2>
      <dl className="mt-4 divide-y divide-navy-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-navy-500">{label}</dt>
            <dd className="font-medium text-navy-800">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 py-3 text-sm">
          <dt className="text-navy-500">Status</dt>
          <dd>
            <span className={`badge ${inspector?.is_active ? "bg-pass-50 text-pass-600" : "bg-fail-50 text-fail-600"}`}>
              {inspector?.is_active ? "Active" : "Inactive"}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
