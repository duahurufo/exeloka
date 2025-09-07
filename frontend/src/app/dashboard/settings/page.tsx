'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '@/lib/auth';
import {
  UserIcon,
  CogIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UserSettings {
  notifications: {
    email_recommendations: boolean;
    email_feedback_requests: boolean;
    email_system_updates: boolean;
    push_analysis_complete: boolean;
    push_new_insights: boolean;
  };
  preferences: {
    default_analysis_type: 'quick' | 'enhanced';
    auto_generate_documents: boolean;
    preferred_document_format: 'docx' | 'xlsx' | 'pptx';
    cultural_context_emphasis: 'low' | 'medium' | 'high';
    feedback_reminders: boolean;
  };
  privacy: {
    share_anonymous_usage: boolean;
    allow_data_export: boolean;
    session_timeout_minutes: number;
  };
}

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  company_name: string;
  role: string;
  created_at: string;
  last_login: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Mock data - in real app this would come from API
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || 2,
    email: user?.email || 'user@company.com',
    full_name: user?.full_name || 'Test User',
    company_name: user?.company_name || 'PT. Madura Development',
    role: user?.role || 'user',
    created_at: '2024-01-15T00:00:00Z',
    last_login: new Date().toISOString(),
    is_active: true
  });

  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email_recommendations: true,
      email_feedback_requests: true,
      email_system_updates: false,
      push_analysis_complete: true,
      push_new_insights: true
    },
    preferences: {
      default_analysis_type: 'quick',
      auto_generate_documents: false,
      preferred_document_format: 'docx',
      cultural_context_emphasis: 'high',
      feedback_reminders: true
    },
    privacy: {
      share_anonymous_usage: true,
      allow_data_export: true,
      session_timeout_minutes: 60
    }
  });

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    toast.success('Profile updated');
  };

  const handleSettingsUpdate = (category: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    toast.success('Settings updated');
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    // Mock password change - in real app this would call API
    toast.success('Password changed successfully');
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion is not available in demo mode');
    }
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive an email when ready.');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'preferences', label: 'Preferences', icon: CogIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'privacy', label: 'Privacy', icon: KeyIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your account settings, preferences, and privacy controls
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="card">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.full_name}
                        onChange={(e) => handleProfileUpdate('full_name', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profile.email}
                        onChange={(e) => handleProfileUpdate('email', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.company_name}
                        onChange={(e) => handleProfileUpdate('company_name', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Role</label>
                      <select
                        className="form-input"
                        value={profile.role}
                        onChange={(e) => handleProfileUpdate('role', e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                    <dl className="grid md:grid-cols-2 gap-6">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                        <dd className="text-sm text-gray-900 mt-1">
                          {new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                        <dd className="text-sm text-gray-900 mt-1">
                          {new Date(profile.last_login).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                        <dd className="text-sm mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            profile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {profile.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Preferences</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="form-label">Default Analysis Type</label>
                    <select
                      className="form-input"
                      value={settings.preferences.default_analysis_type}
                      onChange={(e) => handleSettingsUpdate('preferences', 'default_analysis_type', e.target.value)}
                    >
                      <option value="quick">Quick Analysis (Free, Faster)</option>
                      <option value="enhanced">Enhanced Analysis (Paid, Comprehensive)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose your preferred analysis type for new recommendations
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Preferred Document Format</label>
                    <select
                      className="form-input"
                      value={settings.preferences.preferred_document_format}
                      onChange={(e) => handleSettingsUpdate('preferences', 'preferred_document_format', e.target.value)}
                    >
                      <option value="docx">Microsoft Word (.docx)</option>
                      <option value="xlsx">Microsoft Excel (.xlsx)</option>
                      <option value="pptx">Microsoft PowerPoint (.pptx)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Cultural Context Emphasis</label>
                    <select
                      className="form-input"
                      value={settings.preferences.cultural_context_emphasis}
                      onChange={(e) => handleSettingsUpdate('preferences', 'cultural_context_emphasis', e.target.value)}
                    >
                      <option value="low">Low - Focus on general business strategies</option>
                      <option value="medium">Medium - Balanced approach</option>
                      <option value="high">High - Strong emphasis on cultural factors</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.preferences.auto_generate_documents}
                        onChange={(e) => handleSettingsUpdate('preferences', 'auto_generate_documents', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Auto-generate documents after analysis completion
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.preferences.feedback_reminders}
                        onChange={(e) => handleSettingsUpdate('preferences', 'feedback_reminders', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Send reminders to provide feedback on recommendations
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Email Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email_recommendations}
                          onChange={(e) => handleSettingsUpdate('notifications', 'email_recommendations', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          New recommendation generated
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email_feedback_requests}
                          onChange={(e) => handleSettingsUpdate('notifications', 'email_feedback_requests', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Feedback requests and reminders
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.email_system_updates}
                          onChange={(e) => handleSettingsUpdate('notifications', 'email_system_updates', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          System updates and maintenance notices
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Push Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push_analysis_complete}
                          onChange={(e) => handleSettingsUpdate('notifications', 'push_analysis_complete', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Analysis completion notifications
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.notifications.push_new_insights}
                          onChange={(e) => handleSettingsUpdate('notifications', 'push_new_insights', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          New cultural insights and patterns
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Password</h3>
                    {!showPasswordForm ? (
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="btn-secondary"
                      >
                        Change Password
                      </button>
                    ) : (
                      <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="form-label">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              className="form-input pr-10"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPasswords.current ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="form-label">New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              className="form-input pr-10"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPasswords.new ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="form-label">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              className="form-input pr-10"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPasswords.confirm ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button onClick={handlePasswordChange} className="btn-primary">
                            Update Password
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordForm(false);
                              setCurrentPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                            }}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Session Settings</h3>
                    <div>
                      <label className="form-label">Session Timeout (minutes)</label>
                      <select
                        className="form-input max-w-xs"
                        value={settings.privacy.session_timeout_minutes}
                        onChange={(e) => handleSettingsUpdate('privacy', 'session_timeout_minutes', parseInt(e.target.value))}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Data</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Data Sharing</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.privacy.share_anonymous_usage}
                          onChange={(e) => handleSettingsUpdate('privacy', 'share_anonymous_usage', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Share anonymous usage data to help improve the service
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.privacy.allow_data_export}
                          onChange={(e) => handleSettingsUpdate('privacy', 'allow_data_export', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Allow data export and download
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Data Management</h3>
                    <div className="space-y-3">
                      <button onClick={handleExportData} className="btn-secondary">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        Export My Data
                      </button>
                      <p className="text-sm text-gray-500">
                        Download all your data in a portable format
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-red-900 mb-3">Danger Zone</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Delete Account
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>
                              Permanently delete your account and all associated data. 
                              This action cannot be undone.
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={handleDeleteAccount}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>Delete Account</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}