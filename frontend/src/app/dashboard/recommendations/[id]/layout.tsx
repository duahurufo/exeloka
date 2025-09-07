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

interface RecommendationLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default function RecommendationLayout({ children, params }: RecommendationLayoutProps) {
  return children;
}