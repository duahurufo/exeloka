'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { documentAPI } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Document {
  id: number;
  recommendation_id: number;
  document_type: 'docx' | 'xlsx' | 'pptx';
  filename: string;
  file_size: number;
  download_count: number;
  created_at: string;
  recommendation_title: string;
  project_title: string;
  download_url: string;
}

interface DocumentStats {
  total_documents: number;
  docx_count: number;
  xlsx_count: number;
  pptx_count: number;
  total_file_size: number;
  total_downloads: number;
  avg_downloads_per_document: number;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', { page, document_type: typeFilter !== 'all' ? typeFilter : undefined }],
    queryFn: () => documentAPI.getDocuments({
      page,
      limit: 20,
      document_type: typeFilter !== 'all' ? typeFilter : undefined
    })
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['document-stats'],
    queryFn: () => documentAPI.getStats()
  });

  const downloadMutation = useMutation({
    mutationFn: (filename: string) => documentAPI.downloadDocument(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to download document');
    }
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'docx':
        return <DocumentTextIcon className="w-6 h-6 text-blue-500" />;
      case 'xlsx':
        return <TableCellsIcon className="w-6 h-6 text-green-500" />;
      case 'pptx':
        return <PresentationChartBarIcon className="w-6 h-6 text-red-500" />;
      default:
        return <DocumentTextIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents?.data?.filter((doc: Document) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.recommendation_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.project_title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              Generated recommendation documents and reports
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {stats?.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.data.total_documents}</div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(stats.data.total_file_size)} total size
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Word Documents</CardTitle>
                <DocumentTextIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.data.docx_count}</div>
                <p className="text-xs text-muted-foreground">
                  DOCX files generated
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spreadsheets</CardTitle>
                <TableCellsIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.data.xlsx_count}</div>
                <p className="text-xs text-muted-foreground">
                  XLSX files generated
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presentations</CardTitle>
                <PresentationChartBarIcon className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.data.pptx_count}</div>
                <p className="text-xs text-muted-foreground">
                  PPTX files generated
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5" />
              <span>Filter Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by filename, project, or recommendation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="docx">Word Documents</SelectItem>
                    <SelectItem value="xlsx">Excel Spreadsheets</SelectItem>
                    <SelectItem value="pptx">PowerPoint Presentations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc: Document) => (
                  <div key={doc.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      {getDocumentIcon(doc.document_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </h3>
                        <Badge variant="outline">
                          {doc.document_type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Project:</span> {doc.project_title}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Recommendation:</span> {doc.recommendation_title}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{doc.download_count} downloads</span>
                        <span>•</span>
                        <span>Created {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadMutation.mutate(doc.filename)}
                        disabled={downloadMutation.isLoading}
                        className="flex items-center space-x-1"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredDocuments.length === 0 && !documentsLoading && (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery || typeFilter !== 'all' 
                        ? 'Try adjusting your search or filters.' 
                        : 'Generate documents from your recommendations to see them here.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination */}
            {documents?.data?.meta && documents.data.meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-700">
                  Showing page {documents.data.meta.page} of {documents.data.meta.totalPages} 
                  ({documents.data.meta.total} total documents)
                </p>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= documents?.data?.meta?.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Stats */}
        {stats?.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.data.total_downloads}
                  </div>
                  <p className="text-sm text-gray-600">Total Downloads</p>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.data.avg_downloads_per_document?.toFixed(1) || 0}
                  </div>
                  <p className="text-sm text-gray-600">Avg Downloads per Document</p>
                </div>
                
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatFileSize(stats.data.total_file_size)}
                  </div>
                  <p className="text-sm text-gray-600">Total Storage Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}