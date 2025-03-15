'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { handleSupabaseError } from '../utils/errorHandler';

export default function Lightbulb() {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [usePollingOnly, setUsePollingOnly] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Function to fetch the current lightbulb state
  const fetchLightbulbState = async () => {
    try {
      console.log('Fetching lightbulb state...');
      const { data, error } = await supabase
        .from('lightbulb')
        .select('is_on, updated_at')
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Lightbulb data:', data);
      if (data) {
        // Only update if the state has changed or it's the initial load
        if (loading || data.is_on !== isOn) {
          setIsOn(data.is_on);
          lastUpdateTimeRef.current = Date.now();
          
          if (!loading) {
            // Flash a notification that an update was received via polling
            setRealtimeStatus('Update received via polling!');
            setTimeout(() => {
              setRealtimeStatus(usePollingOnly ? 'Using polling (WebSocket unavailable)' : 'Real-time updates active');
            }, 2000);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error fetching lightbulb state:', error);
      if (loading) {
        setError(error as Error);
        setErrorMessage(
          'Could not connect to the lightbulb database. Make sure you have created the lightbulb table in Supabase and configured your environment variables correctly.'
        );
      }
      return false;
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  // Set up polling with dynamic interval
  const setupPolling = (forceShortInterval = false) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Set polling interval - shorter if we're in polling-only mode or if forced
    const pollInterval = (usePollingOnly || forceShortInterval) ? 1500 : 5000; // Reduced to 1.5 seconds for better responsiveness
    
    pollIntervalRef.current = setInterval(() => {
      fetchLightbulbState();
    }, pollInterval);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  };

  useEffect(() => {
    // Check if Supabase URL and key are configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here' || 
        !supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
      setError(new Error('Supabase not configured'));
      setErrorMessage('Supabase URL and/or anon key not configured. Please update your .env.local file.');
      setLoading(false);
      return;
    }

    // Initial fetch of lightbulb state
    fetchLightbulbState();

    // Try to set up real-time subscription first
    const cleanupRealtime = setupRealtimeSubscription();
    
    // Set up polling as a fallback
    const cleanupPolling = setupPolling();

    return () => {
      cleanupRealtime();
      cleanupPolling();
    };
  }, []);

  // Effect to update polling interval when usePollingOnly changes
  useEffect(() => {
    return setupPolling();
  }, [usePollingOnly]);

  // Separate function to set up real-time subscription
  const setupRealtimeSubscription = () => {
    if (usePollingOnly) {
      setRealtimeStatus('Using polling (WebSocket unavailable)');
      return () => {};
    }

    setRealtimeStatus('Connecting to real-time updates...');
    
    // First, remove any existing channels
    try {
      supabase.removeAllChannels();
    } catch (e) {
      console.error('Error removing channels:', e);
    }
    
    // Create a new channel with error handling
    try {
      const channel = supabase
        .channel('lightbulb-changes')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'lightbulb' 
          }, 
          (payload) => {
            console.log('Received update via WebSocket:', payload);
            setIsOn(payload.new.is_on);
            lastUpdateTimeRef.current = Date.now();
            
            // Flash a notification that an update was received
            setRealtimeStatus('Update received via WebSocket!');
            setTimeout(() => setRealtimeStatus('Real-time updates active'), 2000);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('Real-time updates active');
            // Reduce polling frequency when WebSocket is working
            setupPolling(false);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Real-time subscription error - falling back to polling');
            setRealtimeStatus('WebSocket connection failed - using polling');
            setUsePollingOnly(true);
            // Increase polling frequency when WebSocket fails
            setupPolling(true);
          } else if (status === 'TIMED_OUT') {
            console.error('WebSocket connection timed out - using polling');
            setRealtimeStatus('WebSocket timed out - using polling');
            setUsePollingOnly(true);
            // Increase polling frequency when WebSocket times out
            setupPolling(true);
          } else {
            setRealtimeStatus(`Connection status: ${status}`);
          }
        });

      // Return cleanup function
      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.error('Error removing channel during cleanup:', e);
        }
      };
    } catch (e) {
      console.error('Error setting up real-time subscription:', e);
      setRealtimeStatus('Error setting up WebSocket - using polling');
      setUsePollingOnly(true);
      // Increase polling frequency when WebSocket setup fails
      setupPolling(true);
      return () => {};
    }
  };

  const toggleLight = async () => {
    try {
      setToggleLoading(true);
      const newState = !isOn;
      console.log('Toggling light to:', newState);
      
      // First, manually update the UI for better responsiveness
      setIsOn(newState);
      
      const { data, error } = await supabase
        .from('lightbulb')
        .update({ is_on: newState })
        .eq('id', 1)
        .select();
      
      if (error) {
        console.error('Toggle error:', error);
        // Revert the UI state if there was an error
        setIsOn(!newState);
        throw error;
      }
      
      console.log('Toggle response:', data);
      lastUpdateTimeRef.current = Date.now();
      
      // The subscription should handle the state update, but we'll update it here as well just in case
      if (data && data.length > 0) {
        setIsOn(data[0].is_on);
      }
      
      // Force an immediate poll to ensure other clients get the update
      fetchLightbulbState();
      
    } catch (error) {
      console.error('Error toggling lightbulb:', error);
      setErrorMessage(`Error toggling lightbulb: ${handleSupabaseError(error)}`);
      setTimeout(() => setErrorMessage(null), 5000); // Clear error after 5 seconds
    } finally {
      setToggleLoading(false);
    }
  };

  const handleReconnect = () => {
    setRealtimeStatus('Reconnecting...');
    setUsePollingOnly(false);
    const cleanupRealtime = setupRealtimeSubscription();
    return () => cleanupRealtime();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-4">
        <div className="bg-red-800/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h2>
          <p className="text-white mb-4">
            {errorMessage || 'Unable to connect to the database.'}
          </p>
          <div className="bg-gray-800 p-4 rounded mb-4 overflow-auto">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {`1. Make sure you&apos;ve created a Supabase account and project
2. Run the SQL in supabase/schema.sql in the SQL Editor
3. Update .env.local with your Supabase URL and anon key
4. Enable realtime for the lightbulb table in Supabase dashboard`}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-pulse text-white text-xl">
          Connecting to the lightbulb...
        </div>
      </div>
    );
  }

  // Calculate time since last update
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdateTimeRef.current) / 1000);
  const lastUpdateText = timeSinceUpdate < 60 
    ? `Last update: ${timeSinceUpdate} seconds ago` 
    : `Last update: ${Math.floor(timeSinceUpdate / 60)} minutes ago`;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 transition-colors duration-500">
      <div 
        className={`cursor-pointer transform transition-transform hover:scale-105 ${toggleLoading ? 'opacity-50' : ''}`}
        onClick={toggleLoading ? undefined : toggleLight}
      >
        {isOn ? (
          <div className="relative">
            <svg width="200" height="300" viewBox="0 0 100 150">
              <circle cx="50" cy="50" r="40" fill="#FFF176" className="animate-pulse" />
              <circle cx="50" cy="50" r="30" fill="#FFEB3B" />
              <path d="M 40 90 L 40 110 Q 40 120 50 120 Q 60 120 60 110 L 60 90 Z" fill="#B0BEC5" />
              <path d="M 40 110 L 60 110" stroke="#78909C" strokeWidth="2" />
              <path d="M 40 100 L 60 100" stroke="#78909C" strokeWidth="2" />
            </svg>
            <div className="absolute inset-0 bg-yellow-300 opacity-20 rounded-full blur-xl animate-pulse"></div>
          </div>
        ) : (
          <svg width="200" height="300" viewBox="0 0 100 150">
            <circle cx="50" cy="50" r="40" fill="#B0BEC5" />
            <circle cx="50" cy="50" r="30" fill="#78909C" />
            <path d="M 40 90 L 40 110 Q 40 120 50 120 Q 60 120 60 110 L 60 90 Z" fill="#B0BEC5" />
            <path d="M 40 110 L 60 110" stroke="#78909C" strokeWidth="2" />
            <path d="M 40 100 L 60 100" stroke="#78909C" strokeWidth="2" />
          </svg>
        )}
      </div>
      <p className="mt-8 text-2xl font-bold text-white">
        {isOn ? "The light is ON!" : "The light is OFF!"}
      </p>
      <p className="mt-4 text-gray-400">
        Click the lightbulb to toggle it {isOn ? "off" : "on"}
      </p>
      <p className="mt-8 text-sm text-gray-500">
        This lightbulb is connected globally - if you change it, everyone sees the change!
      </p>
      
      {errorMessage && (
        <div className="mt-4 p-2 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
          {errorMessage}
        </div>
      )}
      
      {toggleLoading && (
        <div className="mt-4 text-blue-400 animate-pulse">
          Updating...
        </div>
      )}
      
      <div className="fixed bottom-20 left-0 right-0 flex flex-col items-center">
        <div className={`px-4 py-2 rounded-full text-xs mb-2 ${
          realtimeStatus?.includes('WebSocket') 
            ? 'bg-blue-900/50 text-blue-400 animate-pulse' 
            : realtimeStatus === 'Real-time updates active' 
              ? 'bg-green-900/50 text-green-400' 
              : realtimeStatus?.includes('polling') 
                ? 'bg-yellow-900/50 text-yellow-400'
                : 'bg-gray-900/50 text-gray-400'
        }`}>
          {realtimeStatus || 'Connecting...'}
          {(realtimeStatus?.includes('failed') || realtimeStatus?.includes('timed out') || realtimeStatus?.includes('using polling')) && (
            <button 
              onClick={handleReconnect}
              className="ml-2 underline"
            >
              Try WebSocket
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {lastUpdateText}
        </div>
      </div>
    </div>
  );
} 