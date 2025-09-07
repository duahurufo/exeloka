'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { learningAPI } from '@/lib/api';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  BookOpenIcon, 
  ChartBarIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import toast from 'react-hot-toast';

interface LearningInsight {
  insight_type: 'success_pattern' | 'failure_pattern' | 'cultural_factor' | 'implementation_tip';
  content: string;
  confidence_score: number;
  applicable_contexts: string[];
  source_feedback_count: number;
}

interface LearningStats {
  overall: {
    total_feedback: number;
    average_rating: number;
    implementation_success_rate: number;
    total_learning_insights: number;
  };
  insights_by_type: Array<{
    type: string;
    count: number;
    average_confidence: number;
  }>;
  recent_trends: Array<{
    date: string;
    feedback_count: number;
    avg_rating: number;
  }>;
}

export default function LearningDashboard() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0.5);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['learning-insights', selectedType, confidenceFilter],
    queryFn: () => learningAPI.getInsights({
      insight_type: selectedType === 'all' ? undefined : selectedType,
      min_confidence: confidenceFilter,
      limit: 50
    })
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['learning-stats'],
    queryFn: () => learningAPI.getStats()
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success_pattern':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failure_pattern':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'cultural_factor':
        return <GlobeAltIcon className="w-5 h-5 text-blue-500" />;
      case 'implementation_tip':
        return <LightBulbIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success_pattern':
        return 'bg-green-100 text-green-800';
      case 'failure_pattern':
        return 'bg-red-100 text-red-800';
      case 'cultural_factor':
        return 'bg-blue-100 text-blue-800';
      case 'implementation_tip':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInsights = insights?.data?.filter((insight: LearningInsight) =>
    insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.applicable_contexts?.some(context => 
      context.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning & Insights</h1>
            <p className="text-gray-600 mt-1">
              AI-powered insights from feedback analysis and system learning
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        {stats?.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.overall.total_learning_insights}
                </div>
                <p className="text-xs text-muted-foreground">
                  Generated from feedback
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.overall.average_rating}/5
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all recommendations
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.data.overall.implementation_success_rate * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Implementation success
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <InformationCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.data.overall.total_feedback}
                </div>
                <p className="text-xs text-muted-foreground">
                  Feedback entries analyzed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="insights" className="space-y-4">
          <TabsList>
            <TabsTrigger value="insights">Learning Insights</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Insight Type</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="success_pattern">Success Patterns</SelectItem>
                        <SelectItem value="failure_pattern">Failure Patterns</SelectItem>
                        <SelectItem value="cultural_factor">Cultural Factors</SelectItem>
                        <SelectItem value="implementation_tip">Implementation Tips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Min Confidence: {(confidenceFilter * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={confidenceFilter}
                      onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <Input
                      placeholder="Search insights..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights List */}
            <div className="space-y-4">
              {insightsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredInsights.map((insight: LearningInsight, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getInsightIcon(insight.insight_type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getInsightBadgeColor(insight.insight_type)}>
                              {insight.insight_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {(insight.confidence_score * 100).toFixed(0)}% confidence
                            </Badge>
                            <Badge variant="outline">
                              {insight.source_feedback_count} feedback sources
                            </Badge>
                          </div>
                          
                          <p className="text-gray-900 leading-relaxed">
                            {insight.content}
                          </p>
                          
                          {insight.applicable_contexts && insight.applicable_contexts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="text-sm text-gray-600">Applicable to:</span>
                              {insight.applicable_contexts.map((context, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {context}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              
              {filteredInsights.length === 0 && !insightsLoading && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No insights found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters or check back later as more feedback is collected.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            {stats?.data && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Insights by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Insights by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.data.insights_by_type}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.data.insights_by_type.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Feedback Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Feedback Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.data.recent_trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="feedback_count" 
                          stroke="#8884d8" 
                          name="Feedback Count"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="avg_rating" 
                          stroke="#82ca9d" 
                          name="Avg Rating"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* Confidence Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Average Confidence by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.data.insights_by_type}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="average_confidence" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}