// Server component for static params
export async function generateStaticParams() {
  // For static export, we'll generate some common IDs
  // In production, this would fetch from your API
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default function ProjectLayout({ children, params }: ProjectLayoutProps) {
  return children;
}