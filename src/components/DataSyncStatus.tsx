"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Database, Search, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatus {
  totalJournalEntries: number;
  totalEmotionLogs: number;
  totalMoments: number;
  vectorIndexed: number;
  needsMigration: boolean;
  needsReindexing: boolean;
}

interface MigrationProgress {
  completed: number;
  total: number;
  currentType: string;
}

const DataSyncStatus = () => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);

  const fetchSyncStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/data-sync/migrate?userId=${user.uid}`);
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(result.syncStatus);
      } else {
        console.error('Error fetching sync status:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    if (!user) return;

    setMigrating(true);
    setMigrationProgress({ completed: 0, total: 0, currentType: 'Preparing...' });

    try {
      const response = await fetch('/api/data-sync/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          options: {
            batchSize: 20,
            includeVectorIndexing: true,
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const migrationResult = result.migrationResult;
        toast.success(`Migration completed! ${migrationResult.successful} items migrated, ${migrationResult.vectorIndexed} indexed for AI search.`);
        
        // Refresh status
        await fetchSyncStatus();
      } else {
        toast.error(`Migration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed due to network error');
    } finally {
      setMigrating(false);
      setMigrationProgress(null);
    }
  };

  const handleReindex = async () => {
    if (!user) return;

    setReindexing(true);
    try {
      const response = await fetch('/api/vector-system/reindex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const result = await response.json();
      
      if (result.success) {
        const reindexResult = result.reindexResult;
        toast.success(`Reindexing completed! ${reindexResult.indexed} items indexed for AI search.`);
        
        // Refresh status
        await fetchSyncStatus();
      } else {
        toast.error(`Reindexing failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Reindexing error:', error);
      toast.error('Reindexing failed due to network error');
    } finally {
      setReindexing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSyncStatus();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading && !syncStatus) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Sync Status
          </CardTitle>
          <CardDescription>
            Checking your data synchronization status...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return null;
  }

  const migrationProgress_percentage = migrationProgress 
    ? migrationProgress.total > 0 
      ? (migrationProgress.completed / migrationProgress.total) * 100 
      : 0 
    : 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Sync Status
        </CardTitle>
        <CardDescription>
          Monitor and manage your data synchronization for AI-powered features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {syncStatus.totalJournalEntries + syncStatus.totalEmotionLogs}
            </div>
            <div className="text-sm text-muted-foreground">Legacy Data</div>
            <div className="text-xs text-muted-foreground mt-1">
              {syncStatus.totalJournalEntries} journal entries, {syncStatus.totalEmotionLogs} emotion logs
            </div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {syncStatus.totalMoments}
            </div>
            <div className="text-sm text-muted-foreground">Unified Moments</div>
            <div className="text-xs text-muted-foreground mt-1">
              Ready for AI processing
            </div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {syncStatus.vectorIndexed}
            </div>
            <div className="text-sm text-muted-foreground">Vector Indexed</div>
            <div className="text-xs text-muted-foreground mt-1">
              Available for AI search
            </div>
          </div>
        </div>

        {/* Migration Status */}
        {syncStatus.needsMigration && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-medium text-amber-800">Migration Needed</div>
                <div className="text-sm text-amber-700">
                  You have legacy data that needs to be migrated to the unified system for AI features.
                </div>
              </div>
            </div>
            
            {migrating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    Migrating {migrationProgress?.currentType}... 
                    ({migrationProgress?.completed || 0} / {migrationProgress?.total || 0})
                  </span>
                </div>
                <Progress value={migrationProgress_percentage} className="w-full" />
              </div>
            )}
            
            <Button 
              onClick={handleMigration} 
              disabled={migrating}
              className="w-full"
            >
              {migrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrating Data...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Migrate Legacy Data
                </>
              )}
            </Button>
          </div>
        )}

        {/* Reindexing Status */}
        {syncStatus.needsReindexing && !syncStatus.needsMigration && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Search className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Vector Reindexing Recommended</div>
                <div className="text-sm text-blue-700">
                  Some moments aren't indexed for AI search yet. Reindex to enable full AI features.
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleReindex} 
              disabled={reindexing}
              variant="outline"
              className="w-full"
            >
              {reindexing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reindexing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Reindex for AI Search
                </>
              )}
            </Button>
          </div>
        )}

        {/* Success Status */}
        {!syncStatus.needsMigration && !syncStatus.needsReindexing && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">All Synced!</div>
              <div className="text-sm text-green-700">
                Your data is fully synchronized and ready for AI-powered features.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={fetchSyncStatus} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh Status'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSyncStatus;