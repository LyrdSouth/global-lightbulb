'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { handleSupabaseError } from '../utils/errorHandler';

export default function Lightbulb() {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);

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
    const fetchLightbulbState = async () => {
      try {
        console.log('Fetching lightbulb state...');
        const { data, error } = await supabase
          .from('lightbulb')
          .select('is_on')
          .single();
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Lightbulb data:', data);
        if (data) {
          setIsOn(data.is_on);
        }
      } catch (error) {
        console.error('Error fetching lightbulb state:', error);
        setError(error as Error);
        setErrorMessage(
          'Could not connect to the lightbulb database. Make sure you have created the lightbulb table in Supabase and configured your environment variables correctly.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLightbulbState();

    // Set up real-time subscription
    setupRealtimeSubscription();

    // Poll for updates as a fallback
    const pollInterval = setInterval(() => {
      fetchLightbulbState();
    }, 5000); // Poll every 5 seconds as a fallback

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Separate function to set up real-time subscription
  const setupRealtimeSubscription = () => {
    setRealtimeStatus('Connecting to real-time updates...');
    
    // First, remove any existing channels
    supabase.removeAllChannels();
    
    // Create a new channel
    const channel = supabase
      .channel('lightbulb-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'lightbulb' 
        }, 
        (payload) => {
          console.log('Received update:', payload);
          setIsOn(payload.new.is_on);
          setRealtimeStatus('Real-time updates active');
          // Flash a notification that an update was received
          setRealtimeStatus('Update received!');
          setTimeout(() => setRealtimeStatus('Real-time updates active'), 2000);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('Real-time updates active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
          setRealtimeStatus('Real-time updates failed - using polling fallback');
        } else {
          setRealtimeStatus(`Real-time status: ${status}`);
        }
      });

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
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
      
      // The subscription should handle the state update, but we'll update it here as well just in case
      if (data && data.length > 0) {
        setIsOn(data[0].is_on);
      }
      
      // Reconnect to real-time updates to ensure we're getting updates
      setupRealtimeSubscription();
      
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
    setupRealtimeSubscription();
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
      
      <div className="fixed bottom-20 left-0 right-0 flex justify-center">
        <div className={`px-4 py-2 rounded-full text-xs ${
          realtimeStatus === 'Real-time updates active' 
            ? 'bg-green-900/50 text-green-400' 
            : realtimeStatus === 'Update received!' 
              ? 'bg-blue-900/50 text-blue-400 animate-pulse' 
              : 'bg-yellow-900/50 text-yellow-400'
        }`}>
          {realtimeStatus || 'Connecting...'}
          {realtimeStatus !== 'Real-time updates active' && realtimeStatus !== 'Update received!' && (
            <button 
              onClick={handleReconnect}
              className="ml-2 underline"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 