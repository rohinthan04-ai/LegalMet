export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-500">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-medium text-navy-800">{title}</p>
      {children && <div className="mt-1 text-sm text-navy-500">{children}</div>}
    </div>
  );
}
