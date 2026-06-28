type PermissionGuardProps = {
	message: string
}

export function PermissionGuard({ message }: PermissionGuardProps) {
	return (
		<div className="p-6 max-w-7xl mx-auto">
			<p className="text-sm text-text-tertiary">{message}</p>
		</div>
	)
}
