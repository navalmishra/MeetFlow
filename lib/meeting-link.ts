export function getMeetingLink(streamCallId: string, personal = false) {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  const origin = base?.startsWith('http')
    ? base
    : base
      ? `https://${base}`
      : '';

  const path = `/meeting/${streamCallId}${personal ? '?personal=true' : ''}`;
  return origin ? `${origin}${path}` : path;
}
